import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { VelLotStatus } from '../data/lots';

type FocusRequest = { lotId: string; nonce: number } | null;

interface Ctx {
  activeStatus: Set<VelLotStatus>;
  toggleStatus: (s: VelLotStatus) => void;
  setOnlyStatus: (s: VelLotStatus | 'all') => void;
  hoveredLotId: string | null;
  setHoveredLotId: (id: string | null) => void;
  focusRequest: FocusRequest;
  requestFocus: (lotId: string) => void;
}

const VelStateContext = createContext<Ctx | null>(null);

export function VelStateProvider({ children }: { children: ReactNode }) {
  const [activeStatus, setActiveStatus] = useState<Set<VelLotStatus>>(
    new Set<VelLotStatus>(['available', 'reserved', 'sold']),
  );
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);

  const toggleStatus = useCallback((s: VelLotStatus) => {
    setActiveStatus((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      if (next.size === 0) return new Set<VelLotStatus>(['available', 'reserved', 'sold']);
      return next;
    });
  }, []);

  const setOnlyStatus = useCallback((s: VelLotStatus | 'all') => {
    if (s === 'all') setActiveStatus(new Set<VelLotStatus>(['available', 'reserved', 'sold']));
    else setActiveStatus(new Set<VelLotStatus>([s]));
  }, []);

  const requestFocus = useCallback((lotId: string) => {
    setFocusRequest({ lotId, nonce: Date.now() });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      activeStatus,
      toggleStatus,
      setOnlyStatus,
      hoveredLotId,
      setHoveredLotId,
      focusRequest,
      requestFocus,
    }),
    [activeStatus, toggleStatus, setOnlyStatus, hoveredLotId, focusRequest, requestFocus],
  );

  return (
    <VelStateContext.Provider value={value}>{children}</VelStateContext.Provider>
  );
}

export function useVelState(): Ctx {
  const ctx = useContext(VelStateContext);
  if (!ctx) {
    // Safe fallback so components can render outside the provider without crashing.
    const noop = () => {};
    return {
      activeStatus: new Set<VelLotStatus>(['available', 'reserved', 'sold']),
      toggleStatus: noop,
      setOnlyStatus: noop,
      hoveredLotId: null,
      setHoveredLotId: noop,
      focusRequest: null,
      requestFocus: noop,
    };
  }
  return ctx;
}
