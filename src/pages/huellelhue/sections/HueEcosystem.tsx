import { motion } from 'framer-motion';

const SPECIES = [
  { name: 'Alerce', latin: 'Fitzroya cupressoides', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80' },
  { name: 'Coigüe', latin: 'Nothofagus dombeyi', img: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80' },
  { name: 'Mañío', latin: 'Podocarpus nubigenus', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80' },
  { name: 'Tepú', latin: 'Tepualia stipularis', img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80' },
];

export default function HueEcosystem() {
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
            <div className="hue-eyebrow mb-4">Selva Valdiviana Costera</div>
            <h2 className="serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95]">
              Un bosque que <br />
              <span className="italic text-[var(--hue-bone)]/60">respira lluvia.</span>
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[var(--hue-bone)]/65">
            La selva valdiviana es uno de los cinco bosques templados húmedos del planeta. Aquí coexisten
            alerces milenarios, coigües centenarios, helechos gigantes, ríos transparentes y la niebla
            permanente del Pacífico que mantiene el ecosistema vivo todo el año.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {SPECIES.map((s, i) => (
            <motion.div
              key={s.name}
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
                <div className="serif text-xl text-[var(--hue-bone)]">{s.name}</div>
                <div className="text-[10px] italic text-[var(--hue-bone)]/50 mt-0.5">{s.latin}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
