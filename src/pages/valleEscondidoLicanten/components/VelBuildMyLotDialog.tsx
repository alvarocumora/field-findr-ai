import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { VelLot } from '../data/lots';

const ParcelaDesigner3D = lazy(() =>
  import('@/components/parcela/ParcelaDesigner3D').then((module) => ({
    default: module.ParcelaDesigner3D,
  })),
);

interface Props {
  lot: VelLot | null;
  allLots: VelLot[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const storageKey = (lotId: string) => `vel-build-my-lot-${lotId}`;

export default function VelBuildMyLotDialog({ lot, allLots, open, onOpenChange }: Props) {
  const [savedDesign, setSavedDesign] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !lot) return;
    try {
      setSavedDesign(localStorage.getItem(storageKey(lot.id)));
    } catch {
      setSavedDesign(null);
    }
  }, [open, lot]);

  const neighbors = useMemo(
    () => (lot ? allLots.filter((item) => item.id !== lot.id).map((item) => item.polygon) : []),
    [allLots, lot],
  );

  if (!lot) return null;

  const handleSave = (designJson: string) => {
    try {
      localStorage.setItem(storageKey(lot.id), designJson);
      setSavedDesign(designJson);
    } catch {
      // El diseñador mantiene la sesión aunque el navegador bloquee storage.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[96vh] max-h-[96vh] w-[98vw] max-w-[98vw] gap-0 overflow-hidden p-0">
        <div className="border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-sm">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
              <Badge variant="outline" className="text-xs">
                Build My Lot
              </Badge>
              <span>Diseña el Lote {lot.lot_number}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lot.area_m2.toLocaleString('es-CL')} m² ·{' '}
              {lot.price_clp > 0 ? `$${lot.price_clp.toLocaleString('es-CL')}` : 'Precio no publicado'} ·
              simulación conceptual sobre la geometría del lote
            </DialogDescription>
          </DialogHeader>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Ubica casa, piscina, quincho, huerto, energía solar y accesos. Esta herramienta es referencial
            y no reemplaza arquitectura, permisos, mecánica de suelos ni levantamiento topográfico.
          </p>
        </div>

        <div className="min-h-0 flex-1">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center bg-muted/20">
                <Skeleton className="h-full w-full" />
              </div>
            }
          >
            <div className="h-full [&>div]:!h-full [&>div]:!rounded-none [&>div]:!border-0">
              <ParcelaDesigner3D
                key={lot.id}
                polygon={lot.polygon}
                neighbors={neighbors}
                lotNumber={lot.lot_number}
                lotArea={lot.area_m2}
                lotPrice={lot.price_clp || undefined}
                latitude={lot.centroid[1]}
                longitude={lot.centroid[0]}
                savedDesign={savedDesign}
                onSave={handleSave}
                program="residencial"
              />
            </div>
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
}
