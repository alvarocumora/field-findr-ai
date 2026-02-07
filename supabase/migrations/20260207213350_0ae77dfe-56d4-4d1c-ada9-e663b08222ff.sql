-- Create reservation status enum
CREATE TYPE public.reservation_status AS ENUM ('pending_payment', 'paid', 'expired', 'cancelled', 'converted');

-- Create reservations table
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    
    -- Buyer info (denormalized for quick access)
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL,
    buyer_phone TEXT,
    buyer_rut TEXT,
    
    -- Reservation details
    reservation_amount NUMERIC NOT NULL DEFAULT 500000,
    currency TEXT NOT NULL DEFAULT 'CLP',
    status reservation_status NOT NULL DEFAULT 'pending_payment',
    
    -- Payment tracking
    mercadopago_preference_id TEXT,
    mercadopago_payment_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiration (48-72 hours to pay)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours'),
    
    -- Contract conversion
    contract_id UUID,
    converted_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservations

-- Project owners can view reservations for their lots
CREATE POLICY "Project owners can view lot reservations"
ON public.reservations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.lots l
        JOIN public.projects p ON l.project_id = p.id
        WHERE l.id = reservations.lot_id
        AND p.user_id = auth.uid()
    )
);

-- Project owners can manage reservations for their lots
CREATE POLICY "Project owners can insert reservations"
ON public.reservations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.lots l
        JOIN public.projects p ON l.project_id = p.id
        WHERE l.id = lot_id
        AND p.user_id = auth.uid()
    )
    OR auth.uid() = user_id
);

CREATE POLICY "Project owners can update reservations"
ON public.reservations
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.lots l
        JOIN public.projects p ON l.project_id = p.id
        WHERE l.id = reservations.lot_id
        AND p.user_id = auth.uid()
    )
);

CREATE POLICY "Project owners can delete reservations"
ON public.reservations
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.lots l
        JOIN public.projects p ON l.project_id = p.id
        WHERE l.id = reservations.lot_id
        AND p.user_id = auth.uid()
    )
);

-- Users can view their own reservations
CREATE POLICY "Users can view their own reservations"
ON public.reservations
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-update lot status when reservation is paid
CREATE OR REPLACE FUNCTION public.handle_reservation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When reservation is paid, update lot to reserved
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        UPDATE public.lots
        SET status = 'reserved',
            reservation_date = now(),
            buyer_name = NEW.buyer_name,
            buyer_email = NEW.buyer_email,
            buyer_phone = NEW.buyer_phone
        WHERE id = NEW.lot_id;
    END IF;
    
    -- When reservation expires or is cancelled, release the lot
    IF NEW.status IN ('expired', 'cancelled') AND OLD.status = 'pending_payment' THEN
        UPDATE public.lots
        SET status = 'available',
            reservation_date = NULL
        WHERE id = NEW.lot_id AND status = 'reserved';
    END IF;
    
    -- When reservation is converted to contract, update lot to sold
    IF NEW.status = 'converted' AND OLD.status = 'paid' THEN
        UPDATE public.lots
        SET status = 'sold',
            sale_date = now()
        WHERE id = NEW.lot_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for reservation status changes
CREATE TRIGGER on_reservation_status_change
AFTER INSERT OR UPDATE OF status ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_status_change();

-- Create index for performance
CREATE INDEX idx_reservations_lot_id ON public.reservations(lot_id);
CREATE INDEX idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_expires_at ON public.reservations(expires_at) WHERE status = 'pending_payment';