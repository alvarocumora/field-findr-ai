import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function HueHero() {
  return (
    <section className="relative h-screen min-h-[700px] w-full overflow-hidden">
      {/* Layered cinematic background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=2400&q=90')",
        }}
      />
      {/* Atmospheric layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/90" />
      <div className="hue-fog" />
      <div className="hue-rain opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-6 py-12 md:px-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <div className="hue-eyebrow">Patagonia Reserve · presents</div>
          <div className="hue-pill hidden md:inline-flex">Reserva Privada · Río Negro · Los Lagos</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="text-[clamp(3.5rem,11vw,9rem)] leading-[0.92] tracking-tight text-[var(--hue-bone)]">
            Huellelhue
          </h1>
          <div className="hue-divider my-6 max-w-md" />
          <p className="serif text-[clamp(1.4rem,3.2vw,2.2rem)] italic text-[var(--hue-bone)]/85 font-light">
            Reserva Bosque & Mar
          </p>
          <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-[var(--hue-bone)]/70">
            1.820 hectáreas de selva valdiviana costera con 1,7 km de frente Pacífico.
            Una de las últimas reservas privadas de bosque húmedo templado del planeta.
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
            <Stat label="Hectáreas" value="1.820" />
            <Stat label="Frente Pacífico" value="1,7 km" />
            <Stat label="Conservación" value="65%" />
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
