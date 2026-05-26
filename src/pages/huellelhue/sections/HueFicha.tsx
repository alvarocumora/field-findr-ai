import { motion } from 'framer-motion';
import { MapPin, Compass, Mountain, Waves, TreePine, Ruler } from 'lucide-react';
import sandspit from '@/assets/huellelhue/sandspit-aerial.jpeg';
import turquoise from '@/assets/huellelhue/turquoise-water.jpeg';
import estuary from '@/assets/huellelhue/estuary-clouds.jpeg';
import beachBay from '@/assets/huellelhue/beach-bay.jpeg';
import forestWindow from '@/assets/huellelhue/forest-window.jpeg';
import riverMouth from '@/assets/huellelhue/river-mouth.jpeg';

const GALLERY = [
  { src: sandspit, caption: 'Banco de arena · desembocadura del Río Negro', span: 'lg:col-span-2 lg:row-span-2' },
  { src: turquoise, caption: 'Aguas turquesas · plataforma costera' },
  { src: estuary, caption: 'Estuario abierto al Pacífico' },
  { src: beachBay, caption: 'Playa salvaje · 1,7 km de frente' },
  { src: forestWindow, caption: 'Bosque valdiviano sobre la playa' },
  { src: riverMouth, caption: 'Boca del río · vista panorámica', span: 'lg:col-span-2' },
];

const FICHA = [
  { icon: Ruler, label: 'Superficie total', value: '420 ha' },
  { icon: Waves, label: 'Frente Pacífico', value: '1,7 km' },
  { icon: TreePine, label: 'Conservación', value: '65% · 250 ha núcleo' },
  { icon: Mountain, label: 'Topografía', value: '0 — 480 m s.n.m.' },
  { icon: Compass, label: 'Orientación', value: 'Poniente · W/SW' },
  { icon: MapPin, label: 'Ubicación', value: 'Río Negro · Los Lagos' },
];

const COORDS = [
  { l: 'Latitud', v: '40°42′57″ S' },
  { l: 'Longitud', v: '73°48′11″ W' },
  { l: 'UTM 18S', v: '601.100 E · 5.492.100 N' },
  { l: 'Datum', v: 'WGS84' },
];

export default function HueFicha() {
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
          <div className="hue-eyebrow mb-3">Ficha técnica · El territorio</div>
          <h2 className="serif text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]">
            Donde el bosque valdiviano
            <span className="italic text-[var(--hue-bone)]/60"> toca el Pacífico.</span>
          </h2>
          <p className="mt-6 text-sm text-[var(--hue-bone)]/55 max-w-xl leading-relaxed">
            Coordenadas reales, imágenes del lugar y datos del masterplan. La reserva existe —
            estas son sus dimensiones físicas.
          </p>
        </motion.div>

        {/* Image mosaic */}
        <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-2 mb-16">
          {GALLERY.map((img, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.9, delay: i * 0.08 }}
              className={`group relative overflow-hidden ${img.span ?? ''}`}
            >
              <img
                src={img.src}
                alt={img.caption}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-transparent" />
              <figcaption className="absolute bottom-3 left-4 right-4 text-[11px] tracking-wide text-[var(--hue-bone)]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {img.caption}
              </figcaption>
              <div className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.25em] text-[var(--hue-amber)]/80">
                · 0{i + 1}
              </div>
            </motion.figure>
          ))}
        </div>

        {/* Ficha grid + Coordinates */}
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

        {/* Coordinates strip */}
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10">
          {COORDS.map((c) => (
            <div key={c.l} className="bg-[#050908] px-5 py-4">
              <div className="hue-eyebrow mb-1.5 text-[var(--hue-amber)]/80">{c.l}</div>
              <div className="font-mono text-xs md:text-sm text-[var(--hue-bone)]/85">{c.v}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--hue-bone)]/40">
          Plano topográfico Fundo Hueyelhue · Luis San Juan Sepúlveda, 2007 · UTM 18S WGS84
        </p>
      </div>
    </section>
  );
}
