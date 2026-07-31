import { useSyncExternalStore, useCallback } from 'react';

/**
 * Shared explorer preference: whether individual lots belonging to a loteo
 * (tagged `loteo`) are shown in the general feed.
 *
 * Kept in a tiny module store so the toggle (ProjectsRail) and the data hook
 * (Explorar) stay in sync on both desktop and mobile without prop drilling.
 */

const STORAGE_KEY = 'ot:explorer:include-loteo-lots';

let value = false;
try {
  value = localStorage.getItem(STORAGE_KEY) === '1';
} catch {
  value = false;
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
  const include = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const toggle = useCallback(() => setIncludeLoteoLots(!getSnapshot()), []);
  return { include, setInclude: setIncludeLoteoLots, toggle };
}
