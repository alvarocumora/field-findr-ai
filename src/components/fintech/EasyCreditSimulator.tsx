import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ArrowUpRight, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computeEasyCredit, EASY_CREDIT_TERMS, financingInquiryUrl, LICANTEN_PATH, LICANTEN_PROMO_PRICE } from '@/lib/easyCredit';
import { getShareUrl } from '@/lib/publicUrls';

const clp = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

export function EasyCreditSimulator({ defaultPrice = LICANTEN_PROMO_PRICE, lotId }: { defaultPrice?: number; lotId?: string | null }) {
  const id = useId();
  const [price, setPrice] = useState(defaultPrice);
  const [downPct, setDownPct] = useState(20);
  const [months, setMonths] = useState(36);
  const [annualRatePct, setAnnualRatePct] = useState(12);
  const [pdfBusy, setPdfBusy] = useState(false);
  const result = computeEasyCredit({ price, downPct, months, annualRatePct });
  const updateNumber = (value: string, max: number) => Math.min(max, Math.max(0, Number(value) || 0));

  const downloadPdf = async () => {
    setPdfBusy(true);
    try {
      const { generateQuotePDF } = await import('@/lib/pdfGenerator');
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + 30);
      await generateQuotePDF({
        projectName: 'Valle Escondido · Licantén',
        projectLocation: 'Licantén, Región del Maule',
        lotNumber: 'Simulación libre',
        lotArea: 0,
        lotPrice: price,
        pricePerSqm: 0,
        downPaymentPercent: downPct,
        downPayment: result.downPayment,
        financedAmount: result.principal,
        termMonths: months,
        interestRate: annualRatePct / 12,
        monthlyPayment: result.monthlyPayment,
        totalInterest: result.totalInterest,
        totalCost: result.totalPaid,
        generatedAt: now,
        validUntil,
        verifyUrl: getShareUrl(LICANTEN_PATH),
      });
      toast.success('Simulación descargada en PDF');
    } catch {
      toast.error('No se pudo generar el PDF');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <section id="simula-tu-cuota" aria-labelledby={`${id}-title`} className="scroll-mt-24 border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 md:py-16">
        <div className="mb-8 flex items-center gap-3">
          <Calculator className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
          <h2 id={`${id}-title`} className="font-editorial text-3xl text-foreground sm:text-4xl">Tu parcela, a tu ritmo</h2>
        </div>
        <p className="mb-8 max-w-2xl text-muted-foreground">Explora cuánto podrías pagar al mes. Ajusta el valor, el pie y el plazo; descarga tu simulación y conversa con el equipo de Valle Escondido sobre sus opciones de financiamiento.</p>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="min-w-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor={`${id}-price`}>Valor de la propiedad (CLP)</Label>
              <Input id={`${id}-price`} type="number" inputMode="numeric" min={0} max={1_000_000_000} step={10000} value={price} onChange={e => setPrice(updateNumber(e.target.value, 1_000_000_000))} className="h-12 text-lg" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor={`${id}-down`}>Pie inicial · {downPct}%</Label>
                <span className="rural-data text-sm text-primary">{clp(result.downPayment)} CLP</span>
              </div>
              <Input id={`${id}-down`} type="range" min={0} max={100} step={5} value={downPct} onChange={e => setDownPct(Number(e.target.value))} className="easy-credit-range h-10 border-0 bg-transparent px-0 shadow-none" />
            </div>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Plazo (meses)</legend>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {EASY_CREDIT_TERMS.map(term => <Button key={term} type="button" variant={months === term ? 'default' : 'outline'} aria-pressed={months === term} aria-label={`${term} meses`} onClick={() => setMonths(term)} className="h-11 px-0 rural-data">{term}</Button>)}
              </div>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor={`${id}-rate`}>Tasa nominal anual referencial (%)</Label>
              <Input id={`${id}-rate`} type="number" inputMode="decimal" min={0} max={60} step={0.1} value={annualRatePct} onChange={e => setAnnualRatePct(updateNumber(e.target.value, 60))} aria-describedby={`${id}-rate-note`} className="h-12" />
              <p id={`${id}-rate-note`} className="text-xs text-muted-foreground">12% es un supuesto ilustrativo editable, no una tasa ofrecida por una institución financiera ni una condición disponible para terrenos rurales</p>
            </div>
          </div>
          <div className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
            <p className="text-sm text-muted-foreground">Cuota mensual referencial</p>
            <output aria-live="polite" aria-atomic="true" className="mt-2 block font-editorial text-4xl text-primary sm:text-5xl">{clp(result.monthlyPayment)} <span className="font-sans text-sm">CLP</span></output>
            <p className="mt-2 text-sm text-muted-foreground">{months} cuotas · tasa anual {annualRatePct.toLocaleString('es-CL')}%</p>
            <dl className="my-6 divide-y divide-border text-sm">
              {[
                ['Pie inicial', result.downPayment], ['Monto financiado', result.principal],
                ['Intereses referenciales', result.totalInterest], ['Costo total (pie + cuotas)', result.totalPaid],
              ].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-x-3 gap-y-1 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="rural-data font-medium">{clp(Number(value))} CLP</dd></div>)}
            </dl>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" size="lg" variant="outline" className="w-full whitespace-normal px-3" disabled={pdfBusy || price <= 0} onClick={downloadPdf}>
                {pdfBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <FileDown aria-hidden="true" />}Descargar PDF
              </Button>
              <Button asChild size="lg" className="w-full whitespace-normal px-3"><Link to={financingInquiryUrl(lotId)}>Consultar financiamiento<ArrowUpRight aria-hidden="true" /></Link></Button>
            </div>
          </div>
        </div>
        <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">Simulación referencial, no constituye oferta de crédito ni aprobación; excluye seguros, comisiones, impuestos y otros gastos. Financiamiento sujeto a evaluación y disponibilidad de producto para terrenos rurales.</p>
      </div>
    </section>
  );
}