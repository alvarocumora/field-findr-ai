import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { FileText, FileDown, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateQuotePDF, type QuotePDFData } from '@/lib/pdfGenerator';
import { generateLotDataCardPdf } from '@/lib/lotDataCardPdf';
import { parseLotFeatures, type Lot } from '@/hooks/useLots';
import { whatsapp } from '@/lib/whatsappUtils';
import { useAuth } from '@/hooks/useAuth';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface LotQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: Lot | null;
  projectName: string;
  projectLocation?: string;
  /** Project's reservation deposit ("seña") — prefilled in the quote. */
  reservationDeposit?: number | null;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

/** French amortization — same formula as the public quoter. */
const monthlyPaymentFor = (principal: number, monthlyRatePct: number, months: number): number => {
  if (months <= 0) return principal;
  const r = monthlyRatePct / 100;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
};

/**
 * Seller-side quote tool: builds a financing quote for a lot (with optional
 * buyer name and negotiated price), downloads the quote PDF / lot data-sheet
 * PDF, or shares the summary via WhatsApp.
 */
const LotQuoteDialog = ({
  open,
  onOpenChange,
  lot,
  projectName,
  projectLocation = '',
  reservationDeposit,
}: LotQuoteDialogProps) => {
  const { user } = useAuth();
  const { token: mapboxToken } = useMapboxToken();
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [termMonths, setTermMonths] = useState(36);
  const [monthlyRate, setMonthlyRate] = useState('1.0');
  const [generating, setGenerating] = useState(false);

  const listPrice = lot?.price ? Number(lot.price) : 0;

  useEffect(() => {
    if (open && lot) {
      setSalePrice(listPrice ? String(listPrice) : '');
      setBuyerName('');
      setBuyerPhone('');
    }
  }, [open, lot, listPrice]);

  const calc = useMemo(() => {
    const price = Number(salePrice) || 0;
    if (price <= 0 || !lot) return null;
    const deposit = Number(reservationDeposit) || 0;
    const downPayment = Math.round(price * (downPaymentPct / 100));
    const financedAmount = price - downPayment;
    const rate = Number(monthlyRate) || 0;
    const monthly = Math.round(monthlyPaymentFor(financedAmount, rate, termMonths));
    const totalPayments = monthly * termMonths;
    const totalInterest = totalPayments - financedAmount;
    const totalCost = downPayment + totalPayments;
    return { price, deposit, downPayment, financedAmount, monthly, totalPayments, totalInterest, totalCost, rate };
  }, [salePrice, downPaymentPct, termMonths, monthlyRate, reservationDeposit, lot]);

  const handleQuotePDF = () => {
    if (!lot || !calc) return;
    setGenerating(true);
    try {
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + 15);
      const data: QuotePDFData = {
        projectName,
        projectLocation,
        lotNumber: lot.lot_number,
        lotArea: Number(lot.area),
        lotPrice: calc.price,
        pricePerSqm: Number(lot.area) > 0 ? calc.price / Number(lot.area) : 0,
        downPaymentPercent: downPaymentPct,
        downPayment: calc.downPayment,
        financedAmount: calc.financedAmount,
        termMonths,
        interestRate: calc.rate,
        monthlyPayment: calc.monthly,
        totalInterest: calc.totalInterest,
        totalCost: calc.totalCost,
        cae: calc.rate * 12 * 1.1, // rough CAE approximation, matches public quoter
        generatedAt: now,
        validUntil,
        buyerName: buyerName.trim() || undefined,
        listPrice: listPrice && listPrice !== calc.price ? listPrice : undefined,
        reservationAmount: calc.deposit > 0 ? calc.deposit : undefined,
        sellerContact: user?.email ?? undefined,
      };
      generateQuotePDF(data);
      toast.success('Cotización descargada');
    } catch {
      toast.error('Error al generar la cotización');
    } finally {
      setGenerating(false);
    }
  };

  const handleDataSheetPDF = async () => {
    if (!lot) return;
    setGenerating(true);
    try {
      await generateLotDataCardPdf(lot, projectName, parseLotFeatures(lot.features));
      toast.success('Ficha del lote descargada');
    } catch {
      toast.error('Error al generar la ficha');
    } finally {
      setGenerating(false);
    }
  };

  const handleWhatsApp = () => {
    if (!lot || !calc) return;
    const url = whatsapp.quoteSummary({
      buyerName: buyerName.trim() || undefined,
      projectName,
      lotNumber: lot.lot_number,
      lotArea: Number(lot.area),
      salePrice: calc.price,
      reservationAmount: calc.deposit > 0 ? calc.deposit : null,
      downPayment: calc.downPayment,
      termMonths,
      monthlyPayment: calc.monthly,
      phone: buyerPhone.trim() || undefined,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!lot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Cotizar {lot.name || `Lote ${lot.lot_number}`}
          </DialogTitle>
          <DialogDescription>
            {projectName} · {Number(lot.area).toLocaleString('es-CL')} m²
            {listPrice > 0 && ` · Lista: ${formatCLP(listPrice)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="q-buyer">Comprador (opcional)</Label>
              <Input id="q-buyer" placeholder="Nombre" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-phone">WhatsApp (opcional)</Label>
              <Input id="q-phone" placeholder="+569..." value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="q-price">Precio de venta (CLP)</Label>
            <Input id="q-price" type="number" min={1} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
            {calc && listPrice > 0 && calc.price !== listPrice && (
              <p className="text-xs text-muted-foreground">
                <span className={calc.price < listPrice ? 'text-amber-600' : 'text-green-600'}>
                  {calc.price < listPrice ? 'Descuento' : 'Sobre lista'}{' '}
                  {Math.abs(Math.round(((calc.price - listPrice) / listPrice) * 100))}%
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Pie inicial</Label>
              <span className="font-medium tabular-nums">
                {downPaymentPct}%{calc ? ` · ${formatCLP(calc.downPayment)}` : ''}
              </span>
            </div>
            <Slider value={[downPaymentPct]} min={0} max={80} step={5} onValueChange={([v]) => setDownPaymentPct(v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Plazo</Label>
                <span className="font-medium tabular-nums">{termMonths} meses</span>
              </div>
              <Slider value={[termMonths]} min={6} max={120} step={6} onValueChange={([v]) => setTermMonths(v)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-rate">Tasa mensual (%)</Label>
              <Input id="q-rate" type="number" min={0} max={5} step={0.1} value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} />
            </div>
          </div>

          {calc && (
            <>
              <Separator />
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Cuota mensual estimada</p>
                  <p className="text-2xl font-bold text-primary tabular-nums">{formatCLP(calc.monthly)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {termMonths} cuotas · tasa {calc.rate.toFixed(1)}%/mes
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {calc.deposit > 0 && (
                    <>
                      <span className="text-muted-foreground">Reserva (seña)</span>
                      <span className="text-right tabular-nums">{formatCLP(calc.deposit)}</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Pie ({downPaymentPct}%)</span>
                  <span className="text-right tabular-nums">{formatCLP(calc.downPayment)}</span>
                  <span className="text-muted-foreground">A financiar</span>
                  <span className="text-right tabular-nums">{formatCLP(calc.financedAmount)}</span>
                  <span className="text-muted-foreground">Costo total</span>
                  <span className="text-right font-semibold tabular-nums">{formatCLP(calc.totalCost)}</span>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button onClick={handleQuotePDF} disabled={!calc || generating} className="gap-1.5">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Cotización PDF
            </Button>
            <Button variant="outline" onClick={handleDataSheetPDF} disabled={generating} className="gap-1.5">
              <FileText className="h-4 w-4" />
              Ficha del lote
            </Button>
            <Button
              variant="outline"
              onClick={handleWhatsApp}
              disabled={!calc}
              className="gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LotQuoteDialog;
