import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, MapPinned, Search, Sparkles } from 'lucide-react';
import { useSmartSearch } from '@/hooks/useAI';
import { useVelLots } from '../data/useVelLots';
import { rankLotsForIntent } from '../data/lotIntelligence';
import { useVelState } from '../state/VelContext';

const EXAMPLES = [
  'Tengo hasta 25 millones y quiero al menos 5.000 m²',
  'Busco una parcela grande por menos de 30 millones',
  'Quiero la mejor relación precio por m²',
];

export default function VelAiLotMatcher() {
  const [query, setQuery] = useState('');
  const { result, isLoading, search } = useSmartSearch();
  const { lots } = useVelLots();
  const { requestFocus } = useVelState();

  const matches = useMemo(
    () =>
      rankLotsForIntent(
        lots,
        result
          ? {
              priceRange: result.priceRange,
              areaRange: result.areaRange,
            }
          : null,
      ).slice(0, 3),
    [lots, result],
  );

  const run = async (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setQuery(clean);
    await search(clean);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void run(query);
  };

  const focusLot = (lotId: string) => {
    requestFocus(lotId);
    document.getElementById('masterplan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative px-6 py-20 md:px-16">
      <div className="mx-auto max-w-6xl rounded-2xl border border-[var(--hue-amber)]/20 bg-gradient-to-br from-white/[0.055] to-white/[0.015] p-5 shadow-[0_35px_100px_-55px_rgba(201,176,107,.7)] md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]"
        >
          <div>
            <div className="hue-eyebrow mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> Rural Finder AI · Lot Matcher
            </div>
            <h2 className="serif text-[clamp(2rem,4.8vw,3.4rem)] leading-[.98]">
              Describe lo que buscas.
              <span className="block italic text-[var(--hue-bone)]/55">La IA encuentra tus lotes.</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--hue-bone)]/60">
              La IA interpreta presupuesto y superficie. La selección final se calcula exclusivamente
              sobre el inventario real y la disponibilidad vigente de Valle Escondido.
            </p>

            <form onSubmit={submit} className="mt-7">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hue-amber)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej: hasta $25 millones y más de 5.500 m²"
                  className="min-h-14 w-full rounded-full border border-white/15 bg-black/20 pl-11 pr-14 text-sm text-[var(--hue-bone)] outline-none transition placeholder:text-[var(--hue-bone)]/35 focus:border-[var(--hue-amber)]/55"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--hue-amber)] text-[#07110b] disabled:opacity-40"
                  aria-label="Buscar lotes con IA"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => void run(example)}
                  className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-left text-[10px] text-[var(--hue-bone)]/60 transition hover:border-[var(--hue-amber)]/40 hover:text-[var(--hue-bone)]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 md:p-5">
            {!result && !isLoading && (
              <div className="flex h-full min-h-56 items-center justify-center text-center">
                <div>
                  <Sparkles className="mx-auto h-7 w-7 text-[var(--hue-amber)]/70" />
                  <p className="mt-3 text-sm text-[var(--hue-bone)]/60">
                    Escribe tus criterios y te mostraremos los 3 lotes con mejor ajuste.
                  </p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-[var(--hue-bone)]/60">
                <Loader2 className="h-4 w-4 animate-spin" /> Interpretando tu búsqueda…
              </div>
            )}

            {result && !isLoading && (
              <div>
                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--hue-amber)]">Interpretación IA</div>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--hue-bone)]/65">{result.suggestion}</p>
                </div>

                <div className="space-y-2.5">
                  {matches.map(({ lot, score, reasons }, index) => (
                    <button
                      key={lot.id}
                      type="button"
                      onClick={() => focusLot(lot.id)}
                      className="group flex w-full items-center gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-3 text-left transition hover:border-[var(--hue-amber)]/45 hover:bg-white/[0.05]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--hue-amber)]/30 bg-[var(--hue-amber)]/10 serif text-lg">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="font-medium text-[var(--hue-bone)]">Lote {lot.lot_number}</div>
                          <div className="text-[11px] font-semibold text-[var(--hue-amber)]">{score}% match</div>
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--hue-bone)]/55">
                          {lot.area_m2.toLocaleString('es-CL')} m² · ${lot.price_clp.toLocaleString('es-CL')}
                        </div>
                        <div className="mt-1 truncate text-[10px] text-[var(--hue-bone)]/40">
                          {reasons.join(' · ') || 'Buen equilibrio de precio y superficie'}
                        </div>
                      </div>
                      <MapPinned className="h-4 w-4 shrink-0 text-[var(--hue-bone)]/40 transition group-hover:text-[var(--hue-amber)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
