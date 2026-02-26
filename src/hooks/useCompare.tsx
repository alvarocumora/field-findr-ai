import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Listing } from '@/hooks/useListings';
import { toast } from 'sonner';

interface CompareContextType {
  compareList: Listing[];
  addToCompare: (listing: Listing) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  isCompareOpen: boolean;
  setCompareOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareList, setCompareList] = useState<Listing[]>([]);
  const [isCompareOpen, setCompareOpen] = useState(false);

  const addToCompare = useCallback((listing: Listing) => {
    setCompareList(prev => {
      if (prev.length >= 4) {
        toast.error('Máximo 4 propiedades para comparar');
        return prev;
      }
      if (prev.some(l => l.id === listing.id)) return prev;
      toast.success(`${listing.title} agregada al comparador`);
      return [...prev, listing];
    });
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setCompareList(prev => prev.filter(l => l.id !== id));
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), []);
  const isInCompare = useCallback((id: string) => compareList.some(l => l.id === id), [compareList]);

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, isCompareOpen, setCompareOpen }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
};
