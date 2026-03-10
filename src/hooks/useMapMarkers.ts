import { useEffect, useRef, useCallback, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import { InfoLayerState } from '@/components/map/MapInfoLayers';

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
  <div class="satellite-popup-content" style="font-family: system-ui, -apple-system, sans-serif; min-width: 260px; background: rgba(15,23,42,0.92); backdrop-filter: blur(16px); border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden;">
    <div style="position: relative; height: 120px; overflow: hidden;">
      <img src="${listing.images[0] || '/placeholder.svg'}" alt="${listing.title}" style="width: 100%; height: 100%; object-fit: cover;" />
      <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.9), transparent 60%);"></div>
      <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 10px; padding: 3px 10px; border-radius: 20px; background: ${statusColors[listing.status] || statusColors.active}; color: white; font-weight: 600; letter-spacing: 0.3px;">
          ${statusLabels[listing.status] || 'Disponible'}
        </span>
      </div>
    </div>
    <div style="padding: 14px;">
      <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #f1f5f9; line-height: 1.3;">${listing.title}</h4>
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
        <span style="font-size: 10px; padding: 2px 8px; border-radius: 12px; background: rgba(59,130,246,0.2); color: #93c5fd; font-weight: 500; border: 1px solid rgba(59,130,246,0.2);">
          ${getListingTypeLabel(listing.type)}
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12px;">📍</span>
          <span style="font-size: 12px; color: #94a3b8;">${listing.location}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 12px;">📐</span>
          <span style="font-size: 12px; color: #94a3b8;">${formatArea(listing.area_m2, listing.area_ha)}</span>
        </div>
      </div>
      <div style="padding: 10px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2); border-radius: 10px; text-align: center;">
        <span style="font-weight: 700; color: #34d399; font-size: 17px; letter-spacing: -0.3px;">${formatPrice(listing.price, listing.currency)}</span>
      </div>
    </div>
  </div>
