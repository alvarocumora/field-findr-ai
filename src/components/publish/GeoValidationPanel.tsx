import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Copy, Loader2, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GeoIssue } from '@/lib/geo/coordinateValidation';
import type { DuplicateCandidate } from '@/hooks/useDuplicateCheck';

interface Props {
  issues: GeoIssue[];
  duplicates: DuplicateCandidate[];
  isChecking: boolean;
  hasPoint: boolean;
  /** El usuario confirma que su publicación no es un duplicado. */
  duplicateAcknowledged: boolean;
  onAcknowledgeDuplicates: () => void;
}

/** Resumen de validación de georreferenciación y posibles duplicados. */
const GeoValidationPanel = ({
  issues,
  duplicates,
  isChecking,
  hasPoint,
  duplicateAcknowledged,
  onAcknowledgeDuplicates,
}: Props) => {
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const clean = hasPoint && errors.length === 0 && warnings.length === 0 && duplicates.length === 0 && !isChecking;

  if (!hasPoint && errors.length === 0) return null;

  return (
    <div className="mt-3 space-y-2" aria-live="polite">
      {errors.map((issue) => (
        <div
          key={issue.code}
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span className="text-foreground">{issue.message}</span>
        </div>
      ))}

      {warnings.map((issue) => (
        <div
          key={issue.code}
          className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-foreground">{issue.message}</span>
        </div>
      ))}

      {isChecking && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando publicaciones existentes en la zona…
        </p>
      )}

      {duplicates.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <Copy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-foreground">
                Encontramos {duplicates.length} publicación{duplicates.length > 1 ? 'es' : ''} que podría{duplicates.length > 1 ? 'n' : ''} ser la misma propiedad
              </p>
              <p className="text-xs text-muted-foreground">
                Revisa antes de continuar para evitar duplicados en el marketplace.
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {duplicates.slice(0, 5).map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background/60 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{d.title}</p>
                  <p className="truncate text-muted-foreground">
                    {d.location || 'Sin dirección'}
                    {d.area_ha ? ` · ${d.area_ha} ha` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {d.isMine && <Badge variant="secondary" className="text-[10px]">Tuya</Badge>}
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    {d.reason === 'same_tax_id' ? (
                      'Mismo identificador'
                    ) : (
                      <>
                        <MapPin className="h-3 w-3" /> a {d.distance} m
                      </>
                    )}
                  </Badge>
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                    <Link to={`/propiedad/${d.id}`} target="_blank" rel="noopener noreferrer">
                      Ver
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {!duplicateAcknowledged ? (
            <Button size="sm" variant="outline" onClick={onAcknowledgeDuplicates}>
              Es una propiedad distinta, continuar
            </Button>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Confirmaste que no es un duplicado.
            </p>
          )}
        </div>
      )}

      {clean && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-500">
          <CheckCircle2 className="h-3.5 w-3.5" /> Georreferenciación validada y sin duplicados detectados.
        </p>
      )}
    </div>
  );
};

export default GeoValidationPanel;
