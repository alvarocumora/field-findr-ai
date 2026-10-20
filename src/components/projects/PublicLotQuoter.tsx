import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InterestFormDialog } from './InterestFormDialog';
import {
  Calculator,
  DollarSign,
  Ruler,
  Calendar,
  Percent,
  Send,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileDown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateQuotePDF, QuotePDFData } from '@/lib/pdfGenerator';
import { toast } from 'sonner';
import { getShareUrl } from '@/lib/publicUrls';

interface Lot {
  id: string;
  lot_number: string;
  area: number;
  price: number | null;
  price_per_sqm: number | null;
  status: string | null;
  name: string | null;
  features: any;
}

interface PublicLotQuoterProps {
  lots: Lot[];
  projectName: string;
  projectId: string;
  projectOwnerId: string;
  projectLocation?: string;
}

const TERM_OPTIONS = [12, 24, 36, 48, 60];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

const calculateMonthlyPayment = (principal: number, monthlyRate: number, months: number) => {
  if (monthlyRate === 0) return principal / months;
  const r = monthlyRate / 100;
  const num = r * Math.pow(1 + r, months);
  const den = Math.pow(1 + r, months) - 1;
  return principal * (num / den);
};

export const PublicLotQuoter = ({
  lots,
  projectName,
  projectId,
  projectOwnerId,
  projectLocation = '',
}: PublicLotQuoterProps) => {
  const availableLots = useMemo(
    () => lots.filter((l) => l.status === 'available' && l.price),
    [lots]
  );

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [termMonths, setTermMonths] = useState(36);
  const [interestRate, setInterestRate] = useState(0.9);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const selectedLot = availableLots.find((l) => l.id === selectedLotId) || null;
  const lotPrice = selectedLot?.price || 0;

  const calculations = useMemo(() => {
    if (!lotPrice) return null;
    const downPayment = lotPrice * (downPaymentPercent / 100);
    const financedAmount = lotPrice - downPayment;
    const monthlyPayment = calculateMonthlyPayment(financedAmount, interestRate, termMonths);
    const totalPayments = monthlyPayment * termMonths;
    const totalInterest = totalPayments - financedAmount;
    const totalCost = downPayment + totalPayments;
    return { downPayment, financedAmount, monthlyPayment, totalPayments, totalInterest, totalCost };
  }, [lotPrice, downPaymentPercent, termMonths, interestRate]);

  const simulationSummary = calculations
    ? `Pie ${downPaymentPercent}% (${formatCurrency(calculations.downPayment)}) + ${termMonths} cuotas de ${formatCurrency(calculations.monthlyPayment)}`
    : undefined;

  const handleGeneratePDF = async () => {
    if (!selectedLot || !calculations) return;
    setIsGeneratingPDF(true);
    try {
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + 30);
      const pdfData: QuotePDFData = {
        projectName,
        projectLocation,
        lotNumber: selectedLot.lot_number,
        lotArea: Number(selectedLot.area),
        lotPrice,
        pricePerSqm: lotPrice / Number(selectedLot.area),
        downPaymentPercent,
        downPayment: calculations.downPayment,
        financedAmount: calculations.financedAmount,
        termMonths,
        interestRate,
        monthlyPayment: calculations.monthlyPayment,
        totalInterest: calculations.totalInterest,
        totalCost: calculations.totalCost,
        cae: 0,
        generatedAt: now,
        validUntil,
      };
      await generateQuotePDF({ ...pdfData, verifyUrl: getShareUrl(`/proyecto/${projectId}`, { lote: selectedLot.lot_number }) });
      toast.success('Cotización PDF descargada');
    } catch {
      toast.error('Error al generar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (availableLots.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Calculator className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-muted-foreground">Sin lotes disponibles</h3>
          <p className="text-sm text-muted-foreground">Todos los lotes de este proyecto están reservados o vendidos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Lot Selector - Left Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Selecciona un Lote
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {availableLots.length} lotes disponibles
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 p-3">
                  {availableLots.map((lot) => {
                    const isSelected = selectedLotId === lot.id;
                    return (
                      <button
                        key={lot.id}
                        onClick={() => setSelectedLotId(lot.id)}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border transition-all',
                          'hover:border-primary/40 hover:bg-primary/5',
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-transparent'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-sm text-foreground">
                              Lote {lot.lot_number}
                            </span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Ruler className="h-3 w-3" />
                                {Number(lot.area).toLocaleString()} m²
                              </span>
                              <span className="flex items-center gap-1 text-foreground font-medium">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(lot.price!)}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          )}
                          {!isSelected && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Simulator - Right Column */}
        <div className="lg:col-span-3">
          {!selectedLot ? (
            <Card className="border-dashed h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Calculator className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Selecciona un lote para simular</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Elige de la lista para ver cuotas y descargar cotización
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Simulador — Lote {selectedLot.lot_number}
                  </CardTitle>
                  <Badge variant="outline" className="text-lg font-bold">
                    {formatCurrency(lotPrice)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {Number(selectedLot.area).toLocaleString()} m² · {formatCurrency(lotPrice / Number(selectedLot.area))}/m²
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Down Payment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Pie inicial
                    </Label>
                    <span className="text-sm font-semibold">
                      {downPaymentPercent}% ({calculations ? formatCurrency(calculations.downPayment) : '—'})
                    </span>
                  </div>
                  <Slider
                    value={[downPaymentPercent]}
                    onValueChange={([v]) => setDownPaymentPercent(v)}
                    min={10}
                    max={50}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10%</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Term */}
                <div className="space-y-3">
                  <Label className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Plazo (meses)
                  </Label>
                  <div className="grid grid-cols-5 gap-2">
                    {TERM_OPTIONS.map((t) => (
                      <Button
                        key={t}
                        variant={termMonths === t ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTermMonths(t)}
                        className="text-xs"
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    Tasa mensual
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                      step={0.1}
                      min={0}
                      max={5}
                      className="w-24 text-center"
                    />
                    <span className="text-sm text-muted-foreground">% mensual</span>
                  </div>
                </div>

                <Separator />

                {/* Result */}
                {calculations && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Cuota mensual estimada</p>
                      <p className="text-4xl font-bold text-primary">
                        {formatCurrency(calculations.monthlyPayment)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Pie</p>
                        <p className="font-semibold">{formatCurrency(calculations.downPayment)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Financiado</p>
                        <p className="font-semibold">{formatCurrency(calculations.financedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Total</p>
                        <p className="font-semibold">{formatCurrency(calculations.totalCost)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowInterestForm(true)}
                  >
                    <Send className="h-4 w-4" />
                    Me Interesa
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF || !calculations}
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4" />
                    )}
                    PDF
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  * Valores referenciales. Las condiciones finales dependen del análisis crediticio.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <InterestFormDialog
        open={showInterestForm}
        onOpenChange={setShowInterestForm}
        lot={selectedLot}
        projectName={projectName}
        projectId={projectId}
        projectOwnerId={projectOwnerId}
        simulationSummary={simulationSummary}
      />
    </>
  );
};
