import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Listing, formatPrice } from '@/hooks/useListings';

interface MapClusterLayerProps {
  map: mapboxgl.Map | null;
  listings: Listing[];
  onClusterClick?: (features: Listing[]) => void;
  onMarkerClick?: (listing: Listing) => void;
}

const statusColors = {
  active: '#10b981',
  reserved: '#f59e0b',
  sold: '#ef4444',
};

export const setupClusterLayers = (
  map: mapboxgl.Map,
  listings: Listing[],
  onMarkerClick?: (listing: Listing) => void
) => {
  // Create GeoJSON source for clustering
  const geojsonData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: listings
      .filter(l => l.lat && l.lng)
      .map(listing => ({
        type: 'Feature' as const,
        properties: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          status: listing.status,
          type: listing.type,
          area_m2: listing.area_m2,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [listing.lng!, listing.lat!],
        },
      })),
  };

  // Check if source already exists
  if (map.getSource('listings-cluster')) {
    (map.getSource('listings-cluster') as mapboxgl.GeoJSONSource).setData(geojsonData);
    return;
  }

  // Add source with clustering enabled
  map.addSource('listings-cluster', {
    type: 'geojson',
    data: geojsonData,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
    clusterProperties: {
      sum_price: ['+', ['get', 'price']],
      count_active: ['+', ['case', ['==', ['get', 'status'], 'active'], 1, 0]],
    },
  });

  // Cluster circles layer
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'listings-cluster',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#10b981', // Green for small clusters
        5, '#3b82f6', // Blue for medium
        10, '#8b5cf6', // Purple for large
        25, '#f59e0b', // Orange for very large
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        20,
        5, 25,
        10, 30,
        25, 40,
      ],
      'circle-stroke-width': 3,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.8)',
    },
  });

  // Cluster count label
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'listings-cluster',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 14,
    },
    paint: {
      'text-color': '#ffffff',
    },
  });

  // Individual point layer (unclustered)
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'listings-cluster',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': [
        'match',
        ['get', 'status'],
        'active', statusColors.active,
        'reserved', statusColors.reserved,
        'sold', statusColors.sold,
        statusColors.active,
      ],
      'circle-radius': 10,
      'circle-stroke-width': 3,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.9)',
    },
  });

  // Price label for unclustered points
  map.addLayer({
    id: 'unclustered-price',
    type: 'symbol',
    source: 'listings-cluster',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': [
        'concat',
        '$',
        [
          'case',
          ['>=', ['get', 'price'], 1000000000],
          ['concat', ['to-string', ['round', ['/', ['get', 'price'], 1000000000]]], 'B'],
          ['>=', ['get', 'price'], 1000000],
          ['concat', ['to-string', ['round', ['/', ['get', 'price'], 1000000]]], 'M'],
          ['to-string', ['round', ['/', ['get', 'price'], 1000]]],
        ],
      ],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 11,
      'text-offset': [0, -2],
      'text-anchor': 'bottom',
    },
    paint: {
      'text-color': '#1e293b',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  });

  // Click handlers
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    if (!features.length) return;

    const clusterId = features[0].properties?.cluster_id;
    const source = map.getSource('listings-cluster') as mapboxgl.GeoJSONSource;

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return;
      const geometry = features[0].geometry as GeoJSON.Point;
      map.easeTo({
        center: geometry.coordinates as [number, number],
        zoom: zoom || 14,
        duration: 500,
      });
    });
  });

  map.on('click', 'unclustered-point', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
    if (!features.length || !onMarkerClick) return;

    const listingId = features[0].properties?.id;
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
      onMarkerClick(listing);
    }
  });

  // Cursor changes
  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('mouseenter', 'unclustered-point', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'unclustered-point', () => {
    map.getCanvas().style.cursor = '';
  });
};

export const removeClusterLayers = (map: mapboxgl.Map) => {
  const layers = ['clusters', 'cluster-count', 'unclustered-point', 'unclustered-price'];
  
  layers.forEach(layer => {
    if (map.getLayer(layer)) {
      map.removeLayer(layer);
    }
  });

  if (map.getSource('listings-cluster')) {
    map.removeSource('listings-cluster');
  }
};

export default function MapClusterLayer({
  map,
  listings,
  onMarkerClick,
}: MapClusterLayerProps) {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    setupClusterLayers(map, listings, onMarkerClick);

    return () => {
      if (map && map.isStyleLoaded()) {
        removeClusterLayers(map);
      }
    };
  }, [map, listings, onMarkerClick]);

  return null;
}
