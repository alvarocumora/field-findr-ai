import { Suspense, lazy, useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [savedDesign, setSavedDesign] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load saved design when the dialog opens (DB for authenticated users, localStorage fallback)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (user) {
          const { data, error } = await supabase
            .from('listing_designs')
            .select('design')
            .eq('user_id', user.id)
            .eq('listing_id', listingId)
            .maybeSingle();
          if (cancelled) return;
          if (error) throw error;
          if (data?.design) {
            setSavedDesign(JSON.stringify(data.design));
            setLoading(false);
            return;
          }
        }
        // Fallback / anonymous: localStorage
        const local = typeof window !== 'undefined'
          ? localStorage.getItem(STORAGE_KEY(listingId))
          : null;
        if (!cancelled) setSavedDesign(local);
      } catch (e) {
        const local = typeof window !== 'undefined'
          ? localStorage.getItem(STORAGE_KEY(listingId))
          : null;
        if (!cancelled) setSavedDesign(local);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [open, listingId, user]);

  const handleSave = async (json: string) => {
    // Always mirror to localStorage as offline cache
    try { localStorage.setItem(STORAGE_KEY(listingId), json); } catch { /* ignore */ }

    if (!user) {
      toast.success('Diseño guardado localmente', {
        description: 'Inicia sesión para sincronizar tu diseño en todos tus dispositivos.',
      });
      return;
    }

    try {
      const designJson = JSON.parse(json);
      const { error } = await supabase
        .from('listing_designs')
        .upsert(
          { user_id: user.id, listing_id: listingId, design: designJson },
          { onConflict: 'user_id,listing_id' },
        );
      if (error) throw error;
      toast.success('Diseño guardado', { description: 'Lo verás al volver a abrir esta ficha.' });
    } catch (e) {
      console.error('Error saving design:', e);
      toast.error('No se pudo guardar el diseño', {
        description: 'Se conservó una copia local en este dispositivo.',
      });
    }
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
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="w-full h-full" />
            </div>
          ) : (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingDesigner3DDialog;
