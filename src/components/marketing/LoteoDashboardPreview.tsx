import { BarChart3, CalendarCheck, CheckCircle2, Grid3X3, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const KPI = [
  { label: 'Lotes', value: '148', detail: '52 disponibles', icon: Grid3X3, color: 'text-primary' },
  { label: 'Vendidos', value: '62%', detail: '92 unidades', icon: CheckCircle2, color: 'text-sky-400' },
  { label: 'Reservas', value: '7', detail: '3 por cerrar', icon: CalendarCheck, color: 'text-amber-400' },
  { label: 'Ventas', value: '$1.240M', detail: 'acumuladas', icon: Wallet, color: 'text-emerald-400' },
];

const LOTS = Array.from({ length: 56 }, (_, index) => {
  if (index < 31) return 'sold';
  if (index < 38) return 'reserved';
  return 'available';
});

const lotColor: Record<string, string> = {
  sold: 'bg-sky-500',
  reserved: 'bg-amber-400',
  available: 'bg-emerald-500',
};

const LoteoDashboardPreview = () => (
  <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 p-3 text-white shadow-2xl md:p-5">
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
    <div className="relative rounded-[1.35rem] border border-white/10 bg-black/35 p-4 backdrop-blur md:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-300">Demo operativo</Badge>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/40">Actualización en vivo</span>
          </div>
          <h3 className="mt-3 text-xl font-bold md:text-2xl">Control de Loteo · Proyecto Mirador</h3>
          <p className="mt-1 text-sm text-white/50">Inventario, ventas y equipo en una sola vista.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Preparación comercial</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">100%</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {KPI.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center gap-2 text-xs text-white/45">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              {item.label}
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">{item.value}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Mapa rápido de inventario</p>
              <p className="text-[11px] text-white/40">Selecciona una parcela para cotizar o reservar.</p>
            </div>
            <Grid3X3 className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-5 grid grid-cols-8 gap-1.5 sm:grid-cols-14">
            {LOTS.map((status, index) => (
              <span
                key={index}
                className={`aspect-square rounded-[4px] ${lotColor[status]} opacity-85 transition hover:opacity-100`}
                title={`Lote ${index + 1} · ${status}`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-white/45">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" />Disponible</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-400" />Reservado</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-sky-500" />Vendido</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Ritmo comercial</p>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs">
              <span className="text-white/45">Avance de venta</span>
              <span className="font-semibold">62%</span>
            </div>
            <Progress value={62} className="mt-2 h-2" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-black/25 p-3">
              <p className="text-lg font-bold">5,4</p>
              <p className="text-[10px] text-white/40">lotes/mes</p>
            </div>
            <div className="rounded-xl bg-black/25 p-3">
              <p className="text-lg font-bold">10m</p>
              <p className="text-[10px] text-white/40">para agotar stock</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07] p-3">
            <Users className="h-4 w-4 text-emerald-400" />
            <p className="text-[11px] text-white/60">12 leads nuevos esta semana</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LoteoDashboardPreview;
