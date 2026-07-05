import { useEffect, useRef, type MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { Listing } from '@/hooks/useListings';

/**
 * Native Mapbox clustering for large result sets. DOM price-pill markers
 * (useMapMarkers) stay the richer experience for small sets; above the
 * threshold EnhancedMap swaps to these canvas layers, which handle thousands
 * of points without DOM cost.
 *
 * Click resolution goes through a ref (not a closure) so clicks always
 * resolve against the CURRENT listings — the previous implementation
 * captured the first listings array forever.
 */

const SOURCE_ID = 'listings-cluster';
const LAYER_IDS = ['clusters', 'cluster-count', 'unclustered-point', 'unclustered-price'];

// Matches useMapMarkers typeColors / the MapLegend shown in /explorar.
const TYPE_COLOR_MATCH: mapboxgl.Expression = [
  'match',
  ['get', 'type'],
  'parcela_rural', '#22c55e',
  'campo_agricola', '#84cc16',
  'terreno_urbano', '#3b82f6',
  'sitio_industrial', '#f59e0b',
  'terreno_costero', '#06b6d4',
  'terreno_montana', '#8b5cf6',
  'inversion', '#ec4899',
  '#10b981',
];

interface ClusterHandlers {
  listings: Listing[];
  onListingClick?: (listing: Listing) => void;
}

const toGeoJSON = (listings: Listing[]): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: listings
    .filter((l) => l.lat && l.lng)
    .map((listing) => ({
      type: 'Feature' as const,
      properties: {
        id: listing.id,
        price: listing.price,
        type: listing.type,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [listing.lng!, listing.lat!],
      },
    })),
});

const addLayersAndHandlers = (
  map: mapboxgl.Map,
  handlersRef: MutableRefObject<ClusterHandlers>,
) => {
  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data: toGeoJSON(handlersRef.current.listings),
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#10b981',
        10, '#3b82f6',
        25, '#8b5cf6',
        50, '#f59e0b',
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        18,
        10, 24,
        25, 30,
        50, 38,
      ],
      'circle-stroke-width': 3,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.85)',
    },
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 13,
      'text-allow-overlap': true,
    },
    paint: { 'text-color': '#ffffff' },
  });

  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': TYPE_COLOR_MATCH,
      'circle-radius': 9,
      'circle-stroke-width': 2.5,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.9)',
    },
  });

  map.addLayer({
    id: 'unclustered-price',
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': [
        'concat',
        '$',
        [
          'case',
          ['>=', ['get', 'price'], 1000000000],
          ['concat', ['to-string', ['round', ['/', ['get', 'price'], 100000000]]], ''],
          ['>=', ['get', 'price'], 1000000],
          ['concat', ['to-string', ['round', ['/', ['get', 'price'], 1000000]]], 'M'],
          ['to-string', ['round', ['/', ['get', 'price'], 1000]]],
        ],
      ],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 11,
      'text-offset': [0, -1.6],
      'text-anchor': 'bottom',
      'text-optional': true,
    },
    paint: {
      'text-color': '#1e293b',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  });

  // ── Interactions (registered once per style; resolve via ref) ──
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    if (!features.length) return;
    const clusterId = features[0].properties?.cluster_id;
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      const geometry = features[0].geometry as GeoJSON.Point;
      map.easeTo({
        center: geometry.coordinates as [number, number],
        zoom: (zoom ?? 14) + 0.5,
        duration: 500,
      });
    });
  });

  map.on('click', 'unclustered-point', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
    const listingId = features[0]?.properties?.id;
    if (!listingId) return;
    const { listings, onListingClick } = handlersRef.current;
    const listing = listings.find((l) => l.id === listingId);
    if (listing) onListingClick?.(listing);
  });

  for (const layer of ['clusters', 'unclustered-point']) {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  }
};

export const removeClusterLayers = (map: mapboxgl.Map) => {
  for (const layer of LAYER_IDS) {
    if (map.getLayer(layer)) map.removeLayer(layer);
  }
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
};

interface UseMapClusteringOptions {
  map: MutableRefObject<mapboxgl.Map | null>;
  styleLoadedRef: MutableRefObject<boolean>;
  isLoading: boolean;
  listings: Listing[];
  enabled: boolean;
  onListingClick?: (listing: Listing) => void;
}

/**
 * Keeps the cluster source/layers in sync with `listings` while `enabled`,
 * removing them otherwise. Survives style changes (re-adds on style.load).
 */
export const useMapClustering = ({
  map,
  styleLoadedRef,
  isLoading,
  listings,
  enabled,
  onListingClick,
}: UseMapClusteringOptions) => {
  const handlersRef = useRef<ClusterHandlers>({ listings, onListingClick });
  useEffect(() => {
    handlersRef.current = { listings, onListingClick };
  });

  const enabledRef = useRef(enabled);
  useEffect(() => { enabledRef.current = enabled; });

  // Sync source/layers with enabled + listings.
  useEffect(() => {
    const m = map.current;
    if (!m || isLoading || !styleLoadedRef.current) return;

    if (!enabled) {
      removeClusterLayers(m);
      return;
    }

    const source = m.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(toGeoJSON(listings));
      console.debug('[cluster] setData', listings.length);
    } else {
      addLayersAndHandlers(m, handlersRef);
      console.debug('[cluster] layers added', listings.length);
    }
  }, [map, isLoading, styleLoadedRef, listings, enabled]);

  // Re-add after a style change wipes custom layers (map mode switch).
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const onStyleLoad = () => {
      if (enabledRef.current && !m.getSource(SOURCE_ID)) {
        addLayersAndHandlers(m, handlersRef);
      }
    };
    m.on('style.load', onStyleLoad);
    return () => { m.off('style.load', onStyleLoad); };
  }, [map, isLoading]);
};
