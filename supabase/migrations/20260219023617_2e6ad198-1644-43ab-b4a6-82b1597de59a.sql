
-- Add currency column to credits table
ALTER TABLE public.credits ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CLP';

-- Create function to mark overdue payments automatically
CREATE OR REPLACE FUNCTION public.mark_overdue_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.credit_payments
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < now();
END;
$$;
