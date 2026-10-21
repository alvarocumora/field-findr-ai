- Enlaces compartibles: siempre vía `src/lib/publicUrls.ts` (getCanonicalUrl/getShareUrl); URLs de auth y pagos usan window.location.origin. Why: previews no deben filtrar dominios lovable.app.

- Inventario único: cada lote publicado se enlaza con su tarjeta (`lots.listing_id`) y la tarjeta conoce su loteo vía `listings.project_id`; nunca agrupar por etiquetas de texto. Why: el explorador, la portada y el masterplan deben mostrar los mismos lotes.

- Panorama lot overlays remain angular annotations in `tour_scenes`, linked to live lot IDs; never replace geographic lot geometry with image-space coordinates. Why: visual alignment must not alter surveyed inventory.

- Explorer card deep links use `?listing=<listing_id>` and load the individual listing independently of feed filters/pagination. Why: tour links must open the exact parcel, including reserved inventory.

- Rural Institutional design system is a scoped theme: pages adopt it by wrapping in `.theme-rural` (tokens in `src/index.css`), never by hardcoding paper/ink hex values. Why: incremental migration without breaking dark panels.

- Explorer text search is server-side (`ListingFilters.search` in `useInfiniteListings`), never a client filter over loaded pages. Why: search must cover the full inventory.
- Project pages: `/p/:slug`, historical slugs and `/proyecto/:id` all render `ProjectDetail` inside the public shell (bespoke landings removed; satellite tour/plano routes redirect with `?tab=`/`?lote=`). Why: one project experience with tour 360, masterplan, lot sheet and reservation.
- Simple public credit simulations reuse the buyer-tools French calculation through a finite-input adapter; project links pass selected live CLP prices to the homepage widget and inquiries reuse the canonical project consultation with campaign attribution. Why: no second credit workflow, no inventory mutation, and financing intent remains in the existing CRM.
- LotMapView creates its Mapbox instance only per token/style/mode/retry; inventory, center, colour and roads sync onto live sources via setData, and WebGL probing is cached and released. Why: rebuild loops exhaust browser WebGL contexts and blank both the map and the 360 tour.
