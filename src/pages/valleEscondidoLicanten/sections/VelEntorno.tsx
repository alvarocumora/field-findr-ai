import { motion } from 'framer-motion';
import { Crosshair, Waves, Trees, Building2, Home, Landmark } from 'lucide-react';
import { VEL_POIS, type VelPoi } from '../data/poi';
import { useVelState } from '../state/VelContext';

const ICON: Record<VelPoi['kind'], typeof Waves> = {
  pueblo: Home,
  lago: Trees,
  playa: Waves,
  ciudad: Building2,
  servicio: Landmark,
};

export default function VelEntorno() {
  const { requestPoi } = useVelState();

  const focus = (key: string) => {
    requestPoi(key);
    document.getElementById('masterplan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="entorno" className="relative scroll-mt-16 px-6 py-24 md:px-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="hue-eyebrow mb-3">Entorno</div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
              Qué hay <span className="italic text-[var(--hue-bone)]/55">alrededor del loteo.</span>
            </h2>
          </div>
          <p className="max-w-md text-[13px] text-[var(--hue-bone)]/55">
            Distancias y tiempos aproximados por camino. Toca cualquier punto y el plano se centra
            en él.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VEL_POIS.map((poi) => {
            const Icon = ICON[poi.kind];
            return (
              <button
                key={poi.key}
                type="button"
                onClick={() => focus(poi.key)}
                className="group flex items-start gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-5 text-left transition hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.05]"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hue-amber)]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] text-[var(--hue-bone)]">{poi.name}</span>
                    <span className="shrink-0 tabular-nums text-[11px] text-[var(--hue-bone)]/60">
                      {poi.distanceKm} km · {poi.driveMin} min
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--hue-bone)]/55">
                    {poi.note}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-[var(--hue-bone)]/40 transition group-hover:text-[var(--hue-amber)]">
                    <Crosshair className="h-3 w-3" /> Ver en el plano
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
