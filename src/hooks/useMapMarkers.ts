import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import { InfoLayerState } from '@/components/map/MapInfoLayers';
import { IsochroneProfile } from '@/hooks/useIsochrone';

interface UseMapMarkersOptions {
  map: MutableRefObject<mapboxgl.Map | null>;
  popupRef: MutableRefObject<mapboxgl.Popup | null>;
  listings: Listing[];
  hoveredListing?: Listing | null;
  selectedListing?: Listing | null;
  onListingHover?: (listing: Listing | null) => void;
  onListingClick?: (listing: Listing) => void;
  isLoading: boolean;
  infoLayers: InfoLayerState;
  fetchIsochrone: (lng: number, lat: number) => void;
}

const statusColors: Record<string, string> = {
  active: '#10b981',
  reserved: '#f59e0b',
  sold: '#ef4444',
};

const statusLabels: Record<string, string> = {
  active: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

const typeColors: Record<string, string> = {
  parcela_rural: '#22c55e',
  campo_agricola: '#84cc16',
  terreno_urbano: '#3b82f6',
  sitio_industrial: '#f59e0b',
  terreno_costero: '#06b6d4',
  terreno_montana: '#8b5cf6',
  inversion: '#ec4899',
};

const formatCompactPrice = (price: number): string => {
  if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}B`;
  if (price >= 1000000) return `${(price / 1000000).toFixed(0)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return price.toString();
};

const createPopupHTML = (listing: Listing) => `
  <div class="enhanced-map-popup" style="font-family: system-ui, -apple-system, sans-serif; min-width: 260px;">
    <div style="position: relative; height: 120px; border-radius: 12px 12px 0 0; overflow: hidden;">
      <img src="${listing.images[0] || '/placeholder.svg'}" alt="${listing.title}" style="width: 100%; height: 100%; object-fit: cover;" />
      <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
      <div style="position: absolute; bottom: 8px; left: 8px; right: 8px;">
        <span style="font-size: 10px; padding: 3px 8px; border-radius: 20px; background: ${statusColors[listing.status] || statusColors.active}; color: white; font-weight: 500;">
          ${statusLabels[listing.status] || 'Disponible'}
        </span>
      </div>
    </div>
    <div style="padding: 12px;">
      <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1e293b; line-height: 1.3;">${listing.title}</h4>
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
        <span style="font-size: 10px; padding: 2px 8px; border-radius: 12px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); color: #0284c7; font-weight: 500;">
          ${getListingTypeLabel(listing.type)}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12px;">📍</span>
          <span style="font-size: 12px; color: #64748b;">${listing.location}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12px;">📐</span>
          <span style="font-size: 12px; color: #64748b;">${formatArea(listing.area_m2, listing.area_ha)}</span>
        </div>
      </div>
      <div style="padding: 8px; background: linear-gradient(135deg, #f0fdf4, #dcfce7); border-radius: 8px; text-align: center;">
        <span style="font-weight: 700; color: #16a34a; font-size: 16px;">${formatPrice(listing.price, listing.currency)}</span>
      </div>
    </div>
  </div>
`;

const createMarkerElement = (listing: Listing, isHovered: boolean = false) => {
  const el = document.createElement('div');
  el.className = 'enhanced-map-marker';
  el.setAttribute('data-listing-id', listing.id);
  const color = typeColors[listing.type] || '#10b981';
  const priceLabel = formatCompactPrice(listing.price);

  el.style.cssText = `
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform: ${isHovered ? 'scale(1.15) translateY(-8px)' : 'scale(1)'};
    z-index: ${isHovered ? 1000 : 1};
    filter: ${isHovered ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'};
  `;

  el.innerHTML = `
    <div style="
      position: relative;
      background: ${isHovered ? color : 'white'};
      color: ${isHovered ? 'white' : '#1e293b'};
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      font-family: system-ui, -apple-system, sans-serif;
      white-space: nowrap;
      border: 2.5px solid ${color};
      box-shadow: ${isHovered ? `0 0 0 3px ${color}40` : 'none'};
      transition: all 0.2s ease;
    ">
      ${priceLabel}
    </div>
    <div style="
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 7px solid ${color};
      margin-top: -1px;
    "></div>
  `;

  return el;
};

export function useMapMarkers(options: UseMapMarkersOptions) {
  const { map, popupRef, listings, hoveredListing, selectedListing, onListingHover, onListingClick, isLoading, infoLayers, fetchIsochrone } = options;
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const initialFitDoneRef = useRef(false);
  const navigate = useNavigate();

  const attachMarkerEvents = useCallback((el: HTMLElement, listing: Listing) => {
    el.addEventListener('mouseenter', () => {
      onListingHover?.(listing);
      el.style.transform = 'scale(1.15) translateY(-10px)';
      el.style.zIndex = '1000';
      if (listing.lng && listing.lat) {
        popupRef.current
          ?.setLngLat([listing.lng, listing.lat])
          .setHTML(createPopupHTML(listing))
          .addTo(map.current!);
      }
    });

    el.addEventListener('mouseleave', () => {
      onListingHover?.(null);
      el.style.transform = 'scale(1)';
      el.style.zIndex = '1';
      popupRef.current?.remove();
    });

    el.addEventListener('click', () => {
      if (infoLayers.isochrone && listing.lat && listing.lng) {
        fetchIsochrone(listing.lng, listing.lat);
      }
      if (onListingClick) {
        onListingClick(listing);
      } else {
        navigate(`/propiedad/${listing.id}`);
      }
    });
  }, [onListingHover, onListingClick, popupRef, map, navigate, infoLayers.isochrone, fetchIsochrone]);

  // Sync markers with listings
  useEffect(() => {
    if (!map.current || isLoading) return;

    const currentIds = new Set(listings.map(l => l.id));

    // Remove stale markers
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add/update markers
    listings.forEach(listing => {
      if (!listing.lat || !listing.lng) return;
      const isHovered = hoveredListing?.id === listing.id;

      if (markersRef.current[listing.id]) {
        // CSS-only hover update — no DOM recreation
        const el = markersRef.current[listing.id].getElement();
        const color = typeColors[listing.type] || '#10b981';
        el.style.transform = isHovered ? 'scale(1.15) translateY(-8px)' : 'scale(1)';
        el.style.zIndex = isHovered ? '1000' : '1';
        el.style.filter = isHovered ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
        const pill = el.querySelector('div > div:first-child') as HTMLElement | null;
        if (pill) {
          pill.style.background = isHovered ? color : 'white';
          pill.style.color = isHovered ? 'white' : '#1e293b';
          pill.style.boxShadow = isHovered ? `0 0 0 3px ${color}40` : 'none';
        }
        return;
      }

      const el = createMarkerElement(listing, isHovered);
      attachMarkerEvents(el, listing);
      const marker = new mapboxgl.Marker(el)
        .setLngLat([listing.lng, listing.lat])
        .addTo(map.current!);
      markersRef.current[listing.id] = marker;
    });

    // Initial fit
    if (!initialFitDoneRef.current && listings.length > 0) {
      const valid = listings.filter(l => l.lat && l.lng);
      if (valid.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        valid.forEach(l => bounds.extend([l.lng!, l.lat!]));
        map.current.fitBounds(bounds, { padding: 80, maxZoom: 10 });
        initialFitDoneRef.current = true;
      }
    }
  }, [listings, isLoading, hoveredListing, attachMarkerEvents, map]);

  // Hover highlight (visual only, no camera) — CSS-only updates
  useEffect(() => {
    if (!map.current || isLoading) return;
    if (!map.current.isStyleLoaded()) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const listing = listings.find(l => l.id === id);
      if (!listing) return;
      const isHov = hoveredListing?.id === id;
      const color = typeColors[listing.type] || '#10b981';

      el.style.transform = isHov ? 'scale(1.15) translateY(-10px)' : 'scale(1)';
      el.style.zIndex = isHov ? '1000' : '1';
      el.style.filter = isHov ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))';
      const pill = el.querySelector('div > div:first-child') as HTMLElement | null;
      if (pill) {
        pill.style.background = isHov ? color : 'white';
        pill.style.color = isHov ? 'white' : '#1e293b';
        pill.style.boxShadow = isHov ? `0 0 0 3px ${color}40` : 'none';
      }

      if (isHov && listing.lat && listing.lng) {
        popupRef.current
          ?.setLngLat([listing.lng, listing.lat])
          .setHTML(createPopupHTML(listing))
          .addTo(map.current!);
      }
    });

    if (!hoveredListing) {
      popupRef.current?.remove();
    }
  }, [hoveredListing, listings, isLoading, popupRef, map]);

  // Selected listing: easeTo
  useEffect(() => {
    if (!map.current || isLoading || !selectedListing) return;
    if (!selectedListing.lat || !selectedListing.lng) return;
    map.current.stop();
    map.current.easeTo({
      center: [selectedListing.lng, selectedListing.lat],
      zoom: Math.max(map.current.getZoom(), 13),
      duration: 600,
    });
    popupRef.current
      ?.setLngLat([selectedListing.lng, selectedListing.lat])
      .setHTML(createPopupHTML(selectedListing))
      .addTo(map.current!);
  }, [selectedListing, isLoading, popupRef, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      initialFitDoneRef.current = false;
    };
  }, []);

  return { markersRef };
}
