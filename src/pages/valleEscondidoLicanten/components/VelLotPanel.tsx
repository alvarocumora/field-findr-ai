import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronRight, Loader2, Mountain, ShoppingCart, Sparkles, X } from 'lucide-react';
import VisitScheduleDialog from '@/components/visits/VisitScheduleDialog';
import { LotReserveDialog } from '@/components/sales/LotReserveDialog';
import type { SalesLot } from '@/components/sales/LotSalesSheet';
import type { VelLot } from '../data/lots';
import type { VelTerrainInsight } from '../data/lotIntelligence';
import { calculateRuralScore } from '../data/lotIntelligence';
import { VEL_PROJECT } from '../data/project';

interface Props {
  lot: VelLot;
  allLots: VelLot[];
  terrain: VelTerrainInsight | null;
  terrainLoading?: boolean;
  onClose: () => void;
  onFocus: () => void;
}

const STATUS_LABEL = {
  available: 'Disponible',
  reserved: 'Reservada',
  sold: 'Vendida',
} as const;

export default function VelLotPanel({ lot, allLots, terrain, terrainLoading, onClose, onFocus }: Props) {
  const [visitOpen, setVisitOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const score = useMemo(() => calculateRuralScore(lot, allLots, terrain), [lot, allLots, terrain]);

  const salesLot: SalesLot = {
    id: lot.id,
    lot_number: lot.lot_number,
    status: lot.status,
    area: lot.area_m2,
    price: lot.price_clp || null,
  };

  const metrics = [
    { label: 'Valor', value: score.value },
    { label: 'Amplitud', value: score.space },
    { label: 'Terreno', value: score.terrain },
  ];

  return (
    <>
      <div className="absolute bottom-3 left-3 right-3 z-20 max-h-[78%] overflow-y-auto rounded-xl border border-white/15 bg-[#07110b]/96 p-4 shadow-2xl backdrop-blur-xl md:bottom-auto md:left-auto md:right-4 md:top-4 md:w-[370px] md:max-h-[calc(100%-2rem)] md:p-5">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-white/10 p-2 text-[var(--hue-bone)]/60 transition hover:text-[var(--hue-bone)]"
          aria-label="Cerrar ficha"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="pr-10">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--hue-amber)]">
            Lote {lot.lot_number} · {STATUS_LABEL[lot.status]}
          </div>
          <div className="mt-2 serif text-3xl text-[var(--hue-bone)]">
            {lot.area_m2.toLocaleString('es-CL')} m²
          </div>
          <div className="mt-1 text-sm text-[var(--hue-bone)]/65">
            {lot.price_clp > 0 ? `$${lot.price_clp.toLocaleString('es-CL')} CLP` : 'Precio no publicado'}
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-[var(--hue-amber)]/25 bg-[var(--hue-amber)]/[0.07] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--hue-bone)]/55">
              <Sparkles className="h-3.5 w-3.5 text-[var(--hue-amber)]" /> Rural Score
            </div>
            <div className="serif text-3xl text-[var(--hue-bone)]">{score.overall}</div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-md border border-white/8 bg-black/15 p-2">
                <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--hue-bone)]/40">{metric.label}</div>
                <div className="mt-1 text-sm font-medium text-[var(--hue-bone)]">
                  {metric.value === null ? '—' : metric.value}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[9px] leading-relaxed text-[var(--hue-bone)]/35">
            Score orientativo para comparar lotes dentro de este proyecto; no reemplaza un estudio topográfico ni una tasación.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {score.insights.map((insight) => (
            <div key={insight} className="flex gap-2 text-[11px] leading-relaxed text-[var(--hue-bone)]/60">
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[var(--hue-amber)]" />
              {insight}
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/8 pt-4">
          <div className="rounded-md bg-white/[0.025] p-3">
            <div className="text-[9px] uppercase tracking-[0.1em] text-[var(--hue-bone)]/40">Precio/m²</div>
            <div className="mt-1 text-sm text-[var(--hue-bone)]">
              {score.pricePerM2 ? `$${score.pricePerM2.toLocaleString('es-CL')}` : '—'}
            </div>
          </div>
          <div className="rounded-md bg-white/[0.025] p-3">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-[var(--hue-bone)]/40">
              <Mountain className="h-3 w-3" /> Elevación
            </div>
            <div className="mt-1 text-sm text-[var(--hue-bone)]">
              {terrainLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : terrain ? (
                `${terrain.elevationAvg} m · ${terrain.slopeDegrees.toFixed(1)}°`
              ) : (
                'No disponible'
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onFocus} className="hue-pill justify-center text-[10px]">
            Ver en 3D
          </button>
          {lot.listing_id ? (
            <Link to={`/propiedad/${lot.listing_id}`} className="hue-pill justify-center text-[10px]">
              Ficha completa
            </Link>
          ) : (
            <a href="#contacto" className="hue-pill justify-center text-[10px]">Consultar</a>
          )}
        </div>

        {lot.status === 'available' && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisitOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-white/15 bg-white/[0.03] px-3 text-[10px] uppercase tracking-[0.1em] text-[var(--hue-bone)]"
            >
              <CalendarCheck className="h-3.5 w-3.5" /> Visitar
            </button>
            <button
              type="button"
              onClick={() => setReserveOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[var(--hue-amber)]/55 bg-[var(--hue-amber)]/10 px-3 text-[10px] uppercase tracking-[0.1em] text-[var(--hue-bone)]"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Reservar
            </button>
          </div>
        )}
      </div>

      <VisitScheduleDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        projectId={VEL_PROJECT.id}
        projectName={VEL_PROJECT.name}
        lotId={lot.id}
        lotNumber={lot.lot_number}
      />
      <LotReserveDialog
        lot={reserveOpen ? salesLot : null}
        open={reserveOpen}
        onOpenChange={setReserveOpen}
        projectName={VEL_PROJECT.name}
      />
    </>
  );
}
