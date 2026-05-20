import { MapPin } from 'lucide-react';

const DISTANCIAS = [
  { lugar: 'Santiago', tiempo: '2 h 45' },
  { lugar: 'Curicó',   tiempo: '1 h 00' },
  { lugar: 'Constitución', tiempo: '1 h 30' },
  { lugar: 'Playa Iloca', tiempo: '1 h 15' },
];

const SERVICIOS = [
  { titulo: 'Almacenes y abarrotes',    desc: 'Hualañé centro · 18 km' },
  { titulo: 'Posta rural',              desc: 'Localidad de Licantén · 22 km' },
  { titulo: 'Colegio rural',            desc: 'Escuela G-440 · 14 km' },
  { titulo: 'Supermercados y servicios', desc: 'Curicó · 58 km' },
];

export default function FveUbicacion() {
  return (
    <section id="ubicacion" className="fve-no-print py-24 md:py-32" style={{ background: 'hsl(var(--fve-offwhite))' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
            03 · Ubicación
          </p>
          <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
            Hualañé, secano costero del Maule.
          </h2>
          <p className="mt-5 text-[hsl(var(--fve-charcoal))]/75 text-lg">
            Coordenadas referenciales: <span className="font-mono">-35.0489, -71.9876</span>.
          </p>
        </div>

        <div className="aspect-[16/9] w-full bg-black/5 mb-10 overflow-hidden border border-black/10">
          <iframe
            title="Ubicación Forestal Valle Escondido"
            src="https://www.google.com/maps?q=-35.0489,-71.9876&z=11&output=embed"
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div>
            <h3 className="font-serif-fve text-2xl mb-5">Distancias clave</h3>
            <div className="flex flex-wrap gap-2.5">
              {DISTANCIAS.map((d) => (
                <span
                  key={d.lugar}
                  className="inline-flex items-center gap-2 border border-[hsl(var(--fve-charcoal))]/15 px-4 py-2 text-sm bg-white"
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: 'hsl(var(--fve-forest))' }} />
                  <span className="font-medium">{d.lugar}</span>
                  <span className="text-[hsl(var(--fve-charcoal))]/60">{d.tiempo}</span>
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-serif-fve text-2xl mb-5">Servicios cercanos</h3>
            <ul className="divide-y divide-black/10 border-y border-black/10">
              {SERVICIOS.map((s) => (
                <li key={s.titulo} className="py-3 flex items-baseline justify-between gap-4">
                  <span className="font-medium text-[hsl(var(--fve-charcoal))]">{s.titulo}</span>
                  <span className="text-sm text-[hsl(var(--fve-charcoal))]/60 text-right">{s.desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
