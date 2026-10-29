import { CompareSelectionStatus } from './CompareSelectionStatus';
import { memo, useEffect } from 'react';
import { X, Scale, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';
import { formatPriceShort } from '@/hooks/useListings';

const CompareFloatingBar = memo(() => {
  const { compareList, selectionCount, isRefreshing, refreshError, removeFromCompare, clearCompare, setCompareOpen } = useCompare();

  // Publish bar height as CSS var so other FABs can stack above via bottom-safe-compare.
  useEffect(() => {
    const root = document.documentElement;
    if (selectionCount > 0) {
      root.style.setProperty('--compare-bar-h', '4.75rem');
    } else {
      root.style.removeProperty('--compare-bar-h');
    }
    return () => { root.style.removeProperty('--compare-bar-h'); };
  }, [selectionCount]);

  if (selectionCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-safe-nav left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-3xl"
        style={{ zIndex: 'var(--z-fab)' }}
      >
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl shadow-primary/10">
          <Scale className="h-5 w-5 text-primary flex-shrink-0" />
          
          <span className="sm:hidden text-xs">{selectionCount} seleccionadas</span>
          <div className="hidden sm:flex items-center gap-2 min-w-0 overflow-x-auto flex-1">
            {compareList.map(listing => (
              <div key={listing.id} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5">
                <img
                  src={listing.images[0] || '/placeholder.svg'}
                  alt=""
                  className="w-7 h-7 rounded object-cover"
                />
                <span className="text-xs font-medium max-w-[80px] truncate">{typeof listing.price === 'number' && listing.price > 0 ? formatPriceShort(listing.price, listing.currency) : 'Consultar'}</span>
                <button
                  aria-label={`Quitar ${listing.title} de la comparación`}
                  onClick={() => removeFromCompare(listing.id)}
                  className="p-0.5 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={clearCompare}
              className="text-xs h-8"
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={() => setCompareOpen(true)}
              disabled={compareList.length < 2 || isRefreshing || Boolean(refreshError)}
              className="h-8 gap-1.5 text-xs"
            >
              Comparar ({selectionCount})
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="w-full"><CompareSelectionStatus /></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

CompareFloatingBar.displayName = 'CompareFloatingBar';
export default CompareFloatingBar;
