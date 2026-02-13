
-- Enums
CREATE TYPE public.closing_step_type AS ENUM ('reserva', 'promesa', 'escritura', 'inscripcion_cbr');
CREATE TYPE public.closing_step_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');
CREATE TYPE public.credit_status AS ENUM ('active', 'completed', 'defaulted', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'overdue', 'partial');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- ========== CREDITS ==========
CREATE TABLE public.credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES public.reservations(id),
  lot_id uuid REFERENCES public.lots(id) NOT NULL,
  user_id uuid NOT NULL,  -- seller
  buyer_user_id uuid,     -- buyer (nullable if no account)
  total_amount numeric NOT NULL,
  down_payment numeric NOT NULL DEFAULT 0,
  financed_amount numeric NOT NULL,
  interest_rate numeric NOT NULL DEFAULT 0,
  term_months integer NOT NULL,
  monthly_payment numeric NOT NULL,
  status credit_status NOT NULL DEFAULT 'active',
  contract_url text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  next_payment_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage their credits" ON public.credits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Buyers can view their credits" ON public.credits
  FOR SELECT USING (auth.uid() = buyer_user_id);

CREATE POLICY "Admins manage all credits" ON public.credits
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CREDIT PAYMENTS ==========
CREATE TABLE public.credit_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid REFERENCES public.credits(id) ON DELETE CASCADE NOT NULL,
  payment_number integer NOT NULL,
  amount numeric NOT NULL,
  due_date timestamp with time zone NOT NULL,
  paid_date timestamp with time zone,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method text,
  receipt_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credit owners manage payments" ON public.credit_payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.credits WHERE credits.id = credit_payments.credit_id AND credits.user_id = auth.uid())
  );

CREATE POLICY "Buyers can view their payments" ON public.credit_payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.credits WHERE credits.id = credit_payments.credit_id AND credits.buyer_user_id = auth.uid())
  );

CREATE POLICY "Admins manage all payments" ON public.credit_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: update next_payment_date on credit when payment is marked paid
CREATE OR REPLACE FUNCTION public.update_next_payment_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE public.credits
    SET next_payment_date = (
      SELECT MIN(due_date) FROM public.credit_payments
      WHERE credit_id = NEW.credit_id AND status IN ('pending', 'overdue')
    )
    WHERE id = NEW.credit_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_next_payment
  AFTER UPDATE ON public.credit_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_next_payment_date();

-- ========== CLOSING STEPS ==========
CREATE TABLE public.closing_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES public.reservations(id),
  credit_id uuid REFERENCES public.credits(id),
  step_type closing_step_type NOT NULL,
  status closing_step_status NOT NULL DEFAULT 'pending',
  completed_at timestamp with time zone,
  document_url text,
  notes text,
  assigned_to text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.closing_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reservation owners manage closing steps" ON public.closing_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.lots l ON l.id = r.lot_id
      JOIN public.projects p ON p.id = l.project_id
      WHERE r.id = closing_steps.reservation_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view their closing steps" ON public.closing_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.reservations WHERE reservations.id = closing_steps.reservation_id AND reservations.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all closing steps" ON public.closing_steps
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create closing steps when reservation is paid
CREATE OR REPLACE FUNCTION public.create_closing_steps_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    INSERT INTO public.closing_steps (reservation_id, step_type, status)
    VALUES
      (NEW.id, 'reserva', 'completed'),
      (NEW.id, 'promesa', 'pending'),
      (NEW.id, 'escritura', 'pending'),
      (NEW.id, 'inscripcion_cbr', 'pending');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_closing_steps
  AFTER UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.create_closing_steps_on_paid();

-- ========== AUDIT LOGS ==========
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========== PROPERTY APPROVALS ==========
CREATE TABLE public.property_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid,
  status approval_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage approvals" ON public.property_approvals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners can view their listing approvals" ON public.property_approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.listings WHERE listings.id = property_approvals.listing_id AND listings.user_id = auth.uid())
  );
