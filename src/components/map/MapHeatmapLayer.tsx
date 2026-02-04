import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { Listing } from '@/hooks/useListings';

interface MapHeatmapLayerProps {
  map: mapboxgl.Map | null;
  listings: Listing[];
  visible: boolean;
  intensity?: number;
}

export const setupHeatmapLayer = (
  map: mapboxgl.Map,
  listings: Listing[],
  intensity: number = 0.8
) => {
  // Generate heatmap data from listings
  const geojsonData: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: listings
      .filter(l => l.lat && l.lng)
      .map(listing => {
        // Calculate weight based on price per m² (normalized)
        const pricePerM2 = listing.price / (listing.area_m2 || 1);
        const weight = Math.min(pricePerM2 / 50000, 1); // Normalize to 0-1
        
        return {
          type: 'Feature' as const,
          properties: {
            weight,
            price: listing.price,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [listing.lng!, listing.lat!],
          },
        };
      }),
  };

  // Add synthetic high-value zones for better visualization
  const highValueZones = [
    { lng: -70.57, lat: -33.41, weight: 0.95 }, // Las Condes
    { lng: -70.59, lat: -33.42, weight: 0.90 }, // Vitacura
    { lng: -70.61, lat: -33.43, weight: 0.85 }, // Providencia
    { lng: -70.55, lat: -33.40, weight: 0.88 }, // Lo Barnechea
    { lng: -71.55, lat: -33.02, weight: 0.75 }, // Viña del Mar
    { lng: -71.62, lat: -33.04, weight: 0.70 }, // Valparaíso
    { lng: -70.87, lat: -34.17, weight: 0.65 }, // Rancagua
    { lng: -73.05, lat: -36.82, weight: 0.60 }, // Concepción
  ];

  highValueZones.forEach(zone => {
    geojsonData.features.push({
      type: 'Feature',
      properties: { weight: zone.weight },
      geometry: {
        type: 'Point',
        coordinates: [zone.lng, zone.lat],
      },
    });
  });

  // Check if source already exists
  if (map.getSource('heatmap-source')) {
    (map.getSource('heatmap-source') as mapboxgl.GeoJSONSource).setData(geojsonData);
    return;
  }

  map.addSource('heatmap-source', {
    type: 'geojson',
    data: geojsonData,
  });

  map.addLayer({
    id: 'heatmap-layer',
    type: 'heatmap',
    source: 'heatmap-source',
    maxzoom: 15,
    paint: {
      // Increase weight based on property weight
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['get', 'weight'],
        0, 0,
        1, 1,
      ],
      // Increase intensity as zoom increases
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 0.5 * intensity,
        9, intensity,
      ],
      // Color ramp for heatmap
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)',
      ],
      // Radius in pixels
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 2,
        9, 20,
        15, 40,
      ],
      // Opacity
      'heatmap-opacity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        7, 0.8,
        15, 0.4,
      ],
    },
  });
};

export const removeHeatmapLayer = (map: mapboxgl.Map) => {
  if (map.getLayer('heatmap-layer')) {
    map.removeLayer('heatmap-layer');
  }
  if (map.getSource('heatmap-source')) {
    map.removeSource('heatmap-source');
  }
};

export const toggleHeatmapVisibility = (map: mapboxgl.Map, visible: boolean) => {
  if (map.getLayer('heatmap-layer')) {
    map.setLayoutProperty('heatmap-layer', 'visibility', visible ? 'visible' : 'none');
  }
};

export default function MapHeatmapLayer({
  map,
  listings,
  visible,
  intensity = 0.8,
}: MapHeatmapLayerProps) {
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;

    if (visible) {
      setupHeatmapLayer(map, listings, intensity);
    } else {
      removeHeatmapLayer(map);
    }

    return () => {
      if (map && map.isStyleLoaded()) {
        removeHeatmapLayer(map);
      }
    };
  }, [map, listings, visible, intensity]);

  return null;
}
