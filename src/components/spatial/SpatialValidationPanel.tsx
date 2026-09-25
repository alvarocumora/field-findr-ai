import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { normalizePolygon } from '@/lib/polygonUtils';
import { computeLotPrice, readProjectPricing } from '@/lib/pricing/lotPricing';
import type { Lot } from '@/hooks/useLots';

type Level = 'ok' | 'warn' | 'error';
interface Stage { name: string; level: Level; detail: string; fix?: string }

interface Props {
  project: { latitude?: number | null; longitude?: number | null; landing_config?: unknown; kmz_file_url?: string | null } | null;
  lots: Lot[];
  roads: number;
  sourceReady: boolean;
}

/** Validates each stage of KMZ → masterplan → PDF → 3D with explicit, actionable errors. */
export function buildSpatialStages({ project, lots, roads, sourceReady }: Props): Stage[] {
  const normalized = lots.map((l) => normalizePolygon(l.polygon as any, l.latitude ?? undefined, l.longitude ?? undefined));
  const valid = normalized.filter((n) => n.valid).length;
  const invalidNums = lots.filter((_, i) => !normalized[i].valid).map((l) => l.lot_number);
  const dupNums = lots.map((l) => l.lot_number).filter((n, i, a) => a.indexOf(n) !== i);
  const pricing = readProjectPricing(project?.landing_config);
  const priceMismatch = pricing
    ? lots.filter((l) => l.price != null && Math.abs(Number(l.price) - computeLotPrice(Number(l.area), pricing)) > 1).map((l) => l.lot_number)
    : [];
  const noPrice = lots.filter((l) => l.status === 'available' && !l.price).map((l) => l.lot_number);
  const list = (a: string[]) => a.slice(0, 8).join(', ') + (a.length > 8 ? '…' : '');

  return [
    {
      name: '1. Fuente KMZ/KML',
      level: sourceReady ? 'ok' : 'warn',
      detail: sourceReady ? 'Archivo original guardado.' : 'No hay archivo original guardado para este proyecto.',
      fix: sourceReady ? undefined : 'Pulsa "Actualizar KMZ" y sube el archivo del plano.',
    },
    {
      name: '2. Parcelas',
      level: !lots.length ? 'error' : invalidNums.length || dupNums.length ? 'warn' : 'ok',
      detail: !lots.length
        ? 'El proyecto no tiene parcelas.'
        : `${valid} de ${lots.length} con polígono válido.` +
          (invalidNums.length ? ` Sin geometría: ${list(invalidNums)}.` : '') +
          (dupNums.length ? ` Números repetidos: ${list(dupNums)}.` : ''),
      fix: !lots.length || invalidNums.length ? 'Reimporta el KMZ; se actualizan por número sin duplicar.' : undefined,
    },
    {
      name: '3. Caminos / servidumbres',
      level: roads > 0 ? 'ok' : 'warn',
      detail: roads > 0 ? `${roads} tramos detectados.` : 'No se detectaron caminos ni servidumbres.',
      fix: roads > 0 ? undefined : 'Revisa que el KMZ tenga líneas con nombres como "camino" o "servidumbre".',
    },
    {
      name: '4. Masterplan',
      level: valid === 0 ? 'error' : project?.latitude == null ? 'warn' : 'ok',
      detail: valid === 0 ? 'Sin polígonos reales no se puede dibujar el masterplan.' : project?.latitude == null ? 'Falta el centro del proyecto.' : 'Se dibuja con los mismos polígonos guardados.',
    },
    {
      name: '5. Precios',
      level: noPrice.length || priceMismatch.length ? 'warn' : 'ok',
      detail:
        (pricing ? `Modo ${pricing.pricing_mode}, valor ${pricing.unit_price.toLocaleString('es-CL')}.` : 'Sin modo de precio configurado (se usa el precio de cada lote).') +
        (noPrice.length ? ` Disponibles sin precio: ${list(noPrice)}.` : '') +
        (priceMismatch.length ? ` No cuadran con superficie × valor: ${list(priceMismatch)}.` : ''),
    },
    {
      name: '6. PDF masterplan',
      level: valid === 0 ? 'error' : 'ok',
      detail: valid === 0 ? 'No se puede generar: faltan polígonos.' : 'Usa exactamente la geometría de la web.',
    },
    {
      name: '7. Diseñador 3D',
      level: valid === 0 ? 'error' : 'ok',
      detail: valid === 0 ? 'Ninguna parcela tiene polígono para diseñar.' : `${valid} parcelas listas para diseñar con sus vecinas.`,
    },
  ];
}

const icon = { ok: CheckCircle2, warn: AlertTriangle, error: XCircle };
const tone = { ok: 'text-emerald-500', warn: 'text-amber-500', error: 'text-destructive' };

export function SpatialValidationPanel(props: Props) {
  const stages = buildSpatialStages(props);
  const errors = stages.filter((s) => s.level === 'error').length;
  const warns = stages.filter((s) => s.level === 'warn').length;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Validación del flujo</CardTitle>
        <CardDescription>
          {errors ? `${errors} etapa(s) bloqueadas` : warns ? `Listo con ${warns} advertencia(s)` : 'Todo el flujo está listo para publicar'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        {stages.map((s) => {
          const Icon = icon[s.level];
          return (
            <div key={s.name} className="flex gap-3 rounded-lg border border-border p-3">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone[s.level]}`} />
              <div className="text-sm">
                <p className="font-medium">{s.name}</p>
                <p className="text-muted-foreground">{s.detail}</p>
                {s.fix && <p className="mt-1 text-xs">{s.fix}</p>}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
