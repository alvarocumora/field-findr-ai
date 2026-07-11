-- Keep a published lot's marketplace card in sync with the lot.
--
-- A lot can be published to `listings` (lots.listing_id). Price/status edits on
-- the lot — whether a single update or the bulk adjust_lot_prices RPC — should
-- flow to the linked card so the marketplace never shows a stale price or an
-- available lot that was already sold. A trigger covers every UPDATE path.
--
-- Guardrails: never resurrect a card the owner deliberately took down
-- (inactive/rejected) and never auto-promote a card still awaiting approval
-- (pending_review) to active.

CREATE OR REPLACE FUNCTION public.sync_listing_from_lot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.listing_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.listings AS l SET
    price = CASE
      WHEN NEW.price IS NOT NULL AND NEW.price IS DISTINCT FROM OLD.price THEN NEW.price
      ELSE l.price
    END,
    status = CASE
      WHEN l.status IN ('inactive', 'rejected') THEN l.status
      WHEN NEW.status = 'reserved' THEN 'reserved'
      WHEN NEW.status = 'sold' THEN 'sold'
      WHEN NEW.status = 'available' AND l.status IN ('reserved', 'sold') THEN 'active'
      ELSE l.status
    END,
    updated_at = now()
  WHERE l.id = NEW.listing_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_from_lot ON public.lots;
CREATE TRIGGER trg_sync_listing_from_lot
  AFTER UPDATE OF price, status ON public.lots
  FOR EACH ROW
  WHEN (NEW.listing_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_listing_from_lot();
