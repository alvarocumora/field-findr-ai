import { Suspense, lazy } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const ParcelaDesigner3D = lazy(() =>
  import('@/components/parcela/ParcelaDesigner3D').then((m) => ({ default: m.ParcelaDesigner3D }))
);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  title: string;
  polygon: number[][] | null;
  area_m2?: number | null;
  lat?: number | null;
  lng?: number | null;
  price?: number | null;
}

const STORAGE_KEY = (id: string) => `listing-design-${id}`;

const ListingDesigner3DDialog = ({
  open, onOpenChange, listingId, title, polygon, area_m2, lat, lng, price,
}: Props) => {
  const savedDesign = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY(listingId)) : null;

  const handleSave = (json: string) => {
    try { localStorage.setItem(STORAGE_KEY(listingId), json); } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-full max-h-[96vh] h-[96vh] p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/95 backdrop-blur-sm">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Diseñador 3D</Badge>
              <span className="line-clamp-1">{title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {area_m2 ? `${area_m2.toLocaleString('es-CL')} m²` : ''} · Arrastra piezas industriales sobre el terreno real
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 min-h-0">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Skeleton className="w-full h-full" /></div>}>
            <div className="h-full [&>div]:!h-full [&>div]:!rounded-none [&>div]:!border-0">
              <ParcelaDesigner3D
                polygon={polygon}
                lotNumber={title}
                lotArea={area_m2 ?? 70000}
                lotPrice={price ?? undefined}
                latitude={lat ?? undefined}
                longitude={lng ?? undefined}
                savedDesign={savedDesign}
                onSave={handleSave}
              />
            </div>
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingDesigner3DDialog;
