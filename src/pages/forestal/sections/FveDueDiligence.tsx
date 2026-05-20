import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DUE_DILIGENCE } from '../data/dueDiligence';
import DocRequestModal from './DocRequestModal';

export default function FveDueDiligence() {
  const [open, setOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');

  return (
    <section
      id="legal"
      className="fve-section py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
              06 · Marco Legal y Due Diligence
            </p>
            <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
              Cada afirmación legal con respaldo documental.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 text-[hsl(var(--fve-charcoal))]/75 text-base md:text-lg leading-relaxed">
            <p>
              El proyecto se entrega con la totalidad de los antecedentes legales y técnicos
              constituidos. Cada item del checklist tiene su documento físico de respaldo,
              disponible para revisión bajo NDA por compradores, financiadores y sus asesores
              legales.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-black/10 border-y border-black/10">
          {DUE_DILIGENCE.map((item) => (
            <li key={item.id} className="py-6 grid md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-1">
                <CheckCircle2 className="w-6 h-6" style={{ color: 'hsl(var(--fve-forest))' }} />
              </div>
              <div className="md:col-span-7">
                <h3 className="font-serif-fve text-xl text-[hsl(var(--fve-forest-deep))]">
                  {item.titulo}
                </h3>
                <p className="text-sm text-[hsl(var(--fve-charcoal))]/70 mt-1 leading-relaxed">
                  {item.detalle}
                </p>
                <p className="text-xs text-[hsl(var(--fve-charcoal))]/45 mt-2 font-mono">
                  {item.refDoc}
                </p>
              </div>
              <div className="md:col-span-4 md:text-right fve-no-print">
                <button
                  onClick={() => { setDocTitle(item.titulo); setOpen(true); }}
                  className="text-xs uppercase tracking-[0.18em] border border-[hsl(var(--fve-charcoal))]/30 px-4 py-2.5 hover:bg-[hsl(var(--fve-forest))] hover:text-white hover:border-[hsl(var(--fve-forest))] transition-colors"
                >
                  Solicitar documento
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <DocRequestModal open={open} onOpenChange={setOpen} docTitle={docTitle} />
    </section>
  );
}
