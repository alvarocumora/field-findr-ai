import type { Listing } from '@/hooks/useListings';

/** A saved relation does not imply a live commercial offer. */
export const isPublishedFavorite = (listing: Pick<Listing, 'status' | 'is_demo'> | null | undefined): boolean =>
  !!listing && listing.status === 'active' && listing.is_demo === false;

export const favoritePriceLabel = (
  listing: Pick<Listing, 'price' | 'currency' | 'status' | 'is_demo'> | null | undefined,
): string | null => {
  if (!isPublishedFavorite(listing) || !Number.isFinite(listing!.price) || listing!.price <= 0) return null;
  if (listing!.currency?.toUpperCase() === 'UF') return `${listing!.price.toLocaleString('es-CL', { maximumFractionDigits: 2 })} UF`;
  return `$${Math.round(listing!.price).toLocaleString('es-CL')} ${(listing!.currency || 'CLP').toUpperCase()}`;
};
