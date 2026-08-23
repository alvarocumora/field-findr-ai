import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Map as MapIcon, Store, Loader2, ExternalLink, PenTool } from 'lucide-react';
import { Link } from 'react-router-dom';
import LotMapView from './LotMapView';
import { useBulkPublishLots } from '@/hooks/useBulkPublishLots';
import { publishableLots } from '@/lib/marketplace/lotToListing';
import type { Lot } from '@/hooks/useLots';

interface LoteoPlanPublishCardProps {
  project: any;
  lots: Lot[];
  onLotClick: (lot: Lot) => void;
}

/**
 * Plano del loteo + publicación al marketplace, dentro del Control de Loteo.
 * Cierra el flujo "dibujar / revisar el plano → publicar los lotes" sin salir
 * del panel: el mapa es la misma vista del editor (solo lectura) y la barra
 * inferior publica en lote a través de la función con cuota por plan.
 */
export const LoteoPlanPublishCard = ({ project, lots, onLotClick }: LoteoPlanPublishCardProps) => {
  const bulkPublish = useBulkPublishLots();
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const center = useMemo(() => {
    if (project?.latitude && project?.longitude) {
      return { lat: Number(project.latitude), lng: Number(project.longitude) };
    }
    const withCoords = lots.filter((l) => l.latitude && l.longitude);
    if (withCoords.length === 0) return null;
    return {
      lat: withCoords.reduce((s, l) => s + Number(l.latitude), 0) / withCoords.length,
      lng: withCoords.reduce((s, l) => s + Number(l.longitude), 0) / withCoords.length,
    };
  }, [project, lots]);

  const publishedCount = lots.filter((l: any) => l.listing_id).length;
  const pending = publishableLots(lots as any);

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex flex-wrap items-center gap-2">
          <MapIcon className="h-4 w-4 text-primary" />
          Plano y marketplace
          <Badge variant="outline" className="font-normal">
            {publishedCount} publicados
          </Badge>
          {pending.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {pending.length} por publicar
            </Badge>
          )}
          <Button asChild variant="ghost" size="sm" className="ml-auto gap-1.5">
            <Link to="/asesor/subdivision">
              <PenTool className="h-3.5 w-3.5" />
              Editar plano
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!center ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Este proyecto aún no tiene coordenadas ni lotes georreferenciados. Carga el KMZ o
            dibuja el plano en el editor para verlo aquí.
          </p>
        ) : (
          <div className="h-[380px] rounded-xl overflow-hidden border border-border/40">
            <LotMapView
              lots={lots as any}
              projectCenter={center}
              projectId={project?.id}
              kmzFileUrl={project?.kmz_file_url ?? null}
              planImages={project?.plan_images ?? []}
              selectedLotId={selectedLotId}
              readOnly
              onLotClick={(lot: any) => {
                setSelectedLotId(lot.id);
                onLotClick(lot as Lot);
              }}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border/40 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground flex-1">
            Publicar crea una ficha pública por lote con precio, superficie y ubicación. Los lotes
            sin precio o ya publicados se omiten automáticamente.
          </p>
          <div className="flex gap-2">
            {publishedCount > 0 && (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to={`/explorar?proyecto=${project?.id ?? ''}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver en el marketplace
                </Link>
              </Button>
            )}
            <Button
              size="sm"
              className="gap-1.5"
              disabled={pending.length === 0 || bulkPublish.isPending}
              onClick={() => bulkPublish.mutate({ project, lots: lots as any })}
            >
              {bulkPublish.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Store className="h-3.5 w-3.5" />
              )}
              Publicar {pending.length > 0 ? `${pending.length} lotes` : 'lotes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoteoPlanPublishCard;
