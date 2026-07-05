import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ExternalLink, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePublishedTasacion } from '@/hooks/usePublishedTasacion';

/**
 * Shows the latest verified published tasación for a listing, linking to its
 * public verification page (/tasacion/v/:id) instead of forcing a rebuild.
 */
const PublishedTasacionBanner = ({ listingId }: { listingId?: string | null }) => {
  const { data: tasacion } = usePublishedTasacion(listingId);

  if (!tasacion) return null;

  const anchored = !!tasacion.blockchain_anchor;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 flex-wrap">
            Tasación publicada y verificable
            {anchored && (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                <Link2 className="h-3 w-3 mr-1" />
                Anclada en Bitcoin
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {tasacion.valor_uf ? `UF ${Number(tasacion.valor_uf).toLocaleString('es-CL')}` : ''}
            {tasacion.fecha_emision
              ? ` · Emitida ${format(new Date(tasacion.fecha_emision), 'dd MMM yyyy', { locale: es })}`
              : ''}
            {tasacion.tasador_nombre ? ` · ${tasacion.tasador_nombre}` : ''}
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
        <Link to={`/tasacion/v/${tasacion.id}`}>
          <ExternalLink className="h-3.5 w-3.5" />
          Ver verificación pública
        </Link>
      </Button>
    </div>
  );
};

export default PublishedTasacionBanner;
