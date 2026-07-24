import { motion } from 'framer-motion';
import { MapPin, Ruler, Sprout, ShieldCheck } from 'lucide-react';
import { EXPLORA_PARK_PROJECT } from '../data/project';

const fmtClp = (n: number) => `$${n.toLocaleString('es-CL')}`;

export default function EpFicha() {
  const rows: Array<[string, string]> = [
    ['Ubicación', `${EXPLORA_PARK_PROJECT.city}, ${EXPLORA_PARK_PROJECT.region}`],
    ['Superficie total', `${EXPLORA_PARK_PROJECT.totalAreaHa} ha`],
    ['Cantidad de parcelas', `${EXPLORA_PARK_PROJECT.totalLots}`],
    ['Superficie promedio', `${EXPLORA_PARK_PROJECT.avgAreaM2.toLocaleString('es-CL')} m²`],
    ['Precio promedio', fmtClp(EXPLORA_PARK_PROJECT.avgPriceClp)],
    ['Régimen', 'Subdivisión rural DL 3.516'],
    ['Rol Matriz', 'En trámite'],
    ['Coordenadas', `${EXPLORA_PARK_PROJECT.center.lat.toFixed(4)}, ${EXPLORA_PARK_PROJECT.center.lng.toFixed(4)}`],
  ];

  return (
    <section className="relative px-6 py-24 md:px-16">
      <div className="mx-auto max-w-6xl grid gap-16 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
        >
          <div className="hue-eyebrow mb-4">Ficha del proyecto</div>
          <h2 className="serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
            Un valle abierto <span className="italic text-[var(--hue-bone)]/55">a un paso del lago Vichuquén.</span>
          </h2>
          <div className="hue-divider my-8 max-w-xs" />
          <p className="text-[15px] leading-relaxed text-[var(--hue-bone)]/70">
            Explora Park es un loteo de {EXPLORA_PARK_PROJECT.totalLots} parcelas ubicado en Hualañé,
            en el corazón agrícola del Maule. La geografía de lomajes suaves y trigales define el carácter
            del proyecto: parcelas amplias, ejes viales trazados, acceso rodado a cada lote y vistas
            abiertas al valle del río Mataquito.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--hue-bone)]/70">
            La proximidad al lago Vichuquén (30 min), a Curicó (45 min) y a Iloca (1 h) posiciona
            Explora Park como una plataforma equidistante entre campo, cordillera y costa.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-5">
            {[
              { icon: MapPin, k: 'Comuna', v: 'Hualañé' },
              { icon: Ruler, k: 'Parcela tipo', v: '~5.000 m²' },
              { icon: Sprout, k: 'Uso', v: 'Rural / agrícola' },
              { icon: ShieldCheck, k: 'Legal', v: 'DL 3.516' },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k} className="rounded-sm border border-white/8 bg-white/[0.02] p-4">
                <Icon className="h-4 w-4 text-[var(--hue-amber)]" />
                <div className="mt-3 text-[10px] tracking-[0.28em] uppercase text-[var(--hue-bone)]/50">
                  {k}
                </div>
                <div className="mt-1 text-[var(--hue-bone)]">{v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="self-start rounded-sm border border-white/8 bg-white/[0.02] p-6 md:p-8 backdrop-blur-sm"
        >
          <div className="hue-eyebrow mb-4">Datos técnicos</div>
          <div className="divide-y divide-white/5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 py-3">
                <span className="text-[12px] tracking-[0.05em] text-[var(--hue-bone)]/55">{k}</span>
                <span className="text-[13px] text-[var(--hue-bone)] font-medium tabular-nums text-right">
                  {v}
                </span>
              </div>
            ))}
          </div>

          <div className="hue-divider my-6" />

          <div className="grid grid-cols-3 gap-3 text-center">
            <Pill label="Disponibles" value={EXPLORA_PARK_PROJECT.availableLots} tone="emerald" />
            <Pill label="Reservadas" value={EXPLORA_PARK_PROJECT.reservedLots} tone="amber" />
            <Pill label="Vendidas" value={EXPLORA_PARK_PROJECT.soldLots} tone="slate" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Pill({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'slate' }) {
  const map = {
    emerald: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/5',
    amber: 'border-amber-500/30 text-amber-300 bg-amber-500/5',
    slate: 'border-slate-500/30 text-slate-300 bg-slate-500/5',
  } as const;
  return (
    <div className={`rounded-sm border p-3 ${map[tone]}`}>
      <div className="serif text-2xl font-light">{value}</div>
      <div className="mt-1 text-[9px] tracking-[0.24em] uppercase opacity-80">{label}</div>
    </div>
  );
}
