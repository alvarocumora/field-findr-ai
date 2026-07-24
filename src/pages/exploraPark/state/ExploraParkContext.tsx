import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { EpLotStatus } from '../data/lots';

type FocusRequest = { lotId: string; nonce: number } | null;

interface Ctx {
  activeStatus: Set<EpLotStatus>;
  toggleStatus: (s: EpLotStatus) => void;
  setOnlyStatus: (s: EpLotStatus | 'all') => void;
  hoveredLotId: string | null;
  setHoveredLotId: (id: string | null) => void;
  focusRequest: FocusRequest;
  requestFocus: (lotId: string) => void;
}

const ExploraParkStateContext = createContext<Ctx | null>(null);

export function ExploraParkStateProvider({ children }: { children: ReactNode }) {
  const [activeStatus, setActiveStatus] = useState<Set<EpLotStatus>>(
    new Set<EpLotStatus>(['available', 'reserved', 'sold']),
  );
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);

  const toggleStatus = useCallback((s: EpLotStatus) => {
    setActiveStatus((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      if (next.size === 0) return new Set<EpLotStatus>(['available', 'reserved', 'sold']);
      return next;
    });
  }, []);

  const setOnlyStatus = useCallback((s: EpLotStatus | 'all') => {
    if (s === 'all') setActiveStatus(new Set<EpLotStatus>(['available', 'reserved', 'sold']));
    else setActiveStatus(new Set<EpLotStatus>([s]));
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
    <ExploraParkStateContext.Provider value={value}>{children}</ExploraParkStateContext.Provider>
  );
}

export function useExploraParkState(): Ctx {
  const ctx = useContext(ExploraParkStateContext);
  if (!ctx) {
    // Safe fallback so components can render outside the provider without crashing.
    const noop = () => {};
    return {
      activeStatus: new Set<EpLotStatus>(['available', 'reserved', 'sold']),
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
