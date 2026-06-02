import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PLAYA_ALVARO_PROJECT } from '../data/project';

const HERO_IMG =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80';

export default function PaHero() {
  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
      <motion.div
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/90" />
      <div className="hue-fog" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between px-6 py-12 md:px-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <div className="hue-eyebrow">OFERTA TERRENOS · presents</div>
          <div className="hue-pill hidden md:inline-flex">Subdivisión costera · Los Lagos</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="text-[clamp(3.5rem,11vw,9rem)] leading-[0.92] tracking-tight text-[var(--hue-bone)]">
            Playa Álvaro
          </h1>
          <div className="hue-divider my-6 max-w-md" />
          <p className="serif text-[clamp(1.4rem,3.2vw,2.2rem)] italic text-[var(--hue-bone)]/85 font-light">
            87 lotes frente al Pacífico
          </p>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--hue-bone)]/70">
            400 hectáreas costeras subdivididas según DL 3.516 — desde parcelas de media hectárea
            hasta macrolotes de 25 ha, con frente de mar, miradores y áreas comunes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="flex items-end justify-between"
        >
          <div className="flex flex-col gap-2">
            <div className="hue-eyebrow">Scroll para descubrir</div>
            <ChevronDown className="h-5 w-5 text-[var(--hue-amber)] animate-bounce" />
          </div>
          <div className="hidden md:flex gap-8 text-right">
            <Stat label="Hectáreas" value={`${Math.round(PLAYA_ALVARO_PROJECT.totalAreaHa)}`} />
            <Stat label="Lotes" value={`${PLAYA_ALVARO_PROJECT.totalLots}`} />
            <Stat label="Desde" value="0,5 ha" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="serif text-3xl text-[var(--hue-bone)]">{value}</div>
      <div className="hue-eyebrow mt-1">{label}</div>
    </div>
  );
}
