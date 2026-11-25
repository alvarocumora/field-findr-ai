import { getLotSurface, formatM2 } from '@/lib/lots/lotSurface';

export function LotSurfaceTable({ area, className = '' }: { area: number | null | undefined; className?: string }) {
  const s = getLotSurface(area);
  if (!s) return null;
  return (
    <section className={`rounded-2xl border border-border bg-muted/60 p-4 ${className}`}>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cuadro de superficie · DL 3.516</p>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="font-medium">Superficie total del lote</dt><dd className="font-mono font-semibold">{formatM2(s.officialM2)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Servidumbre de tránsito</dt><dd className="font-mono">{s.easementM2 > 0 ? formatM2(s.easementM2) : 'Incluida'}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Superficie útil (dentro de deslindes)</dt><dd className="font-mono">{formatM2(s.usefulM2)}</dd></div>
      </dl>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">Todas las parcelas cumplen el mínimo legal de 5.000 m² (DL 3.516). La diferencia con la superficie útil corresponde a la servidumbre de tránsito que da acceso a cada lote.</p>
    </section>
  );
}
