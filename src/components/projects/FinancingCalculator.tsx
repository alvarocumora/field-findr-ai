import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  TrendingUp,
  PiggyBank,
  DollarSign,
  Percent,
  Calendar,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { generateQuotePDF, QuotePDFData } from '@/lib/pdfGenerator';
import { toast } from 'sonner';

interface FinancingCalculatorProps {
  lotPrice: number;
  lotNumber: string;
  lotArea: number;
  projectName?: string;
  projectLocation?: string;
  onClose?: () => void;
}

const TERM_OPTIONS = [12, 24, 36, 48, 60];
const DEFAULT_INTEREST_RATE = 0.9; // 0.9% mensual (referencia Chile)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

// French amortization system: M = P * [r(1+r)^n] / [(1+r)^n - 1]
const calculateMonthlyPayment = (principal: number, monthlyRate: number, months: number) => {
  if (monthlyRate === 0) return principal / months;
  const r = monthlyRate / 100;
  const numerator = r * Math.pow(1 + r, months);
  const denominator = Math.pow(1 + r, months) - 1;
  return principal * (numerator / denominator);
};

// CAE approximation: ((Total / Principal) ^ (1/years)) - 1
const calculateCAE = (totalPaid: number, principal: number, years: number) => {
  if (principal === 0 || years === 0) return 0;
  return (Math.pow(totalPaid / principal, 1 / years) - 1) * 100;
};

