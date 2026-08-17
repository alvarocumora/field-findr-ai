import { useSyncExternalStore, useCallback } from 'react';

/**
 * Shared explorer preference: whether individual lots belonging to a loteo
 * (tagged `loteo`) are shown in the general feed.
 *
 * Kept in a tiny module store so the toggle (ProjectsRail) and the data hook
 * (Explorar) stay in sync on both desktop and mobile without prop drilling.
 */

const STORAGE_KEY = 'ot:explorer:include-loteo-lots';

// Por defecto se incluyen: el catálogo propio es mayoritariamente parcelas de
// loteo y ocultarlas deja el explorador casi vacío. El usuario puede apagarlo.
let value = true;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) value = stored === '1';
} catch {
  value = true;
}

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return value;
}

export function setIncludeLoteoLots(next: boolean) {
  if (next === value) return;
  value = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    /* storage unavailable — in-memory only */
  }
  listeners.forEach((l) => l());
}

export function useIncludeLoteoLots() {
  const include = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const toggle = useCallback(() => setIncludeLoteoLots(!getSnapshot()), []);
  return { include, setInclude: setIncludeLoteoLots, toggle };
}
