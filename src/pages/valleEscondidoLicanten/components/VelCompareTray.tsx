import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, GitCompareArrows, MapPinned, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useVelLots } from '../data/useVelLots';
import { calculateRuralScore } from '../data/lotIntelligence';
import { useVelState } from '../state/VelContext';

const formatClp = (value: number) => value > 0 ? `$${value.toLocaleString('es-CL')}` : 'Consultar';

export default function VelCompareTray() {
  const [open, setOpen] = useState(false);
  const { lots } = useVelLots();
  const { shortlistIds, toggleShortlist, clearShortlist, requestFocus } = useVelState();

  const selected = useMemo(
    () => shortlistIds.map((id) => lots.find((lot) => lot.id === id)).filter(Boolean) as typeof lots,
    [lots, shortlistIds],
  );

  const metrics = useMemo(
    () => selected.map((lot) => ({ lot, score: calculateRuralScore(lot, lots, null) })),
    [selected, lots],
  );

  if (selected.length === 0) return null;

  const availableSelected = selected.filter((lot) => lot.status === 'available');
  const priced = availableSelected.filter((lot) => lot.price_clp > 0);
  const cheapestId = priced.length ? priced.reduce((a, b) => (a.price_clp <= b.price_clp ? a : b)).id : null;
  const largestId = availableSelected.length ? availableSelected.reduce((a, b) => (a.area_m2 >= b.area_m2 ? a : b)).id : null;
  const bestValueId = priced.length
    ? priced.reduce((a, b) => (a.price_clp / a.area_m2 <= b.price_clp / b.area_m2 ? a : b)).id
    : null;

  const focusLot = (lotId: string) => {
    setOpen(false);
    requestFocus(lotId);
    setTimeout(() => document.getElementById('masterplan')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  return (
    <>
      <div className="fixed inset-x-3 bottom-[76px] z-[49] md:bottom-[88px] md:left-1/2 md:right-auto md:w-[min(900px,calc(100%-3rem))] md:-translate-x-1/2">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--hue-amber)]/30 bg-[#07110b]/95 px-3 py-2.5 shadow-2xl backdrop-blur-xl md:rounded-full md:px-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            <div className="hidden shrink-0 items-center gap-2 pr-1 text-[10px] uppercase tracking-[0.14em] text-[var(--hue-amber)] sm:flex">
              <GitCompareArrows className="h-3.5 w-3.5" /> Shortlist
            </div>
            {selected.map((lot) => (
              <button
                key={lot.id}
                type="button"
                onClick={() => toggleShortlist(lot.id)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[10px] text-[var(--hue-bone)]/80 transition hover:border-red-400/40"
                title="Quitar de la comparación"
              >
                Lote {lot.lot_number} <X className="h-3 w-3" />
              </button>
            ))}
            {selected.length < 4 && (
              <span className="shrink-0 text-[10px] text-[var(--hue-bone)]/35">{4 - selected.length} cupos</span>
            )}
          </div>
          <button
            type="button"
            onClick={clearShortlist}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-[var(--hue-bone)]/50 transition hover:text-[var(--hue-bone)] sm:inline-flex"
            aria-label="Limpiar shortlist"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={selected.length < 2}
            onClick={() => setOpen(true)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--hue-amber)] px-3.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#07110b] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GitCompareArrows className="h-3.5 w-3.5" /> Comparar {selected.length}
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-[96vw] overflow-y-auto border-white/10 bg-[#08140d] text-[var(--hue-bone)] lg:max-w-6xl">
          <DialogHeader>
            <DialogTitle className="serif text-2xl md:text-3xl">Comparador inteligente de lotes</DialogTitle>
            <DialogDescription className="text-[var(--hue-bone)]/55">
              Comparación objetiva dentro de Valle Escondido. El Rural Score mostrado aquí no incorpora topografía hasta abrir cada lote en Terrain 3D.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-40 border-b border-white/10 bg-[#08140d] p-3 text-left text-[10px] uppercase tracking-[0.14em] text-[var(--hue-bone)]/45">Métrica</th>
                  {metrics.map(({ lot }) => (
                    <th key={lot.id} className="min-w-48 border-b border-white/10 p-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="serif text-xl">Lote {lot.lot_number}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--hue-bone)]/45">{lot.status === 'available' ? 'Disponible' : lot.status === 'reserved' ? 'Reservada' : 'Vendida'}</div>
                        </div>
                        <button type="button" onClick={() => toggleShortlist(lot.id)} className="rounded-full border border-white/10 p-1.5 text-[var(--hue-bone)]/45 hover:text-[var(--hue-bone)]" aria-label={`Quitar lote ${lot.lot_number}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {lot.id === cheapestId && <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[9px] text-emerald-300">Menor precio</span>}
                        {lot.id === largestId && <span className="rounded-full bg-sky-500/15 px-2 py-1 text-[9px] text-sky-300">Mayor superficie</span>}
                        {lot.id === bestValueId && <span className="rounded-full bg-[var(--hue-amber)]/15 px-2 py-1 text-[9px] text-[var(--hue-amber)]">Mejor $/m²</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Precio', (x: typeof metrics[number]) => formatClp(x.lot.price_clp)],
                  ['Superficie', (x: typeof metrics[number]) => `${x.lot.area_m2.toLocaleString('es-CL')} m²`],
                  ['Precio/m²', (x: typeof metrics[number]) => x.score.pricePerM2 ? `$${x.score.pricePerM2.toLocaleString('es-CL')}` : '—'],
                  ['Rural Score base', (x: typeof metrics[number]) => `${x.score.overall}/100`],
                  ['Score valor', (x: typeof metrics[number]) => `${x.score.value}/100`],
                  ['Score amplitud', (x: typeof metrics[number]) => `${x.score.space}/100`],
                ].map(([label, getValue]) => (
                  <tr key={label as string}>
                    <td className="sticky left-0 z-10 border-b border-white/5 bg-[#08140d] p-3 text-[11px] text-[var(--hue-bone)]/45">{label as string}</td>
                    {metrics.map((metric) => (
                      <td key={metric.lot.id} className="border-b border-white/5 p-3 font-medium tabular-nums">{(getValue as (x: typeof metrics[number]) => string)(metric)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="sticky left-0 z-10 bg-[#08140d] p-3 text-[11px] text-[var(--hue-bone)]/45">Acciones</td>
                  {metrics.map(({ lot }) => (
                    <td key={lot.id} className="p-3">
                      <div className="grid gap-2">
                        <button type="button" onClick={() => focusLot(lot.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-[var(--hue-amber)]/40 bg-[var(--hue-amber)]/10 px-3 text-[10px] uppercase tracking-[0.1em]">
                          <MapPinned className="h-3.5 w-3.5" /> Terrain 3D
                        </button>
                        {lot.listing_id && (
                          <Link to={`/propiedad/${lot.listing_id}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-3 text-[10px] uppercase tracking-[0.1em]">
                            <Check className="h-3.5 w-3.5" /> Ver ficha
                          </Link>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[10px] leading-relaxed text-[var(--hue-bone)]/35">
            “Menor precio”, “Mayor superficie” y “Mejor $/m²” se calculan únicamente entre los lotes seleccionados y disponibles. No constituyen recomendación de compra.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
