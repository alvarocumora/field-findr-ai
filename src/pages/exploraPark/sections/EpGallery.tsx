import { motion } from 'framer-motion';

const IMAGES = [
  { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80', alt: 'Valle y lomajes de Hualañé al atardecer' },
  { src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', alt: 'Camino rural entre trigales' },
  { src: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80', alt: 'Bosque nativo y quebrada' },
  { src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', alt: 'Campos ondulantes del Maule' },
  { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80', alt: 'Cordillera de la costa' },
];

export default function EpGallery() {
  return (
    <section className="relative px-6 py-24 md:px-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <div className="hue-eyebrow mb-3">Galería</div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
              El territorio, <span className="italic text-[var(--hue-bone)]/55">antes de la parcela.</span>
            </h2>
          </div>
          <p className="max-w-md text-[13px] text-[var(--hue-bone)]/55">
            Imágenes de referencia del entorno del Maule interior — los paisajes que rodean cada lote
            del proyecto.
          </p>
        </motion.div>

        <div className="grid grid-cols-6 gap-3 md:gap-4">
          <div className="col-span-6 md:col-span-4 aspect-[16/9] overflow-hidden rounded-sm">
            <img src={IMAGES[0].src} alt={IMAGES[0].alt} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
          </div>
          {IMAGES.slice(1).map((im) => (
            <div key={im.src} className="col-span-3 md:col-span-2 aspect-square overflow-hidden rounded-sm">
              <img src={im.src} alt={im.alt} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-105" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
