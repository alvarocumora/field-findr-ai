import { motion } from 'framer-motion';
import { MapPin, Compass, Mountain, Waves, Ruler, Hash } from 'lucide-react';
import { PLAYA_ALVARO_PROJECT } from '../data/project';

const FICHA = [
  { icon: Ruler, label: 'Superficie total', value: `${PLAYA_ALVARO_PROJECT.totalAreaHa.toFixed(0)} ha` },
  { icon: Hash, label: 'Lotes resultantes', value: `${PLAYA_ALVARO_PROJECT.totalLots} unidades` },
  { icon: Waves, label: 'Frente al Pacífico', value: 'Sí · costa abierta' },
  { icon: Mountain, label: 'Topografía', value: '0 — 200 m s.n.m.' },
  { icon: Compass, label: 'Orientación', value: 'Poniente · W' },
  { icon: MapPin, label: 'Ubicación', value: 'Región de Los Lagos · Chile' },
];

const COORDS = [
  { l: 'Latitud centro', v: `${PLAYA_ALVARO_PROJECT.center.lat.toFixed(5)}° S` },
  { l: 'Longitud centro', v: `${Math.abs(PLAYA_ALVARO_PROJECT.center.lng).toFixed(5)}° W` },
  { l: 'Bounding box', v: `${(PLAYA_ALVARO_PROJECT.bounds.maxLng - PLAYA_ALVARO_PROJECT.bounds.minLng).toFixed(4)}° × ${(PLAYA_ALVARO_PROJECT.bounds.maxLat - PLAYA_ALVARO_PROJECT.bounds.minLat).toFixed(4)}°` },
  { l: 'Datum', v: 'WGS84' },
];

export default function PaFicha() {
  return (
    <section id="ficha" className="relative px-4 py-24 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-12 max-w-3xl px-2"
        >
          <div className="hue-eyebrow mb-3">Ficha técnica · El predio</div>
          <h2 className="serif text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]">
            400 hectáreas costeras
            <span className="italic text-[var(--hue-bone)]/60"> ya subdivididas.</span>
          </h2>
          <p className="mt-6 text-sm text-[var(--hue-bone)]/55 max-w-xl leading-relaxed">
            {PLAYA_ALVARO_PROJECT.description}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-px bg-white/10 border border-white/10">
          {FICHA.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="bg-[#050908] p-6 md:p-8 flex items-start gap-4">
                <Icon className="h-5 w-5 text-[var(--hue-amber)] shrink-0 mt-1" strokeWidth={1.2} />
                <div>
                  <div className="hue-eyebrow mb-2">{f.label}</div>
                  <div className="serif text-2xl md:text-3xl text-[var(--hue-bone)] leading-tight">
                    {f.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">
          {COORDS.map((c) => (
            <div key={c.l} className="bg-[#050908] px-5 py-4">
              <div className="hue-eyebrow mb-1.5 text-[var(--hue-amber)]/80">{c.l}</div>
              <div className="font-mono text-xs md:text-sm text-[var(--hue-bone)]/85">{c.v}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--hue-bone)]/40">
          Datos ingresados desde KMZ oficial · 286 placemarks · Reconstrucción con kmzParser
        </p>
      </div>
    </section>
  );
}
