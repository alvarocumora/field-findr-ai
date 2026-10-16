/** Resolve inventory links by ID, never by a project or lot label. */
export function getExploreLotPath(listingId?: string | null): string | null {
  return listingId ? `/explorar?listing=${encodeURIComponent(listingId)}` : null;
}