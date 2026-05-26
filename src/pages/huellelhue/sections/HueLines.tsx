import { motion } from 'framer-motion';

const LINES = [
  {
    n: '01',
    title: 'Ocean Front Reserve',
    subtitle: 'Primera línea — Pacífico directo',
    desc: 'Lotes alargados de ~1 ha siguiendo la curvatura natural de la costa. Frente angosto, fondo profundo. Arquitectura oculta en el bosque, máxima exposición al océano.',
    color: 'var(--hue-line-1)',
    qty: '32 lotes',
    range: '~1 ha promedio',
  },
  {
    n: '02',
    title: 'Forest Ocean Residences',
    subtitle: 'Segunda línea — Inmersión bosque',
    desc: 'Detrás de la primera línea. Vista parcial elevada al océano sobre el dosel valdiviano. Arquitectura eco elevada, lifestyle wellness.',
    color: 'var(--hue-line-2)',
    qty: '56 lotes',
    range: '0,5 a 1 ha',
  },
  {
    n: '03',
    title: 'Bosque Vivo',
    subtitle: 'Tercera línea — Selva profunda',
    desc: 'Refugios escondidos en el bosque regenerativo. Bajo impacto visual, cabañas hidden, vida regenerativa total.',
    color: 'var(--hue-line-3)',
    qty: '90 lotes',
    range: '0,5 a 1 ha',
  },
];

export default function HueLines() {
  return (
    <section className="relative px-6 py-32 md:px-16">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1 }}
          className="mb-20 max-w-3xl"
        >
          <div className="hue-eyebrow mb-4">Distribución Lote B · 178 lotes residenciales</div>
          <h2 className="serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95]">
            Tres líneas. <br />
            <span className="italic text-[var(--hue-bone)]/60">Una sola filosofía.</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--hue-bone)]/65">
            Cada lote nace de la topografía. La densidad cae a medida que se profundiza en el bosque.
            El 65% del Lote B permanece visualmente intacto.
          </p>
        </motion.div>

        <div className="grid gap-12 md:grid-cols-3">
          {LINES.map((l, i) => (
            <motion.div
              key={l.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.9, delay: i * 0.15 }}
              className="group relative"
            >
              <div
                className="absolute -left-2 top-0 h-full w-px transition-all duration-500 group-hover:w-1"
                style={{ background: l.color, boxShadow: `0 0 20px ${l.color}` }}
              />
              <div className="pl-6">
                <div className="serif text-6xl text-[var(--hue-bone)]/15">{l.n}</div>
                <div className="hue-eyebrow mt-2" style={{ color: l.color }}>
                  {l.subtitle}
                </div>
                <h3 className="serif mt-3 text-3xl text-[var(--hue-bone)]">{l.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[var(--hue-bone)]/65">{l.desc}</p>
                <div className="hue-divider my-6" />
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--hue-bone)]/50 uppercase tracking-wider">{l.qty}</span>
                  <span className="text-[var(--hue-bone)]/80">{l.range}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
