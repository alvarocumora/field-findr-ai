
-- Create visit_requests table
CREATE TABLE public.visit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  listing_owner_id uuid NOT NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_phone text,
  preferred_date timestamp with time zone NOT NULL,
  preferred_time text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone authenticated can create visit requests"
  ON public.visit_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Listing owners can view visit requests"
  ON public.visit_requests FOR SELECT
  USING (auth.uid() = listing_owner_id);

CREATE POLICY "Listing owners can update visit requests"
  ON public.visit_requests FOR UPDATE
  USING (auth.uid() = listing_owner_id);

CREATE POLICY "Admins can manage all visit requests"
  ON public.visit_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_visit_requests_updated_at
  BEFORE UPDATE ON public.visit_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