export const FinancingCalculator = ({ 
  lotPrice, 
  lotNumber, 
  lotArea,
  projectName = 'Proyecto',
  projectLocation = 'Chile',
  onClose 
}: FinancingCalculatorProps) => {
  // Simulator state
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [termMonths, setTermMonths] = useState(36);
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  
  // Capacity calculator state
  const [monthlyIncome, setMonthlyIncome] = useState(1500000);
  const [maxDebtPercent, setMaxDebtPercent] = useState(30);
  
  // UI state
  const [showDetails, setShowDetails] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Calculate financing values
  const calculations = useMemo(() => {
    const downPayment = lotPrice * (downPaymentPercent / 100);
    const financedAmount = lotPrice - downPayment;
    const monthlyPayment = calculateMonthlyPayment(financedAmount, interestRate, termMonths);
    const totalPayments = monthlyPayment * termMonths;
    const totalInterest = totalPayments - financedAmount;
    const totalCost = downPayment + totalPayments;
    const cae = calculateCAE(totalPayments, financedAmount, termMonths / 12);
    
    return {
      downPayment,
      financedAmount,
      monthlyPayment,
      totalPayments,
      totalInterest,
      totalCost,
      cae
    };
  }, [lotPrice, downPaymentPercent, termMonths, interestRate]);

  // Calculate max affordable price
  const maxAffordablePrice = useMemo(() => {
    const maxMonthlyPayment = monthlyIncome * (maxDebtPercent / 100);
    // Reverse calculation: P = M * [(1+r)^n - 1] / [r(1+r)^n]
    const r = interestRate / 100;
    const n = termMonths;
    if (r === 0) return maxMonthlyPayment * n;
    const factor = (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    const maxFinanced = maxMonthlyPayment * factor;
    const maxPrice = maxFinanced / (1 - downPaymentPercent / 100);
    return maxPrice;
  }, [monthlyIncome, maxDebtPercent, interestRate, termMonths, downPaymentPercent]);

  const canAffordLot = maxAffordablePrice >= lotPrice;

  // Generate PDF quote
  const handleGeneratePDF = () => {
    setIsGeneratingPDF(true);
    
    try {
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days
      
      const pdfData: QuotePDFData = {
        projectName,
        projectLocation,
        lotNumber,
        lotArea,
        lotPrice,
        pricePerSqm: lotPrice / lotArea,
        downPaymentPercent,
        downPayment: calculations.downPayment,
        financedAmount: calculations.financedAmount,
        termMonths,
        interestRate,
        monthlyPayment: calculations.monthlyPayment,
        totalInterest: calculations.totalInterest,
        totalCost: calculations.totalCost,
        cae: calculations.cae,
        generatedAt: now,
        validUntil,
      };
      
      generateQuotePDF(pdfData);
      toast.success('Cotización PDF generada exitosamente');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar la cotización');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Card className="glass-strong border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Simulador de Financiamiento
            </CardTitle>
            <CardDescription>
              Lote {lotNumber} • {lotArea.toLocaleString()} m²
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg font-bold">
            {formatCurrency(lotPrice)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="simulator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simulator" className="gap-2 text-xs">
              <TrendingUp className="h-4 w-4" />
              Cuotas
            </TabsTrigger>
            <TabsTrigger value="capacity" className="gap-2 text-xs">
              <PiggyBank className="h-4 w-4" />
              Capacidad
            </TabsTrigger>
          </TabsList>

          {/* Simulator Tab */}
          <TabsContent value="simulator" className="space-y-5 mt-4">
            {/* Down Payment Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Pie inicial
                </Label>
                <span className="text-sm font-semibold">
                  {downPaymentPercent}% ({formatCurrency(calculations.downPayment)})
                </span>
              </div>
              <Slider
                value={[downPaymentPercent]}
                onValueChange={([val]) => setDownPaymentPercent(val)}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Term Selection */}
            <div className="space-y-3">
              <Label className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Plazo (meses)
              </Label>
              <div className="grid grid-cols-5 gap-2">
                {TERM_OPTIONS.map((term) => (
                  <Button
                    key={term}
                    variant={termMonths === term ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTermMonths(term)}
                    className="text-xs"
                  >
                    {term}
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

            {/* Results */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Cuota mensual estimada</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(calculations.monthlyPayment)}
                </p>
              </div>
              
              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full gap-2">
                    Ver detalle completo
                    {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-3 border-t mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monto a financiar</span>
                    <span className="font-medium">{formatCurrency(calculations.financedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total intereses</span>
                    <span className="font-medium text-amber-600">{formatCurrency(calculations.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total a pagar</span>
                    <span className="font-bold">{formatCurrency(calculations.totalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground flex items-center gap-1">
                      CAE estimado
                      <Info className="h-3 w-3" />
                    </span>
                    <span className="font-semibold text-primary">{formatPercent(calculations.cae)}</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Download PDF Button */}
              <Button 
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="w-full gap-2"
                variant="outline"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {isGeneratingPDF ? 'Generando...' : 'Descargar Cotización PDF'}
              </Button>
            </div>
          </TabsContent>

          {/* Capacity Tab */}
          <TabsContent value="capacity" className="space-y-5 mt-4">
            {/* Monthly Income */}
            <div className="space-y-2">
              <Label className="text-sm">Ingreso mensual líquido</Label>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(parseInt(e.target.value) || 0)}
                className="text-right"
              />
            </div>

            {/* Max Debt Ratio Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">% máximo de endeudamiento</Label>
                <span className="text-sm font-semibold">{maxDebtPercent}%</span>
              </div>
              <Slider
                value={[maxDebtPercent]}
                onValueChange={([val]) => setMaxDebtPercent(val)}
                min={20}
                max={40}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20% (conservador)</span>
                <span>40% (agresivo)</span>
              </div>
            </div>

            {/* Max Payment */}
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-sm text-muted-foreground">Cuota máxima sugerida</p>
              <p className="text-xl font-bold">
                {formatCurrency(monthlyIncome * (maxDebtPercent / 100))}
              </p>
            </div>

            {/* Result */}
            <div className={cn(
              "rounded-xl border p-4 space-y-2",
              canAffordLot 
                ? "bg-emerald-500/5 border-emerald-500/20" 
                : "bg-amber-500/5 border-amber-500/20"
            )}>
              <div className="flex items-center gap-2">
                <Sparkles className={cn("h-5 w-5", canAffordLot ? "text-emerald-500" : "text-amber-500")} />
                <p className="font-medium">
                  {canAffordLot ? '¡Puedes financiar este lote!' : 'Ajusta tus parámetros'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Con tus ingresos puedes financiar hasta{' '}
                <span className="font-semibold">{formatCurrency(maxAffordablePrice)}</span>
              </p>
              {!canAffordLot && (
                <p className="text-xs text-amber-600">
                  Te faltan {formatCurrency(lotPrice - maxAffordablePrice)} para este lote.
                  Intenta aumentar el pie inicial o el plazo.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          * Valores referenciales. Las condiciones finales dependen del análisis crediticio.
        </p>
      </CardContent>
    </Card>
  );
};
