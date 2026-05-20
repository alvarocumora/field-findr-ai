export default function FveProyecciones() {
  const metricas = [
    { label: 'Velocidad de venta estimada', value: '2', sub: 'parcelas / mes' },
    { label: 'Ticket promedio',              value: 'UF 1.950', sub: 'por parcela' },
    { label: 'Absorción mensual',            value: '4,2 %', sub: 'sobre stock disponible' },
  ];

  return (
    <section
      id="proyecciones"
      className="fve-no-print py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
            05 · Proyecciones Comerciales
          </p>
          <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
            Métricas comerciales de referencia.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-black/10 border border-black/10">
          {metricas.map((m) => (
            <div key={m.label} className="bg-[hsl(var(--fve-offwhite))] p-10">
              <p className="text-xs uppercase tracking-[0.22em] text-[hsl(var(--fve-charcoal))]/60 mb-5">
                {m.label}
              </p>
              <p className="font-serif-fve text-5xl md:text-6xl text-[hsl(var(--fve-forest))]">
                {m.value}
              </p>
              <p className="mt-2 text-sm text-[hsl(var(--fve-charcoal))]/60">{m.sub}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-[hsl(var(--fve-charcoal))]/55 max-w-3xl">
          Proyecciones referenciales basadas en velocidad histórica de parcelaciones comparables del
          secano costero del Maule. No constituyen garantía. Modelo financiero completo disponible
          para inversores acreditados bajo NDA.
        </p>
      </div>
    </section>
  );
}
