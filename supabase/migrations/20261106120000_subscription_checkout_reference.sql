-- The subscription return pages (SubscriptionSuccess/SubscriptionPending)
-- previously confirmed "payment succeeded" by checking subscriptions.status
-- scoped only by user_id. Any user with ANY active subscription — their own
-- from a prior purchase, or an org's — saw "success" regardless of whether
-- the checkout they just started actually completed.
--
-- last_checkout_id lets the webhook stamp exactly which checkout activated a
-- subscription, so the return page can verify THIS specific checkout instead
-- of trusting the URL or an unrelated pre-existing active row.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS last_checkout_id uuid;

COMMENT ON COLUMN public.subscriptions.last_checkout_id IS
  'Correlates the subscription row with the exact MercadoPago checkout (external_reference.checkout_id) that activated it. Used by the client to verify a specific checkout instead of any pre-existing active subscription.';
