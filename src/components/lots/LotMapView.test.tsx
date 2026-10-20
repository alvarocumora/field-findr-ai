import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { LotMapView } from './LotMapView';

const state = vi.hoisted(() => ({ created: 0, removed: 0, resized: 0 }));
vi.mock('mapbox-gl', () => ({ default: {
  Map: class {
    canvas = document.createElement('canvas');
    constructor() { state.created++; }
    addControl() {}
    on() {}
    getCanvas() { return this.canvas; }
    remove() { state.removed++; }
    resize() { state.resized++; }
  },
  NavigationControl: class {},
  FullscreenControl: class {},
} }));
vi.mock('@/hooks/useMapboxToken', () => ({ useMapboxToken: () => ({ token: 'pk.test', loading: false, error: null, retry: vi.fn() }) }));
vi.mock('@/hooks/useSentinelImagery', () => ({ useSentinelImagery: () => ({ data: null }) }));
vi.mock('@/hooks/usePolygonDrawing', () => ({ usePolygonDrawing: () => ({}) }));
vi.mock('./MasterPlanOverlay', () => ({ MasterPlanOverlay: () => null }));
vi.mock('./LotDrawingTool', () => ({ LotDrawingTool: () => null }));
vi.mock('./LotRenumberTool', () => ({ LotRenumberTool: () => null }));

beforeEach(() => {
  state.created = 0;
  state.removed = 0;
  state.resized = 0;
  vi.useFakeTimers();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

const props = () => ({ lots: [], projectCenter: { lat: -34, lng: -71 }, onLotClick: vi.fn(), readOnly: true, tourMode: true });

it('keeps the loading map alive across equivalent parent values and new callbacks', () => {
  const view = render(<LotMapView {...props()} />);
  view.rerender(<LotMapView {...props()} />);
  expect(state.created).toBe(1);
  expect(state.removed).toBe(0);
  view.unmount();
  expect(state.removed).toBe(1);
});

it('replaces the map exactly once when the style changes', () => {
  const view = render(<LotMapView {...props()} />);
  fireEvent.click(view.getByRole('button', { name: 'Calles' }));
  expect(state.created).toBe(2);
  expect(state.removed).toBe(1);
});

it('allows retrying a stalled load without leaking the old map', () => {
  const view = render(<LotMapView {...props()} />);
  act(() => { vi.advanceTimersByTime(25000); });
  expect(view.getByRole('alert')).toBeTruthy();
  fireEvent.click(view.getByRole('button', { name: 'Reintentar mapa' }));
  expect(state.created).toBe(2);
  expect(state.removed).toBe(1);
});