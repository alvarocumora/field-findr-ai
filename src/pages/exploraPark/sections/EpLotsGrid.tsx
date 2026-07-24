import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, MapPin, MessageSquare } from 'lucide-react';
import { EXPLORA_PARK_LOTS, type EpLotStatus } from '../data/lots';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EpLeadForm from '../components/EpLeadForm';

type StatusKey = 'all' | EpLotStatus;
type SortKey = 'num' | 'area_asc' | 'area_desc' | 'price_asc' | 'price_desc';

const STATUS_LABEL: Record<EpLotStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservada',
  sold: 'Vendida',
};
const STATUS_TONE: Record<EpLotStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  reserved: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  sold: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

const PAGE = 60;

export default function EpLotsGrid() {
  const [status, setStatus] = useState<StatusKey>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('num');
  const [visible, setVisible] = useState(PAGE);
  const [leadLot, setLeadLot] = useState<{ id: string; number: string; status: EpLotStatus } | null>(null);

  const counts = useMemo(() => {
    const c = { all: EXPLORA_PARK_LOTS.length, available: 0, reserved: 0, sold: 0 };
    for (const l of EXPLORA_PARK_LOTS) c[l.status]++;
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = EXPLORA_PARK_LOTS.filter((l) => {
      if (status !== 'all' && l.status !== status) return false;
      if (q && !l.lot_number.includes(q)) return false;
      return true;
    });
    switch (sort) {
      case 'area_asc': arr.sort((a, b) => a.area_m2 - b.area_m2); break;
      case 'area_desc': arr.sort((a, b) => b.area_m2 - a.area_m2); break;
      case 'price_asc': arr.sort((a, b) => a.price_clp - b.price_clp); break;
      case 'price_desc': arr.sort((a, b) => b.price_clp - a.price_clp); break;
      default: arr.sort((a, b) => parseInt(a.lot_number) - parseInt(b.lot_number));
    }
    return arr;
  }, [status, query, sort]);

  const shown = filtered.slice(0, visible);

  return (
    <section id="lotes" className="relative px-6 py-24 md:px-16 bg-[#06120a]/40 scroll-mt-16">
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="hue-eyebrow mb-3">Grilla de lotes · {counts.all} parcelas</div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
              Filtra, ordena <span className="italic text-[var(--hue-bone)]/55">y elige tu parcela.</span>
            </h2>
          </div>
          <p className="max-w-md text-[13px] text-[var(--hue-bone)]/55">
            Cada lote enlaza a su ficha pública: precio, superficie, mapa, documentación y opción
            de reserva.
          </p>
        </motion.div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'available', 'reserved', 'sold'] as StatusKey[]).map((k) => (
              <button
                key={k}
                onClick={() => { setStatus(k); setVisible(PAGE); }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] tracking-[0.1em] uppercase transition ${
                  status === k
                    ? 'border-[var(--hue-amber)]/60 bg-[var(--hue-amber)]/10 text-[var(--hue-bone)]'
                    : 'border-white/10 bg-white/[0.02] text-[var(--hue-bone)]/60 hover:text-[var(--hue-bone)]'
                }`}
              >
                {k === 'all' ? 'Todas' : STATUS_LABEL[k]}
                <span className="tabular-nums opacity-70">{counts[k as keyof typeof counts]}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--hue-bone)]/40" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setVisible(PAGE); }}
                placeholder="Buscar Nº"
                className="w-40 rounded-sm border border-white/10 bg-white/[0.03] py-2 pl-8 pr-3 text-[12px] text-[var(--hue-bone)] placeholder:text-[var(--hue-bone)]/40 focus:border-[var(--hue-amber)]/50 focus:outline-none"
              />
            </div>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--hue-bone)]/40" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="appearance-none rounded-sm border border-white/10 bg-white/[0.03] py-2 pl-8 pr-8 text-[12px] text-[var(--hue-bone)] focus:border-[var(--hue-amber)]/50 focus:outline-none"
              >
                <option value="num">Nº de lote</option>
                <option value="area_asc">Superficie ↑</option>
                <option value="area_desc">Superficie ↓</option>
                <option value="price_asc">Precio ↑</option>
                <option value="price_desc">Precio ↓</option>
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-sm border border-white/10 bg-white/[0.02] p-12 text-center text-[var(--hue-bone)]/60">
            No hay parcelas que coincidan con tu filtro.
          </div>
        ) : (
          <>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {shown.map((l) => {
                const href = l.listing_id
                  ? `/propiedad/${l.listing_id}`
                  : `/proyecto/6e6f62be-a81a-4374-a3ef-cf296bd638d0`;
                return (
                  <div
                    key={l.id}
                    className="group rounded-sm border border-white/10 bg-white/[0.02] p-3 hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05] transition flex flex-col"
                  >
                    <div className="flex items-start justify-between">
                      <div className="serif text-xl font-light text-[var(--hue-bone)]">
                        Lote {l.lot_number}
                      </div>
                      <span className={`text-[9px] tracking-[0.18em] uppercase rounded border px-1.5 py-0.5 ${STATUS_TONE[l.status]}`}>
                        {STATUS_LABEL[l.status]}
                      </span>
                    </div>
                    <div className="mt-3 text-[11px] text-[var(--hue-bone)]/55 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Hualañé · Maule
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-[var(--hue-bone)]/50">Superficie</span>
                        <span className="tabular-nums text-[var(--hue-bone)]">
                          {l.area_m2.toLocaleString('es-CL')} m²
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-[11px]">
                        <span className="text-[var(--hue-bone)]/50">Precio</span>
                        <span className="tabular-nums text-[var(--hue-bone)] font-medium">
                          ${l.price_clp.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-2">
                      <Link
                        to={href}
                        className="flex-1 text-[10px] tracking-[0.18em] uppercase text-[var(--hue-amber)] hover:text-[var(--hue-bone)] transition"
                      >
                        Ver ficha →
                      </Link>
                      <button
                        type="button"
                        onClick={() => setLeadLot({ id: l.id, number: l.lot_number, status: l.status })}
                        className="inline-flex items-center gap-1 rounded-sm border border-white/15 bg-white/[0.03] px-2 py-1 text-[10px] tracking-[0.14em] uppercase text-[var(--hue-bone)]/80 hover:border-[var(--hue-amber)]/50 hover:text-[var(--hue-bone)] transition"
                        title="Consultar por este lote"
                      >
                        <MessageSquare className="h-3 w-3" /> Consultar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {visible < filtered.length && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setVisible((v) => v + PAGE)}
                  className="hue-pill hover:bg-white/8 transition"
                >
                  Cargar más ({filtered.length - visible} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
