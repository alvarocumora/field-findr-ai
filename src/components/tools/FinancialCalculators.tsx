import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calculator, TrendingUp, PiggyBank, DollarSign, BarChart3, Database } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useLots } from '@/hooks/useLots';

export const FinancialCalculators = () => {
  const { projects } = useProjects();
  const { lots } = useLots();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedLotId, setSelectedLotId] = useState<string>('');

  const filteredLots = selectedProjectId
    ? lots.filter(l => l.project_id === selectedProjectId && l.status === 'available')
    : [];

  // Investment Calculator State
  const [investmentData, setInvestmentData] = useState({
    purchasePrice: 100000000,
    downPayment: 20,
    annualAppreciation: 5,
    holdingPeriod: 5,
    monthlyRent: 0,
  });

  // Mortgage Calculator State
  const [mortgageData, setMortgageData] = useState({
    loanAmount: 80000000,
    interestRate: 4.5,
    loanTerm: 20,
  });

  // Subdivision Calculator State
  const [subdivisionData, setSubdivisionData] = useState({
    totalArea: 10000,
    numberOfLots: 10,
    pricePerSqm: 15000,
    developmentCosts: 50000000,
  });

  // Auto-fill when lot is selected
  useEffect(() => {
    if (!selectedLotId) return;
    const lot = lots.find(l => l.id === selectedLotId);
    if (!lot) return;

    const price = Number(lot.price || 0);
    const area = Number(lot.area || 0);

    if (price > 0) {
      setInvestmentData(prev => ({ ...prev, purchasePrice: price }));
      setMortgageData(prev => ({ ...prev, loanAmount: Math.round(price * 0.8) }));
    }
    if (area > 0) {
      setSubdivisionData(prev => ({
        ...prev,
        totalArea: area,
        pricePerSqm: price > 0 && area > 0 ? Math.round(price / area) : prev.pricePerSqm,
      }));
    }
  }, [selectedLotId, lots]);

  // Investment Calculations
  const calculateInvestment = () => {
    const { purchasePrice, downPayment, annualAppreciation, holdingPeriod, monthlyRent } = investmentData;
    const downPaymentAmount = purchasePrice * (downPayment / 100);
    const loanAmount = purchasePrice - downPaymentAmount;
    const futureValue = purchasePrice * Math.pow(1 + annualAppreciation / 100, holdingPeriod);
    const appreciation = futureValue - purchasePrice;
    const totalRent = monthlyRent * 12 * holdingPeriod;
    const totalReturn = appreciation + totalRent;
    const roi = ((totalReturn / downPaymentAmount) * 100).toFixed(1);
    const annualizedRoi = (Math.pow(1 + totalReturn / downPaymentAmount, 1 / holdingPeriod) - 1) * 100;

    return { downPaymentAmount, loanAmount, futureValue, appreciation, totalRent, totalReturn, roi, annualizedRoi: annualizedRoi.toFixed(1) };
  };

  // Mortgage Calculations
  const calculateMortgage = () => {
    const { loanAmount, interestRate, loanTerm } = mortgageData;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;
    return { monthlyPayment: Math.round(monthlyPayment), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest) };
  };

  // Subdivision Calculations
  const calculateSubdivision = () => {
    const { totalArea, numberOfLots, pricePerSqm, developmentCosts } = subdivisionData;
    const lotSize = totalArea / numberOfLots;
    const pricePerLot = lotSize * pricePerSqm;
    const totalRevenue = pricePerLot * numberOfLots;
    const profit = totalRevenue - developmentCosts;
    const profitMargin = (profit / totalRevenue) * 100;
    return { lotSize: Math.round(lotSize), pricePerLot, totalRevenue, profit, profitMargin: profitMargin.toFixed(1) };
  };

  const investmentResults = calculateInvestment();
  const mortgageResults = calculateMortgage();
  const subdivisionResults = calculateSubdivision();
  const formatCurrency = (value: number) => `$${value.toLocaleString('es-CL')}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Calculadoras Financieras</CardTitle>
            <CardDescription>Herramientas para análisis de inversión</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Lot Selector */}
        {(projects.length > 0 || lots.length > 0) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Database className="h-4 w-4" />
              <span>Cargar datos de lote:</span>
            </div>
            <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedLotId(''); }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLotId} onValueChange={setSelectedLotId} disabled={!selectedProjectId}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Seleccionar lote" />
              </SelectTrigger>
              <SelectContent>
                {filteredLots.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    Lote {l.lot_number} — {l.area}m² {l.price ? `• ${formatCurrency(Number(l.price))}` : ''}
                  </SelectItem>
                ))}
                {filteredLots.length === 0 && (
                  <SelectItem value="_none" disabled>Sin lotes disponibles</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs defaultValue="investment">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="investment" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Inversión
            </TabsTrigger>
            <TabsTrigger value="mortgage" className="gap-2">
              <PiggyBank className="h-4 w-4" />
              Hipoteca
            </TabsTrigger>
            <TabsTrigger value="subdivision" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Subdivisión
            </TabsTrigger>
          </TabsList>

          {/* Investment Calculator */}
          <TabsContent value="investment" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Precio de Compra</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" value={investmentData.purchasePrice} onChange={(e) => setInvestmentData({ ...investmentData, purchasePrice: Number(e.target.value) })} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Pie ({investmentData.downPayment}%)</Label>
                  <Slider value={[investmentData.downPayment]} onValueChange={([v]) => setInvestmentData({ ...investmentData, downPayment: v })} min={10} max={100} step={5} />
                </div>
                <div className="space-y-2">
                  <Label>Apreciación Anual ({investmentData.annualAppreciation}%)</Label>
                  <Slider value={[investmentData.annualAppreciation]} onValueChange={([v]) => setInvestmentData({ ...investmentData, annualAppreciation: v })} min={0} max={15} step={0.5} />
                </div>
                <div className="space-y-2">
                  <Label>Período de Tenencia ({investmentData.holdingPeriod} años)</Label>
                  <Slider value={[investmentData.holdingPeriod]} onValueChange={([v]) => setInvestmentData({ ...investmentData, holdingPeriod: v })} min={1} max={20} />
                </div>
                <div className="space-y-2">
                  <Label>Arriendo Mensual (opcional)</Label>
                  <Input type="number" value={investmentData.monthlyRent} onChange={(e) => setInvestmentData({ ...investmentData, monthlyRent: Number(e.target.value) })} />
                </div>
              </div>
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <h4 className="font-semibold">Resultados de Inversión</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Pie Inicial</p><p className="font-bold">{formatCurrency(investmentResults.downPaymentAmount)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Monto Crédito</p><p className="font-bold">{formatCurrency(investmentResults.loanAmount)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Valor Futuro</p><p className="font-bold text-primary">{formatCurrency(Math.round(investmentResults.futureValue))}</p></div>
                    <div><p className="text-sm text-muted-foreground">Plusvalía</p><p className="font-bold text-green-600">{formatCurrency(Math.round(investmentResults.appreciation))}</p></div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Retorno Total (ROI)</p>
                    <p className="text-3xl font-bold text-primary">{investmentResults.roi}%</p>
                    <p className="text-sm text-muted-foreground">{investmentResults.annualizedRoi}% anualizado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mortgage Calculator */}
          <TabsContent value="mortgage" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto del Crédito</Label>
                  <Input type="number" value={mortgageData.loanAmount} onChange={(e) => setMortgageData({ ...mortgageData, loanAmount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Tasa de Interés ({mortgageData.interestRate}%)</Label>
                  <Slider value={[mortgageData.interestRate]} onValueChange={([v]) => setMortgageData({ ...mortgageData, interestRate: v })} min={1} max={15} step={0.1} />
                </div>
                <div className="space-y-2">
                  <Label>Plazo ({mortgageData.loanTerm} años)</Label>
                  <Slider value={[mortgageData.loanTerm]} onValueChange={([v]) => setMortgageData({ ...mortgageData, loanTerm: v })} min={5} max={30} />
                </div>
              </div>
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <h4 className="font-semibold">Detalles del Crédito</h4>
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Cuota Mensual</p>
                    <p className="text-3xl font-bold text-primary">{formatCurrency(mortgageResults.monthlyPayment)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Total a Pagar</p><p className="font-bold">{formatCurrency(mortgageResults.totalPayment)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Total Intereses</p><p className="font-bold text-amber-600">{formatCurrency(mortgageResults.totalInterest)}</p></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subdivision Calculator */}
          <TabsContent value="subdivision" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Superficie Total (m²)</Label>
                  <Input type="number" value={subdivisionData.totalArea} onChange={(e) => setSubdivisionData({ ...subdivisionData, totalArea: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Número de Lotes</Label>
                  <Input type="number" value={subdivisionData.numberOfLots} onChange={(e) => setSubdivisionData({ ...subdivisionData, numberOfLots: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Precio por m² de Venta</Label>
                  <Input type="number" value={subdivisionData.pricePerSqm} onChange={(e) => setSubdivisionData({ ...subdivisionData, pricePerSqm: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Costos de Desarrollo</Label>
                  <Input type="number" value={subdivisionData.developmentCosts} onChange={(e) => setSubdivisionData({ ...subdivisionData, developmentCosts: Number(e.target.value) })} />
                </div>
              </div>
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <h4 className="font-semibold">Análisis de Subdivisión</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Tamaño por Lote</p><p className="font-bold">{subdivisionResults.lotSize.toLocaleString()} m²</p></div>
                    <div><p className="text-sm text-muted-foreground">Precio por Lote</p><p className="font-bold">{formatCurrency(subdivisionResults.pricePerLot)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Ingreso Total</p><p className="font-bold">{formatCurrency(subdivisionResults.totalRevenue)}</p></div>
                    <div><p className="text-sm text-muted-foreground">Costos</p><p className="font-bold text-amber-600">{formatCurrency(subdivisionData.developmentCosts)}</p></div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-1">Utilidad Proyectada</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(subdivisionResults.profit)}</p>
                    <p className="text-sm text-muted-foreground">Margen: {subdivisionResults.profitMargin}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
