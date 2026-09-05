import { motion } from 'framer-motion';
import valle from '@/assets/valle-escondido-licanten/vel-valle.jpg';
import camino from '@/assets/valle-escondido-licanten/vel-camino.jpg';
import lago from '@/assets/valle-escondido-licanten/vel-lago.jpg';
import atardecer from '@/assets/valle-escondido-licanten/vel-atardecer.jpg';

const IMAGES = [
  { src: valle, alt: 'Lomajes verdes del valle en Licantén, Región del Maule' },
  { src: camino, alt: 'Camino de acceso arbolado hacia el loteo' },
  { src: lago, alt: 'Lago Vichuquén rodeado de bosque de pinos' },
  { src: atardecer, alt: 'Atardecer sobre parcelas del valle' },
];

export default function VelGallery() {
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
              El territorio,{' '}
              <span className="italic text-[var(--hue-bone)]/55">antes de la parcela.</span>
            </h2>
          </div>
          <p className="max-w-md text-[13px] text-[var(--hue-bone)]/55">
            Imágenes referenciales del carácter del valle y su entorno. Serán reemplazadas por
            fotografías del terreno y panorámicas 360 cuando estén disponibles.
          </p>
        </motion.div>

        <div className="grid grid-cols-6 gap-3 md:gap-4">
          <figure className="relative col-span-6 aspect-[16/9] overflow-hidden rounded-sm md:col-span-4">
            <img
              src={IMAGES[0].src}
              alt={IMAGES[0].alt}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 hover:scale-105"
            />
            <figcaption className="absolute bottom-2 right-2 rounded-sm bg-black/55 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/70">
              Imagen referencial
            </figcaption>
          </figure>
          {IMAGES.slice(1).map((im) => (
            <figure
              key={im.alt}
              className="relative col-span-3 aspect-square overflow-hidden rounded-sm md:col-span-2"
            >
              <img
                src={im.src}
                alt={im.alt}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 hover:scale-105"
              />
              <figcaption className="absolute bottom-2 right-2 rounded-sm bg-black/55 px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-white/70">
                Imagen referencial
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
