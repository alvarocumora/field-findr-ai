import { Suspense, lazy } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lot } from '@/hooks/useLots';

const ParcelaDesigner3D = lazy(() =>
  import('@/components/parcela/ParcelaDesigner3D').then((m) => ({
    default: m.ParcelaDesigner3D,
  }))
);

interface LotDesigner3DDialogProps {
  lot: Lot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (designJson: string) => void;
  savedDesign?: string | null;
}

const formatPrice = (price: number | null) => {
  if (!price) return '—';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(price);
};

export const LotDesigner3DDialog = ({
  lot,
  open,
  onOpenChange,
  onSave,
  savedDesign,
}: LotDesigner3DDialogProps) => {
  if (!lot) return null;

  const polygon = lot.polygon as number[][] | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-full max-h-[96vh] h-[96vh] p-0 gap-0 overflow-hidden">
        {/* Compact header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/95 backdrop-blur-sm">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Lote {lot.lot_number}
              </Badge>
              Diseñar Mi Parcela
            </DialogTitle>
            <DialogDescription className="text-xs">
              {Number(lot.area).toLocaleString('es-CL')} m² · {formatPrice(lot.price)}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Full 3D Canvas */}
        <div className="flex-1 min-h-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-muted/20">
                <Skeleton className="w-full h-full" />
              </div>
            }
          >
            <div className="h-full [&>div]:!h-full [&>div]:!rounded-none [&>div]:!border-0">
              <ParcelaDesigner3D
                polygon={polygon}
                lotNumber={lot.lot_number}
                lotArea={Number(lot.area)}
                lotPrice={lot.price ?? undefined}
                latitude={lot.latitude ?? undefined}
                longitude={lot.longitude ?? undefined}
                savedDesign={savedDesign}
                onSave={onSave}
              />
            </div>
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
};
