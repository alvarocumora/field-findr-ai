import { Suspense, lazy } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSharedDesign } from '@/hooks/useShareDesign';

const ParcelaDesigner3D = lazy(() =>
  import('@/components/parcela/ParcelaDesigner3D').then((m) => ({ default: m.ParcelaDesigner3D })),
);

/** Public read-only view of a shared parcela design (/diseno/:token). */
const SharedDesign = () => {
  const { token } = useParams<{ token: string }>();
  const { data: design, isLoading, error } = useSharedDesign(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 text-center">
        <Share2 className="h-10 w-10 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Diseño no encontrado</h1>
          <p className="text-sm text-muted-foreground">Este enlace no existe o fue eliminado.</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Ir al inicio</Link>
        </Button>
      </div>
    );
  }

  const polygon = Array.isArray(design.polygon) ? (design.polygon as number[][]) : null;
  const savedDesign = JSON.stringify(design.design_json ?? []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="gap-1 shrink-0"><Share2 className="h-3 w-3" />Diseño compartido</Badge>
          <span className="text-sm font-medium text-foreground truncate">
            {design.title || (design.lot_number ? `Lote ${design.lot_number}` : 'Parcela')}
            {design.area ? ` · ${Number(design.area).toLocaleString('es-CL')} m²` : ''}
          </span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Ofertaterrenos</Link>
        </Button>
      </header>

      <div className="flex-1 min-h-0 [&>div]:!h-full [&>div]:!rounded-none [&>div]:!border-0">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
          <ParcelaDesigner3D
            polygon={polygon}
            lotNumber={design.lot_number ?? '—'}
            lotArea={Number(design.area) || 0}
            latitude={design.latitude ?? undefined}
            longitude={design.longitude ?? undefined}
            savedDesign={savedDesign}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default SharedDesign;
