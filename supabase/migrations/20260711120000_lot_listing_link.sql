-- Link a project lot to a published marketplace listing (a "card").
--
-- Lots (the masterplan geometry carriers) were disjoint from `listings` (the
-- public marketplace cards): there was no way to publish a lot to the
-- marketplace and keep the two in sync. This adds the link so a lot can point
-- at the listing it was published as. ON DELETE SET NULL so removing a listing
-- just unlinks the lot rather than deleting it.

ALTER TABLE public.lots
  ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lots_listing_id ON public.lots(listing_id);

COMMENT ON COLUMN public.lots.listing_id IS
  'Marketplace listing this lot was published as (card). NULL = not published.';
