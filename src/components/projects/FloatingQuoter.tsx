import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DollarSign, Calculator, ChevronUp, MapPin, Ruler, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingQuoterProps {
  selectedLot: any | null;
  projectName: string;
  onReserve: (lot: any) => void;
  onFinance: (lot: any) => void;
  /** Deselecciona el lote y oculta el panel. */
  onClose: () => void;
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', maximumFractionDigits: 0,
  }).format(price);
};

export const FloatingQuoter = ({ selectedLot, projectName, onReserve, onFinance, onClose }: FloatingQuoterProps) => {
  const isMobile = useIsMobile();
  const visible = Boolean(selectedLot && selectedLot.status === 'available');

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Escape belongs to an open dialog/sheet/modal first (lot sheet, 3D
      // designer, financing calculator…), never to the panel underneath.
      if (document.querySelector('[role="dialog"][data-state="open"], [aria-modal="true"]')) return;
      onClose();
    };
    // Capture on window runs before Radix's document-level Escape handler, so
    // an open dialog is still detectable here (bubbling ran after it closed).
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [visible, onClose]);

  if (!visible) return null;

  const content = (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Lote seleccionado</p>
          <div className="mt-0.5 flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">Lote {selectedLot.lot_number}</h3>
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Disponible
            </Badge>
          </div>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 -mt-1 h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Cerrar panel del lote"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Ruler className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{Number(selectedLot.area).toLocaleString('es-CL')} m²</span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-sm" title={projectName}>
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{projectName}</span>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-2xl font-bold text-foreground">{formatPrice(selectedLot.price)}</p>
        {selectedLot.price && selectedLot.area && (
          <p className="text-xs text-muted-foreground">
            {formatPrice(selectedLot.price / Number(selectedLot.area))}/m²
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700"
          onClick={() => onReserve(selectedLot)}
        >
          <DollarSign className="h-4 w-4" />
          Reservar Ahora
        </Button>
        <Button
          variant="outline"
          className="w-full gap-2 rounded-xl"
          onClick={() => onFinance(selectedLot)}
        >
          <Calculator className="h-4 w-4" />
          Simular Crédito
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-16 left-0 right-0 z-30 px-3"
          >
            <Card className="border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Lote {selectedLot.lot_number}</p>
                  <p className="text-lg font-bold text-primary">{formatPrice(selectedLot.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" className="gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                    <ChevronUp className="h-4 w-4" />
                    Ver detalle
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    aria-label="Cerrar panel del lote"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <div className="pt-2 pb-8">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed right-6 top-1/3 z-30 w-72"
      >
        <Card className="border-border/60 bg-card/95 backdrop-blur-md shadow-2xl">
          <CardContent className="p-5">
            {content}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