`;

/**
 * CRITICAL: Never set `transform` on the marker root element — Mapbox uses it
 * internally for geo-positioning. All visual effects go on `.marker-inner`.
 */
const createMarkerElement = (listing: Listing) => {
  const el = document.createElement('div');
  el.className = 'enhanced-map-marker';
  el.setAttribute('data-listing-id', listing.id);
  const color = typeColors[listing.type] || '#10b981';
  const priceLabel = formatCompactPrice(listing.price);

  // Root: only pointer-events / cursor. NO transform here.
  el.style.cssText = `cursor: pointer; z-index: 1;`;

  el.innerHTML = `
    <div class="marker-inner" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), filter 0.3s ease;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));
      will-change: transform, filter;
    ">
      <div class="marker-pill" data-color="${color}" style="
        position: relative;
        background: rgba(15,23,42,0.85);
        backdrop-filter: blur(12px);
        color: #e2e8f0;
        padding: 5px 12px;
        border-radius: 22px;
        font-size: 12px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        border: 2px solid rgba(255,255,255,0.2);
        transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
        letter-spacing: -0.2px;
      ">
        ${priceLabel}
      </div>
      <div class="marker-arrow" style="
        width: 0; height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 8px solid rgba(15,23,42,0.85);
        margin-top: -1px;
        transition: border-top-color 0.2s;
      "></div>
    </div>
  `;

  return el;
};

/** Apply hover/select visual styles (CSS only, no DOM recreation) */
const applyMarkerStyle = (el: HTMLElement, color: string, isActive: boolean, isSelected: boolean) => {
  // z-index on root is safe
  el.style.zIndex = isActive ? '1000' : '1';

  const inner = el.querySelector('.marker-inner') as HTMLElement | null;
  if (inner) {
    inner.style.transform = isActive ? 'scale(1.2) translateY(-8px)' : 'scale(1)';
    inner.style.filter = isActive
      ? `drop-shadow(0 0 12px ${color}80) drop-shadow(0 8px 20px rgba(0,0,0,0.5))`
      : 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))';
  }

  const pill = el.querySelector('.marker-pill') as HTMLElement | null;
  if (pill) {
    pill.style.background = isActive ? color : 'rgba(15,23,42,0.85)';
    pill.style.color = isActive ? 'white' : '#e2e8f0';
    pill.style.borderColor = isActive ? color : 'rgba(255,255,255,0.2)';
    pill.style.boxShadow = isSelected
      ? `0 0 0 4px ${color}50, 0 0 20px ${color}40`
      : isActive ? `0 0 0 3px ${color}40` : 'none';
  }

  const arrow = el.querySelector('.marker-arrow') as HTMLElement | null;
  if (arrow) {
    arrow.style.borderTopColor = isActive ? color : 'rgba(15,23,42,0.85)';
  }
};

export function useMapMarkers(options: UseMapMarkersOptions) {
  const { map, popupRef, listings, hoveredListing, selectedListing, onListingHover, onListingClick, isLoading, infoLayers, fetchIsochrone } = options;
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const initialFitDoneRef = useRef(false);
  const navigate = useNavigate();

  // Store callbacks in refs to keep attachMarkerEvents stable
  const onListingHoverRef = useRef(onListingHover);
  const onListingClickRef = useRef(onListingClick);
  const infoLayersRef = useRef(infoLayers);
  const fetchIsochroneRef = useRef(fetchIsochrone);
  useEffect(() => { onListingHoverRef.current = onListingHover; }, [onListingHover]);
  useEffect(() => { onListingClickRef.current = onListingClick; }, [onListingClick]);
  useEffect(() => { infoLayersRef.current = infoLayers; }, [infoLayers]);
  useEffect(() => { fetchIsochroneRef.current = fetchIsochrone; }, [fetchIsochrone]);

  const attachMarkerEvents = useCallback((el: HTMLElement, listing: Listing) => {
    el.addEventListener('mouseenter', () => {
      onListingHoverRef.current?.(listing);
    });
    el.addEventListener('mouseleave', () => {
      onListingHoverRef.current?.(null);
    });
    el.addEventListener('click', () => {
      if (infoLayersRef.current.isochrone && listing.lat && listing.lng) {
        fetchIsochroneRef.current(listing.lng, listing.lat);
      }
      if (onListingClickRef.current) {
        onListingClickRef.current(listing);
      } else {
        navigate(`/propiedad/${listing.id}`);
      }
    });
  }, [navigate]);

  // Sync markers with listings — only add/remove, don't style here
  useEffect(() => {
    if (!map.current || isLoading) return;

    const currentIds = new Set(listings.map(l => l.id));

    // Remove stale
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add new markers only
    listings.forEach(listing => {
      if (!listing.lat || !listing.lng) return;
      if (markersRef.current[listing.id]) return; // already exists

      const el = createMarkerElement(listing);
      attachMarkerEvents(el, listing);
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
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
  }, [listings, isLoading, attachMarkerEvents, map]);

  // Hover/select highlight — separate effect, CSS-only
  useEffect(() => {
    if (!map.current || isLoading) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const listing = listings.find(l => l.id === id);
      if (!listing) return;
      const isHov = hoveredListing?.id === id;
      const isSel = selectedListing?.id === id;
      const active = isHov || isSel;
      const color = typeColors[listing.type] || '#10b981';

      applyMarkerStyle(el, color, active, isSel);

      if (isHov && listing.lat && listing.lng && map.current) {
        popupRef.current
          ?.setLngLat([listing.lng, listing.lat])
          .setHTML(createPopupHTML(listing))
          .addTo(map.current!);
      }
    });

    if (!hoveredListing) {
      popupRef.current?.remove();
    }
  }, [hoveredListing, selectedListing, listings, isLoading, popupRef, map]);

  // Selected listing: easeTo with pitch
  useEffect(() => {
    if (!map.current || isLoading || !selectedListing) return;
    if (!selectedListing.lat || !selectedListing.lng) return;
    map.current.stop();
    map.current.easeTo({
      center: [selectedListing.lng, selectedListing.lat],
      zoom: Math.max(map.current.getZoom(), 14),
      pitch: 30,
      duration: 800,
      easing: (t) => t * (2 - t),
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
