import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQS } from '../data/faqs';

export default function FveFaqs() {
  return (
    <section
      id="faq"
      className="fve-no-print py-24 md:py-32"
      style={{ background: 'hsl(var(--fve-sand-soft))' }}
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-10">
        <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--fve-gold))] mb-4">
          09 · Preguntas Frecuentes
        </p>
        <h2 className="font-serif-fve text-4xl md:text-5xl leading-tight mb-10">
          Respuestas a lo esencial.
        </h2>

        <Accordion type="single" collapsible className="border-y border-black/15">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-black/15 last:border-b-0"
            >
              <AccordionTrigger className="font-serif-fve text-lg md:text-xl text-[hsl(var(--fve-forest-deep))] py-5 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-[hsl(var(--fve-charcoal))]/80 leading-relaxed text-base pb-6">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
