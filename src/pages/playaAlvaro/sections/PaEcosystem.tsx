import { motion } from 'framer-motion';

const FEATURES = [
  {
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    title: 'Frente de Mar',
    sub: 'Costa abierta al Pacífico',
  },
  {
    img: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1200&q=80',
    title: 'Miradores Naturales',
    sub: 'Vistas panorámicas elevadas',
  },
  {
    img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80',
    title: 'Áreas Comunes',
    sub: 'Senderos y conservación',
  },
  {
    img: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1200&q=80',
    title: 'Acceso Vehicular',
    sub: 'Trazado interno consolidado',
  },
];

export default function PaEcosystem() {
  return (
    <section className="relative overflow-hidden bg-[var(--hue-forest)]/30 px-6 py-32 md:px-16">
      <div className="hue-fog opacity-40" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-16 grid gap-8 md:grid-cols-2 md:items-end"
        >
          <div>
            <div className="hue-eyebrow mb-4">Ecosistema costero</div>
            <h2 className="serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95]">
              Donde el bosque <br />
              <span className="italic text-[var(--hue-bone)]/60">se rinde al mar.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[var(--hue-bone)]/65">
            Una de las pocas subdivisiones costeras DL 3.516 con frente real al Pacífico,
            con cabidas que van desde la media hectárea hasta macrolotes de 25 hectáreas,
            ideales para residencia, eco-lodge y conservación.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {FEATURES.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-sm"
            >
              <div
                className="aspect-[3/4] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: `url(${s.img})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="serif text-xl text-[var(--hue-bone)]">{s.title}</div>
                <div className="text-[10px] italic text-[var(--hue-bone)]/50 mt-0.5">{s.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
