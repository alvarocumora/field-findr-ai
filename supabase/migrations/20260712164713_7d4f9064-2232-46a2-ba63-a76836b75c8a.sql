-- Restore full SELECT for authenticated users on lots (RLS still restricts rows to owners
-- for private data, and to active-project lots for browsing). This fixes the regression
-- where owners lost visibility of their own lots in the project detail because the
-- previous column-level GRANT broke `SELECT *`.
--
-- Anon keeps the safe (non-PII) column-level grant established in the prior security
-- migration, so public marketplace visitors still cannot read buyer_name/email/phone.
GRANT SELECT ON public.lots TO authenticated;