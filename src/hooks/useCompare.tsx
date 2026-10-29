import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Listing } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const COMPARE_IDS_KEY = 'ot:compare:ids:v1';
export function readComparedIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COMPARE_IDS_KEY) || '[]');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)))].slice(0, 4) : [];
  } catch { return []; }
}

interface CompareContextType {
  compareList: Listing[];
  selectionCount: number;
  isRefreshing: boolean;
  refreshError: Error | null;
  refreshSelection: () => unknown;
  removeUnavailable: () => void;
  addToCompare: (listing: Listing) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  isCompareOpen: boolean;
  setCompareOpen: (open: boolean) => void;
}
const CompareContext = createContext<CompareContextType | null>(null);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const scope = user?.id || 'guest';
  const [ids, setIds] = useState(readComparedIds);
  const [fresh, setFresh] = useState<Record<string, { scope: string; listing: Listing }>>({});
  const [isCompareOpen, setCompareOpen] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(COMPARE_IDS_KEY, JSON.stringify(ids)); } catch { /* Keep the selection in memory if storage is unavailable. */ }
  }, [ids]);
  const query = useQuery({
    queryKey: ['compared-listings', scope, ids],
    enabled: ids.length > 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const { data, error } = await supabase.from('listings').select('*').in('id', ids).eq('is_demo', false);
      if (error) throw error;
      return (data || []).map(row => ({ ...row, images: row.images || [], tags: row.tags || [] })) as Listing[];
    },
  });
  const compareList = useMemo(() => {
    if (query.error) return [];
    const current = new Map((query.data || []).map(listing => [listing.id, listing]));
    return ids.flatMap(id => {
      const listing = current.get(id) || (query.isPending && fresh[id]?.scope === scope ? fresh[id].listing : undefined);
      return listing ? [listing] : [];
    });
  }, [query.data, query.error, query.isPending, fresh, scope, ids]);
  const addToCompare = useCallback((listing: Listing) => {
    if (ids.includes(listing.id)) return;
    if (ids.length >= 4) { toast.error('Máximo 4 propiedades para comparar'); return; }
    setFresh(previous => ({ ...previous, [listing.id]: { listing, scope } }));
    setIds(previous => previous.includes(listing.id) ? previous : [...previous, listing.id].slice(0, 4));
    toast.success(`${listing.title} agregada al comparador`);
  }, [ids, scope]);
  const removeFromCompare = useCallback((id: string) => {
    setIds(previous => previous.filter(value => value !== id));
    setFresh(previous => { const next = { ...previous }; delete next[id]; return next; });
  }, []);
  const clearCompare = useCallback(() => { setIds([]); setFresh({}); }, []);
  const removeUnavailable = () => { if (!query.error && !query.isFetching) setIds(previous => previous.filter(id => compareList.some(listing => listing.id === id))); };
  return <CompareContext.Provider value={{
    compareList, selectionCount: ids.length, isRefreshing: ids.length > 0 && query.isFetching,
    refreshError: query.error, refreshSelection: query.refetch, removeUnavailable,
    addToCompare, removeFromCompare, clearCompare, isInCompare: (id) => ids.includes(id), isCompareOpen, setCompareOpen,
  }}>{children}</CompareContext.Provider>;
};
export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
};
