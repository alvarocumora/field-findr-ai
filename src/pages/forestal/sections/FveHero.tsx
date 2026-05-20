const HERO_IMG =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2400&q=80';
  // rural landscape — golden hills + oaks, evokes secano costero

export default function FveHero() {
  return (
    <section id="top" className="fve-no-print relative min-h-screen flex flex-col">
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt="Paisaje rural del secano costero, Región del Maule"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, hsla(137,40%,12%,0.55) 0%, hsla(137,40%,12%,0.35) 45%, hsla(137,40%,12%,0.75) 100%)',
          }}
        />
      </div>

      <div className="relative flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 w-full">
          <div className="max-w-3xl text-white">
            <p className="text-xs md:text-sm uppercase tracking-[0.32em] text-white/80 mb-6">
              Parcelación rural · Región del Maule · Chile
            </p>
            <h1 className="font-serif-fve text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              Forestal<br />Valle Escondido
            </h1>
            <p className="mt-8 text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed">
              Parcelas desde 5.000&nbsp;m² en el secano costero de Hualañé, entre la Cordillera de la
              Costa y el Pacífico. Subdivisión bajo DL 3.516 con escrituras y roles SII individuales.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#plano"
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm uppercase tracking-[0.18em] font-medium transition-all hover:translate-y-[-1px]"
                style={{ background: 'hsl(var(--fve-gold))', color: '#1A1A1A' }}
              >
                Ver Plano Maestro
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center px-7 py-3.5 text-sm uppercase tracking-[0.18em] font-medium border border-white/60 text-white hover:bg-white hover:text-[hsl(var(--fve-forest))] transition-all"
              >
                Solicitar Brochure
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="relative" style={{ background: 'hsl(var(--fve-sand))' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8 text-center md:text-left">
          {[
            'Subdivisión DL 3.516',
            'Escrituras individuales inscribibles CBR',
            'Roles SII independientes por parcela',
          ].map((t) => (
            <div
              key={t}
              className="text-xs md:text-sm uppercase tracking-[0.14em] font-medium text-[hsl(var(--fve-forest-deep))]"
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
