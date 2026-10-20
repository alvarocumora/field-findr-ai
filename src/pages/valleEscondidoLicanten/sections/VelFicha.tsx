import { motion } from 'framer-motion';
import { Ruler, ShieldCheck, Sprout, MapPin } from 'lucide-react';
import { VEL_PROJECT } from '../data/project';

const fmtClp = (n: number) => `$${n.toLocaleString('es-CL')}`;

export default function VelFicha() {
  const rows: Array<[string, string]> = [
    ['Ubicación', `${VEL_PROJECT.city}, ${VEL_PROJECT.region}`],
    ['Superficie total', `${VEL_PROJECT.totalAreaHa} ha`],
    ['Cantidad de parcelas', String(VEL_PROJECT.totalLots)],
    ['Superficie promedio', `${VEL_PROJECT.avgAreaM2.toLocaleString('es-CL')} m²`],
    ['Rango comercial referencial', `${fmtClp(VEL_PROJECT.priceFromClp)} – ${fmtClp(VEL_PROJECT.priceToClp)} CLP · consultar valor vigente`],
    ['Régimen', 'Subdivisión rural DL 3.516'],
    ['Inscripción', VEL_PROJECT.registro],
    [
      'Coordenadas',
      `${VEL_PROJECT.center.lat.toFixed(4)}, ${VEL_PROJECT.center.lng.toFixed(4)}`,
    ],
  ];

  const pillars = [
    { icon: Ruler, title: 'Parcelas amplias', text: 'De 0,50 a 2,38 hectáreas, con servidumbre de tránsito incluida en el plano.' },
    { icon: Sprout, title: 'Valle agrícola', text: 'Suelos de lomaje suave en la cuenca del Mataquito, entre Licantén y la costa.' },
    { icon: ShieldCheck, title: 'Subdivisión inscrita', text: 'Plano N° 192 (2023) inscrito en el Conservador de Bienes Raíces de Licantén.' },
    { icon: MapPin, title: 'Conectado a Licantén', text: 'Acceso asfaltado, cercanía al centro de Licantén y conexión por la ruta principal hacia Lago Vichuquén.' },
  ];

  return (
    <section className="relative px-6 py-24 md:px-16">
      <div className="mx-auto grid max-w-6xl gap-16 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
        >
          <div className="hue-eyebrow mb-4">Ficha del proyecto</div>
          <h2 className="serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">
            Naturaleza y conectividad{' '}
            <span className="italic text-[var(--hue-bone)]/55">a minutos de Licantén.</span>
          </h2>
          <div className="hue-divider my-8 max-w-xs" />
          <p className="text-[15px] leading-relaxed text-[var(--hue-bone)]/70">
            Valle Escondido Licantén reúne {VEL_PROJECT.totalLots} parcelas sobre{' '}
            {VEL_PROJECT.totalAreaHa} hectáreas a pocos minutos del centro de Licantén. El proyecto
            cuenta con acceso por carretera asfaltada y se emplaza sobre la ruta principal hacia
            Lago Vichuquén, combinando conectividad cotidiana con un entorno rural de mayor escala.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--hue-bone)]/70">
            La subdivisión está inscrita en el Conservador de Bienes Raíces de Licantén y cada
            parcela cuenta con antecedentes de superficie del plano; precios, documentación y disponibilidad deben confirmarse antes de reservar.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-sm border border-white/10 bg-white/[0.02] p-4">
                <p.icon className="h-4 w-4 text-[var(--hue-amber)]" />
                <div className="mt-3 text-[13px] text-[var(--hue-bone)]">{p.title}</div>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--hue-bone)]/55">{p.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="rounded-sm border border-white/10 bg-white/[0.02] p-6 md:p-8"
        >
          <div className="hue-eyebrow mb-5">Datos técnicos</div>
          <dl className="divide-y divide-white/5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-6 py-3">
                <dt className="text-[12px] uppercase tracking-[0.14em] text-[var(--hue-bone)]/45">
                  {k}
                </dt>
                <dd className="text-right text-[13px] text-[var(--hue-bone)]">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
