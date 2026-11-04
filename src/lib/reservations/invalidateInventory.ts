import type { QueryClient } from '@tanstack/react-query';

// A reservation changes the same inventory shown by broker, buyer and public
// surfaces. Prefixes cover identity/project variants without flushing auth/CRM.
const INVENTORY_PREFIXES = new Set([
  'reservations', 'reservation', 'admin-reservations', 'lot-reservations',
  'reservation-stats', 'buyer-reservations', 'buyer-journey', 'expiring-reservations',
  'lots', 'projects', 'project', 'project-lots', 'sales-kit-stock',
  'inventory-map-lots', 'inventory-map-projects', 'landing-showcase-projects',
  'reservation-form-lots', 'vel-public-lots', 'explora-park-public-lots',
  'infinite-listings', 'listings', 'listing',
]);

export function invalidateReservationInventory(client: QueryClient) {
  return client.invalidateQueries({
    predicate: query => INVENTORY_PREFIXES.has(String(query.queryKey[0])),
  });
}
