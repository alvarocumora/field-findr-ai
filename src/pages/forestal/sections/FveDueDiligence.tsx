import { useState, useMemo } from 'react';
import { CheckCircle2, Download, FileText, Lock } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { LUC_DD_ITEMS, LUC_CATEGORIES, type LucDDItem } from '../data/dueDiligenceLUC';
import { DUE_DILIGENCE } from '../data/dueDiligence';
import DocRequestModal from './DocRequestModal';

function NivelBadge({ nivel }: { nivel: LucDDItem['nivel'] }) {
  if (nivel === 'seccion') return null;
  const isOne = nivel === '1';
  return (
    <span
      className="text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 font-medium whitespace-nowrap"
      style={{
        background: isOne ? 'hsl(var(--fve-forest))' : 'transparent',
        color: isOne ? 'white' : 'hsl(var(--fve-forest-deep))',
        border: isOne ? 'none' : '1px solid hsl(var(--fve-gold) / 0.5)',
      }}
    >
      {isOne ? 'Nivel 1' : 'Nivel 2'}
    </span>
  );
}

export default function FveDueDiligence() {
  const [open, setOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<string, LucDDItem[]>();
    LUC_CATEGORIES.forEach((c) => map.set(c, []));
    LUC_DD_ITEMS.forEach((it) => {
      if (it.nivel === 'seccion') return; // skip section markers
      map.get(it.categoria)?.push(it);
    });
    return map;
  }, []);

  const totalDocs = LUC_DD_ITEMS.filter((i) => i.nivel !== 'seccion').length;

  return (
    <section
      id="legal"
      className="fve-section py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-offwhite))' }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
              06 · Due Diligence Package · LUC Financing
            </p>
            <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight">
              Data room estructurado para evaluación bancaria internacional.
            </h2>
          </div>
          <div className="md:col-span-6 md:col-start-7 text-[hsl(var(--fve-charcoal))]/75 text-base md:text-lg leading-relaxed">
            <p>
              Checklist documental de <strong>{totalDocs} antecedentes</strong> distribuidos en{' '}
              <strong>{LUC_CATEGORIES.length} bloques</strong> de evaluación (corporativa, financiera,
              uso de fondos, viabilidad, modelo, tracción comercial, estructura de financiación y
              holding). Cada ficha es descargable como PDF; los documentos originales se entregan
              bajo NDA a través de Investor Relations.
            </p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex flex-wrap gap-2 mb-10 fve-no-print">
          {LUC_CATEGORIES.map((cat) => {
            const count = grouped.get(cat)?.length || 0;
            return (
              <span
                key={cat}
                className="text-[11px] uppercase tracking-[0.14em] px-3 py-1.5 border"
                style={{
                  borderColor: 'hsl(var(--fve-charcoal) / 0.18)',
                  color: 'hsl(var(--fve-charcoal) / 0.78)',
                  background: 'white',
                }}
              >
                {cat} · <strong>{count}</strong>
              </span>
            );
          })}
        </div>

        {/* Accordion by category */}
        <Accordion type="multiple" defaultValue={[LUC_CATEGORIES[0]]} className="space-y-3">
          {LUC_CATEGORIES.map((cat) => {
            const items = grouped.get(cat) || [];
            if (items.length === 0) return null;
            return (
              <AccordionItem
                key={cat}
                value={cat}
                className="border border-black/10 bg-white px-5"
              >
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-baseline gap-4 text-left">
                    <span className="font-serif-fve text-lg md:text-xl text-[hsl(var(--fve-forest-deep))]">
                      {cat}
                    </span>
                    <span className="text-xs text-[hsl(var(--fve-charcoal))]/50">
                      {items.length} documento{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="divide-y divide-black/8 -mx-2">
                    {items.map((item) => (
                      <li key={item.numero} className="py-5 px-2 grid md:grid-cols-12 gap-4 items-start">
                        <div className="md:col-span-1 flex md:block items-center gap-2">
                          <span className="font-mono text-xs text-[hsl(var(--fve-charcoal))]/45">
                            {String(item.numero).padStart(2, '0')}
                          </span>
                        </div>
                        <div className="md:col-span-7">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-serif-fve text-base md:text-lg text-[hsl(var(--fve-forest-deep))]">
                              {item.titulo}
                            </h3>
                            <NivelBadge nivel={item.nivel} />
                          </div>
                          <p className="text-sm text-[hsl(var(--fve-charcoal))]/70 leading-relaxed line-clamp-3">
                            {item.descripcion}
                          </p>
                        </div>
                        <div className="md:col-span-4 md:text-right fve-no-print flex md:flex-col gap-2 md:items-end">
                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] px-3.5 py-2 font-medium"
                            style={{ background: 'hsl(var(--fve-forest))', color: 'white' }}
                          >
                            <Download className="w-3.5 h-3.5" /> Ficha PDF
                          </a>
                          <button
                            onClick={() => { setDocTitle(item.titulo); setOpen(true); }}
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] px-3.5 py-2 border border-[hsl(var(--fve-charcoal))]/25 hover:bg-[hsl(var(--fve-forest))] hover:text-white hover:border-[hsl(var(--fve-forest))] transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5" /> Solicitar original
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Legal Chile subset */}
        <div className="mt-16">
          <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-3">
            Antecedentes legales · Chile
          </p>
          <h3 className="font-serif-fve text-2xl md:text-3xl text-[hsl(var(--fve-forest-deep))] mb-2">
            Marco regulatorio local constituido.
          </h3>
          <p className="text-sm text-[hsl(var(--fve-charcoal))]/70 max-w-3xl mb-6">
            Complementario al data room LUC, estos antecedentes acreditan la subdivisión bajo
            DL 3.516 y la operatividad del predio bajo la regulación chilena vigente.
          </p>
          <ul className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            {DUE_DILIGENCE.map((item) => (
              <li key={item.id} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(var(--fve-forest))' }} />
                <div>
                  <p className="font-serif-fve text-base text-[hsl(var(--fve-forest-deep))]">{item.titulo}</p>
                  <p className="text-xs text-[hsl(var(--fve-charcoal))]/65 leading-relaxed mt-0.5">
                    {item.detalle}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer note */}
        <div className="mt-12 pt-6 border-t border-black/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-[hsl(var(--fve-charcoal))]/55">
          <span className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" />
            Versión 1.0 · 2026 · Forestal Valle Escondida SpA
          </span>
          <span>Confidencial — entrega de originales bajo NDA · ir@ofertaterrenos.cl</span>
        </div>
      </div>

      <DocRequestModal open={open} onOpenChange={setOpen} docTitle={docTitle} />
    </section>
  );
}
