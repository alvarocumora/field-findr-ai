-- Fix the overly permissive RLS policy on payments table
-- Drop the permissive policy
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

-- Create proper insert policy for users
CREATE POLICY "Users can create their own payments"
ON public.payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);