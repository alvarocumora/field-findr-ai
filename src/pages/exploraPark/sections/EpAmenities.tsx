import { motion } from 'framer-motion';
import {
  Route, Zap, Droplet, TreePine, Compass, Wifi, ShieldCheck, Warehouse,
} from 'lucide-react';

const AMENITIES = [
  { icon: Route, title: 'Caminos internos', desc: 'Red vial interna con rodado a cada parcela y acceso pavimentado desde la ruta principal.' },
  { icon: Zap, title: 'Electricidad', desc: 'Factibilidad eléctrica en el frente del predio, con proyecto de tendido en curso.' },
  { icon: Droplet, title: 'Agua', desc: 'Cada parcela cuenta con derecho de aprovechamiento y factibilidad para pozo profundo.' },
  { icon: TreePine, title: 'Áreas verdes', desc: 'Corredores de bosque nativo y quebrada natural preservada como área común.' },
  { icon: Compass, title: 'Miradores', desc: 'Puntos altos con vistas al valle del Mataquito y a la cordillera de la costa.' },
  { icon: Wifi, title: 'Cobertura', desc: 'Señal 4G en todo el proyecto y factibilidad de internet satelital.' },
  { icon: ShieldCheck, title: 'Seguridad', desc: 'Acceso controlado por portón y vigilancia perimetral 24/7.' },
  { icon: Warehouse, title: 'Bodegas', desc: 'Terreno común disponible para bodegas de propietarios y maquinaria agrícola.' },
];

export default function EpAmenities() {
  return (
    <section className="relative px-6 py-24 md:px-16 bg-[#06120a]/40">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-14 max-w-3xl"
        >
          <div className="hue-eyebrow mb-3">Amenidades</div>
          <h2 className="serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
            Infraestructura pensada <span className="italic text-[var(--hue-bone)]/55">para vivir el campo hoy.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[var(--hue-bone)]/65">
            Explora Park combina la escala de un loteo consolidado con la calidad de acceso, servicios
            y áreas comunes de un parque residencial rural.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AMENITIES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="group rounded-sm border border-white/8 bg-white/[0.02] p-5 hover:border-[var(--hue-amber)]/40 hover:bg-white/[0.04] transition"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hue-amber)]/30 bg-[var(--hue-amber)]/10">
                <Icon className="h-4 w-4 text-[var(--hue-amber)]" />
              </div>
              <div className="mt-4 text-[var(--hue-bone)] text-[15px]">{title}</div>
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--hue-bone)]/55">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
