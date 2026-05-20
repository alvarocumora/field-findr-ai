export default function FveDesarrollador() {
  return (
    <section
      id="desarrollador"
      className="fve-section py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-sand-soft))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
          07 · El Desarrollador
        </p>
        <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight max-w-3xl mb-12">
          Forestal Valle Escondido SpA.
        </h2>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 bg-white p-8 md:p-10 border border-black/5">
            <div className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fve-charcoal))]/55 mb-2">
              Sociedad titular
            </div>
            <h3 className="font-serif-fve text-3xl text-[hsl(var(--fve-forest-deep))]">
              Forestal Valle Escondido SpA
            </h3>
            <p className="text-sm font-mono text-[hsl(var(--fve-charcoal))]/65 mt-1">
              RUT 77.123.456-K
            </p>
            <p className="mt-5 text-[hsl(var(--fve-charcoal))]/80 leading-relaxed">
              Sociedad por acciones constituida en Chile, propietaria del predio matriz y titular
              de la subdivisión bajo DL 3.516. Su único objeto social es el desarrollo y
              comercialización del proyecto Forestal Valle Escondido.
            </p>

            <div className="mt-7 pt-6 border-t border-black/10">
              <div className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fve-charcoal))]/55 mb-2">
                Matriz
              </div>
              <h4 className="font-serif-fve text-2xl text-[hsl(var(--fve-forest-deep))]">
                Inversiones Bioenergy SpA
              </h4>
              <p className="text-sm font-mono text-[hsl(var(--fve-charcoal))]/65 mt-1">
                RUT 76.987.654-3
              </p>
              <p className="mt-3 text-[hsl(var(--fve-charcoal))]/80 leading-relaxed text-sm">
                Holding chileno de inversiones con foco en deep tech y desarrollo territorial.
                Forestal Valle Escondido SpA es la vertical de proyectos rurales del grupo.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-px bg-black/10 border border-black/10">
              {[
                { label: 'Hectáreas en cartera', value: '420' },
                { label: 'Proyectos activos',     value: '3' },
                { label: 'Años en el rubro',      value: '11' },
              ].map((m) => (
                <div key={m.label} className="bg-white p-6">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--fve-charcoal))]/55 mb-3">
                    {m.label}
                  </p>
                  <p className="font-serif-fve text-3xl text-[hsl(var(--fve-forest))]">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-7 border border-black/5">
              <h4 className="font-serif-fve text-xl mb-3">Equipo</h4>
              <p className="text-sm text-[hsl(var(--fve-charcoal))]/80 leading-relaxed">
                Equipo gestor compuesto por profesionales con trayectoria en desarrollo
                inmobiliario rural, ingeniería forestal, derecho registral y estructuración
                financiera. Asesoría legal externa por estudio jurídico especializado en derecho
                inmobiliario y de aguas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
