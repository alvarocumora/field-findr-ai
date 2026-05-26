import { motion } from 'framer-motion';
import { Trees, Bird, Mountain, Droplets, Footprints, Eye } from 'lucide-react';

const PILLARS = [
  { icon: Trees, label: 'Corredor biodiverso', value: 'Continuo Pacífico–cordillera costa' },
  { icon: Bird, label: 'Santuario fauna', value: 'Pudú · huillín · carpintero negro' },
  { icon: Droplets, label: 'Sistemas hídricos', value: 'Río Cholguaco · Hueyelhue' },
  { icon: Mountain, label: 'Reserva núcleo', value: '250 ha intocadas' },
  { icon: Footprints, label: 'Senderos curados', value: '12 km bajo impacto' },
  { icon: Eye, label: 'Puntos observación', value: '4 miradores ecológicos' },
];

export default function HueConservation() {
  return (
    <section className="relative overflow-hidden px-6 py-32 md:px-16">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2400&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050908] via-[#050908]/85 to-[#050908]" />
      <div className="hue-fog opacity-60" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-20 text-center"
        >
          <div className="hue-eyebrow mb-4">Reserva Núcleo Huellelhue</div>
          <h2 className="serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95]">
            65% del Lote B <br />
            <span className="italic text-[var(--hue-bone)]/60">permanece intocado.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-[var(--hue-bone)]/65">
            Una reserva privada activa con corredores biodiversos, restauración asistida y monitoreo
            ecológico permanente. No es un argumento de venta — es la columna del proyecto.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08 }}
              className="group border-l border-[var(--hue-amber)]/20 pl-6 transition-colors hover:border-[var(--hue-amber)]"
            >
              <p.icon className="mb-4 h-6 w-6 text-[var(--hue-amber)]" strokeWidth={1.2} />
              <div className="hue-eyebrow mb-2">{p.label}</div>
              <div className="serif text-xl text-[var(--hue-bone)]">{p.value}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
