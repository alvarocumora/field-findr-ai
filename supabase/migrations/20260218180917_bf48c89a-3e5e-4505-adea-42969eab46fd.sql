-- Fix overly permissive RLS policy on payments table
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;
