import { FileCheck2, Route, Zap, Droplets } from 'lucide-react';
import { SUPERFICIE_TOTAL_HA, LOTES } from '../data/lotes';

const DIFERENCIADORES = [
  {
    icon: FileCheck2,
    title: 'Roles SII individuales',
    desc: 'Cada parcela cuenta con rol de avalúo fiscal independiente, habilitando hipoteca y venta autónoma.',
  },
  {
    icon: Route,
    title: 'Servidumbre de tránsito inscrita',
    desc: 'Acceso garantizado mediante servidumbre legal inscrita a perpetuidad en el CBR de Hualañé.',
  },
  {
    icon: Zap,
    title: 'Factibilidad eléctrica certificada',
    desc: 'Empalme trifásico CGE proyectado al deslinde de cada parcela, con carta de factibilidad vigente.',
  },
  {
    icon: Droplets,
    title: 'Derechos de agua DGA + pozo',
    desc: 'Pozo profundo comunitario con derechos de aprovechamiento de aguas subterráneas inscritos en DGA.',
  },
];

export default function FveProyecto() {
  return (
    <section id="proyecto" className="fve-section py-24 md:py-32" style={{ background: 'hsl(var(--fve-offwhite))' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-12 gap-10 mb-20">
          <div className="md:col-span-4">
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
              01 · El Proyecto
            </p>
            <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
              Un valle escondido entre la cordillera y el mar.
            </h2>
          </div>
          <div className="md:col-span-7 md:col-start-6 text-[hsl(var(--fve-charcoal))]/80 text-base md:text-lg leading-relaxed">
            <p>
              Forestal Valle Escondido es una parcelación rural desarrollada bajo el Decreto Ley
              N° 3.516 en la comuna de Hualañé, Región del Maule, sobre suelos de la Cordillera
              de la Costa entre los valles de Curepto y Vichuquén. El predio se inscribe en una
              vocación de suelo mixta —forestal nativo de roble y litre, frutícola de secano y
              vitivinícola del valle de Curicó— particularmente apta también para vivienda
              de descanso y proyectos de turismo rural.
            </p>
            <p className="mt-5">
              La conectividad se resuelve por la Ruta J-60 desde Curicó (1 hora), conectada a la
              Ruta 5 Sur a 2 h 45 de Santiago y a 1 h 15 de las playas de Iloca. El proyecto se
              entrega con urbanización primaria completa, servidumbre de tránsito inscrita, derechos
              de agua DGA y empalme eléctrico CGE en cada parcela.
            </p>
          </div>
        </div>

        {/* Big numbers */}
        <div className="grid md:grid-cols-3 gap-px bg-black/10 border border-black/10 mb-20">
          {[
            { label: 'Ubicación', value: 'Hualañé', sub: 'Región del Maule' },
            { label: 'Superficie total', value: `${SUPERFICIE_TOTAL_HA} ha`, sub: 'predio matriz' },
            { label: 'N° de parcelas', value: `${LOTES.length}`, sub: 'desde 5.000 m²' },
          ].map((m) => (
            <div key={m.label} className="bg-[hsl(var(--fve-offwhite))] p-8 md:p-10">
              <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fve-charcoal))]/60 mb-4">
                {m.label}
              </p>
              <p className="font-serif-fve text-5xl md:text-6xl text-[hsl(var(--fve-forest))]">
                {m.value}
              </p>
              <p className="mt-2 text-sm text-[hsl(var(--fve-charcoal))]/60">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Diferenciadores */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {DIFERENCIADORES.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.title}
                className="border border-[hsl(var(--fve-charcoal))]/10 p-7 bg-white/40 hover:bg-white transition-colors"
              >
                <Icon className="w-7 h-7 mb-5" style={{ color: 'hsl(var(--fve-forest))' }} />
                <h3 className="font-serif-fve text-xl mb-2 text-[hsl(var(--fve-forest-deep))]">
                  {d.title}
                </h3>
                <p className="text-sm text-[hsl(var(--fve-charcoal))]/75 leading-relaxed">
                  {d.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
