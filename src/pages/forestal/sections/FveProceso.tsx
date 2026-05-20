import { FileSignature, Handshake, ScrollText, Landmark } from 'lucide-react';

const PASOS = [
  { icon: Handshake,     n: '01', titulo: 'Reserva',    desc: 'UF 50 imputables al precio final.' },
  { icon: FileSignature, n: '02', titulo: 'Promesa',    desc: 'Promesa de compraventa con pie 10 %.' },
  { icon: ScrollText,    n: '03', titulo: 'Escritura',  desc: 'Firma de escritura pública contra saldo.' },
  { icon: Landmark,      n: '04', titulo: 'Inscripción', desc: 'Inscripción en CBR Hualañé.' },
];

export default function FveProceso() {
  return (
    <section
      id="proceso"
      className="fve-no-print py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
          08 · Proceso de Compra
        </p>
        <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight max-w-3xl mb-12">
          Cuatro pasos. 60 a 90 días.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-black/10 border border-black/10">
          {PASOS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={p.n} className="bg-[hsl(var(--fve-offwhite))] p-8 relative">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-mono text-[hsl(var(--fve-charcoal))]/45">{p.n}</span>
                  <Icon className="w-5 h-5" style={{ color: 'hsl(var(--fve-gold))' }} />
                </div>
                <h3 className="font-serif-fve text-2xl text-[hsl(var(--fve-forest-deep))] mb-2">
                  {p.titulo}
                </h3>
                <p className="text-sm text-[hsl(var(--fve-charcoal))]/70 leading-relaxed">
                  {p.desc}
                </p>
                {i < PASOS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-px w-px h-8 -translate-y-1/2 bg-[hsl(var(--fve-gold))]" />
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-[hsl(var(--fve-charcoal))]/65 max-w-2xl">
          Aceptamos financiamiento bancario hipotecario tradicional. Las parcelas son
          hipotecables al contar con escritura y rol SII individuales.
        </p>
      </div>
    </section>
  );
}
