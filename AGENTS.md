- Enlaces compartibles: siempre vía `src/lib/publicUrls.ts` (getCanonicalUrl/getShareUrl); URLs de auth y pagos usan window.location.origin. Why: previews no deben filtrar dominios lovable.app.

- Inventario único: cada lote publicado se enlaza con su tarjeta (`lots.listing_id`) y la tarjeta conoce su loteo vía `listings.project_id`; nunca agrupar por etiquetas de texto. Why: el explorador, la portada y el masterplan deben mostrar los mismos lotes.

- Panorama lot overlays remain angular annotations in `tour_scenes`, linked to live lot IDs; never replace geographic lot geometry with image-space coordinates. Why: visual alignment must not alter surveyed inventory.

- Explorer card deep links use `?listing=<listing_id>` and load the individual listing independently of feed filters/pagination. Why: tour links must open the exact parcel, including reserved inventory.
