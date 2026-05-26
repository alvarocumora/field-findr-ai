import { motion } from 'framer-motion';

const STYLES = [
  { name: 'Japandi Coastal', desc: 'Minimalismo japonés + calidez escandinava. Maderas claras, líneas largas, ventanales bajos.' },
  { name: 'Scandinavian Eco-Luxury', desc: 'Refugio cálido y silencioso. Estructura ligera elevada sobre el suelo, chimeneas centrales.' },
  { name: 'Patagonian Contemporary', desc: 'Lectura de la cordillera de la costa. Volumetría austera, techos de gran pendiente, fuego visible.' },
];

const MATERIALS = ['Charred wood (Shou Sugi Ban)', 'Madera nativa local', 'Piedra volcánica', 'Hormigón visto', 'Acero corten', 'Vidrio anti-reflejo'];

export default function HueArchitecture() {
  return (
    <section className="relative px-6 py-32 md:px-16">
      <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative overflow-hidden rounded-sm"
        >
          <div
            className="aspect-[4/5] bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-8 left-8">
            <div className="hue-eyebrow text-[var(--hue-bone)]/80">Referencia visual</div>
            <p className="serif text-2xl mt-2 text-[var(--hue-bone)]">Desaparecer en el bosque</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="hue-eyebrow mb-4">Guía Arquitectónica</div>
          <h2 className="serif text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.95]">
            La arquitectura <br />
            <span className="italic text-[var(--hue-bone)]/60">no compite con la selva.</span>
          </h2>

          <div className="mt-12 space-y-8">
            {STYLES.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <div className="serif text-xl text-[var(--hue-amber)] mb-2">— {s.name}</div>
                <p className="text-sm leading-relaxed text-[var(--hue-bone)]/65">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="hue-divider my-10" />

          <div>
            <div className="hue-eyebrow mb-4">Paleta de materiales aprobados</div>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((m) => (
                <span key={m} className="hue-pill text-[10px]">{m}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
