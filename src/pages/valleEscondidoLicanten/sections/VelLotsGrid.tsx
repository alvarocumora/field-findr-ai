import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowUpDown, MapPin, MessageSquare, Crosshair, FileDown, CalendarCheck, ShoppingCart } from 'lucide-react';
import { type VelLotStatus } from '../data/lots';
import { useVelLots } from '../data/useVelLots';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VelLeadForm from '../components/VelLeadForm';
import { useVelState } from '../state/VelContext';
import { VEL_PROJECT } from '../data/project';
import { generateLotDataCardPdf } from '@/lib/lotDataCardPdf';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { toast } from 'sonner';
import VisitScheduleDialog from '@/components/visits/VisitScheduleDialog';
import { LotReserveDialog } from '@/components/sales/LotReserveDialog';
import type { SalesLot } from '@/components/sales/LotSalesSheet';

type SortKey = 'num' | 'area_asc' | 'area_desc' | 'price_asc' | 'price_desc';

const STATUS_LABEL: Record<VelLotStatus, string> = {
  available: 'Disponible',
  reserved: 'Reservada',
  sold: 'Vendida',
};
const STATUS_TONE: Record<VelLotStatus, string> = {
  available: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  reserved: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  sold: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

const PAGE = 60;
const ALL_STATUSES: VelLotStatus[] = ['available', 'reserved', 'sold'];

export default function VelLotsGrid() {
  const {
    activeStatus,
    toggleStatus,
    setOnlyStatus,
    hoveredLotId,
    setHoveredLotId,
    requestFocus,
  } = useVelState();

  const { lots } = useVelLots();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('num');
  const [visible, setVisible] = useState(PAGE);
  const [leadLot, setLeadLot] = useState<{ id: string; number: string; status: VelLotStatus } | null>(null);
  const [pdfLot, setPdfLot] = useState<string | null>(null);
  const [visitLot, setVisitLot] = useState<{ id: string; number: string } | null>(null);
  const [reserveLot, setReserveLot] = useState<SalesLot | null>(null);
  const { token: mapboxToken } = useMapboxToken();

  const downloadFicha = async (lot: (typeof lots)[number]) => {
    setPdfLot(lot.id);
    try {
      await generateLotDataCardPdf(
        {
          id: lot.id,
          project_id: VEL_PROJECT.id,
          lot_number: lot.lot_number,
          name: null,
          area: lot.area_m2,
          price: lot.price_clp || null,
          price_per_sqm: lot.price_clp ? Math.round(lot.price_clp / lot.area_m2) : null,
          status: lot.status,
          latitude: lot.centroid[1],
          longitude: lot.centroid[0],
          polygon: lot.polygon,
        } as never,
        VEL_PROJECT.name,
        { hasRoad: true } as never,
        { mapboxToken }
      );
    } catch {
      toast.error('No pudimos generar la ficha PDF');
    } finally {
      setPdfLot(null);
    }
  };

  const counts = useMemo(() => {
    const c = { all: lots.length, available: 0, reserved: 0, sold: 0 };
    for (const l of lots) c[l.status]++;
    return c;
  }, [lots]);

  const allActive = ALL_STATUSES.every((s) => activeStatus.has(s));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const arr = lots.filter((l) => {
      if (!activeStatus.has(l.status)) return false;
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
  }, [activeStatus, query, sort, lots]);

  const shown = filtered.slice(0, visible);

  const handleFocusOnMap = (lotId: string) => {
    requestFocus(lotId);
    document.getElementById('masterplan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chipClasses = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] tracking-[0.1em] uppercase transition ${
      active
        ? 'border-[var(--hue-amber)]/60 bg-[var(--hue-amber)]/10 text-[var(--hue-bone)]'
        : 'border-white/10 bg-white/[0.02] text-[var(--hue-bone)]/60 hover:text-[var(--hue-bone)]'
    }`;

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
            <div className="hue-eyebrow mb-3">
              Grilla de lotes · {filtered.length} de {counts.all} visibles
            </div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
              Filtra, ordena <span className="italic text-[var(--hue-bone)]/55">y elige tu parcela.</span>
            </h2>
          </div>
          <p className="max-w-md text-[13px] text-[var(--hue-bone)]/55">
            Filtros sincronizados con el masterplan. Pasa el mouse sobre una tarjeta para
            resaltarla en el mapa, o usa <Crosshair className="inline h-3 w-3" /> para centrarlo.
          </p>
        </motion.div>

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setOnlyStatus('all'); setVisible(PAGE); }}
              className={chipClasses(allActive)}
            >
              Todas <span className="tabular-nums opacity-70">{counts.all}</span>
            </button>
            {ALL_STATUSES.map((k) => {
              const active = activeStatus.has(k) && !allActive;
              return (
                <button
                  key={k}
                  onClick={() => { toggleStatus(k); setVisible(PAGE); }}
                  className={chipClasses(active)}
                >
                  {STATUS_LABEL[k]}
                  <span className="tabular-nums opacity-70">{counts[k]}</span>
                </button>
              );
            })}
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
                // Sin ficha publicada (lotes reservados) enlazamos al proyecto,
                // no a una ruta inexistente que caía en NotFound.
                const href = l.listing_id
                  ? `/propiedad/${l.listing_id}`
                  : `/proyecto/${VEL_PROJECT.id}`;
                const isHovered = hoveredLotId === l.id;
                return (
                  <div
                    id={`vel-lot-${l.id}`}
                    key={l.id}
                    onMouseEnter={() => setHoveredLotId(l.id)}
                    onMouseLeave={() => setHoveredLotId(null)}
                    className={`group rounded-sm border p-3 transition flex flex-col ${
                      isHovered
                        ? 'border-[var(--hue-amber)]/70 bg-[var(--hue-amber)]/10 ring-1 ring-[var(--hue-amber)]/40'
                        : 'border-white/10 bg-white/[0.02] hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05]'
                    }`}
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
                      <MapPin className="h-3 w-3" /> Licantén · Maule
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
                        <span className="tabular-nums font-medium text-[var(--hue-bone)]">
                          {l.price_clp ? `$${l.price_clp.toLocaleString('es-CL')}` : 'Consultar'}
                        </span>
                      </div>
                      {l.price_clp > 0 && (
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className="text-[var(--hue-bone)]/50">Precio/m²</span>
                          <span className="tabular-nums text-[var(--hue-bone)]/70">
                            ${Math.round(l.price_clp / l.area_m2).toLocaleString('es-CL')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 border-t border-white/5 pt-2">
                      <Link
                        to={href}
                        className="flex-1 text-[10px] tracking-[0.18em] uppercase text-[var(--hue-amber)] hover:text-[var(--hue-bone)] transition"
                      >
                        Ficha →
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleFocusOnMap(l.id)}
                        className="inline-flex items-center justify-center rounded-sm border border-white/15 bg-white/[0.03] p-1.5 text-[var(--hue-bone)]/80 hover:border-[var(--hue-amber)]/50 hover:text-[var(--hue-bone)] transition"
                        title="Ver en el mapa"
                        aria-label="Ver en el mapa"
                      >
                        <Crosshair className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeadLot({ id: l.id, number: l.lot_number, status: l.status })}
                        className="inline-flex items-center justify-center rounded-sm border border-white/15 bg-white/[0.03] p-1.5 text-[var(--hue-bone)]/80 hover:border-[var(--hue-amber)]/50 hover:text-[var(--hue-bone)] transition"
                        title="Consultar por este lote"
                        aria-label="Consultar por este lote"
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFicha(l)}
                        disabled={pdfLot === l.id}
                        className="inline-flex items-center justify-center rounded-sm border border-white/15 bg-white/[0.03] p-1.5 text-[var(--hue-bone)]/80 transition hover:border-[var(--hue-amber)]/50 hover:text-[var(--hue-bone)] disabled:opacity-40"
                        title="Descargar ficha PDF con QR"
                        aria-label="Descargar ficha PDF con QR"
                      >
                        <FileDown className="h-3 w-3" />
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

      <Dialog open={!!leadLot} onOpenChange={(o) => !o && setLeadLot(null)}>
        <DialogContent className="max-w-lg bg-[#0d1b12] border-white/10 text-[var(--hue-bone)]">
          <DialogHeader>
            <DialogTitle className="serif text-2xl">
              Consultar por Lote {leadLot?.number}
            </DialogTitle>
          </DialogHeader>
          {leadLot && (
            <VelLeadForm
              lotId={leadLot.id}
              lotNumber={leadLot.number}
              lotStatus={leadLot.status}
              defaultReason={leadLot.status === 'available' ? 'reserva' : 'informacion'}
              compact
              onSuccess={() => setTimeout(() => setLeadLot(null), 1800)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
