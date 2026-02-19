import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, TrendingDown, DollarSign, Percent, Calendar, Info, Shield,
} from 'lucide-react';
import { formatPriceLatam } from '@/lib/latam';

// Chilean bank reference rates (approximate as of 2025-2026)
const BANK_RATES = [
  { bank: 'Banco Estado', rate: 4.2, uf: true },
  { bank: 'Banco de Chile', rate: 4.5, uf: true },
  { bank: 'BCI', rate: 4.3, uf: true },
  { bank: 'Santander', rate: 4.6, uf: true },
  { bank: 'Scotiabank', rate: 4.4, uf: true },
  { bank: 'Itaú', rate: 4.7, uf: true },
  { bank: 'Security', rate: 4.8, uf: true },
];

const UF_VALUE = 38500; // Approximate UF value in CLP

interface MortgageSimulatorProps {
  defaultPrice?: number;
  defaultCurrency?: string;
}

export const MortgageSimulator = ({ defaultPrice = 100000000, defaultCurrency = 'CLP' }: MortgageSimulatorProps) => {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [propertyPrice, setPropertyPrice] = useState(defaultPrice);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [termYears, setTermYears] = useState(20);
  const [selectedBank, setSelectedBank] = useState(BANK_RATES[0].bank);
  const [customRate, setCustomRate] = useState<number | null>(null);

  const bankRate = BANK_RATES.find(b => b.bank === selectedBank)?.rate || 4.5;
  const activeRate = customRate ?? bankRate;

  const priceInCLP = currency === 'UF' ? propertyPrice * UF_VALUE : propertyPrice;

  const results = useMemo(() => {
    const downPayment = priceInCLP * (downPaymentPct / 100);
    const loan = priceInCLP - downPayment;
    const monthlyRate = activeRate / 100 / 12;
    const n = termYears * 12;

    const monthly = monthlyRate > 0
      ? (loan * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
      : loan / n;

    const total = monthly * n;
    const totalInterest = total - loan;
    const cae = n > 0 && loan > 0
      ? (Math.pow(total / loan, 1 / termYears) - 1) * 100
      : 0;

    // Income requirement (30% rule)
    const requiredIncome = monthly / 0.3;

    return {
      downPayment: Math.round(downPayment),
      loan: Math.round(loan),
      monthly: Math.round(monthly),
      total: Math.round(total),
      totalInterest: Math.round(totalInterest),
      cae: cae.toFixed(1),
      requiredIncome: Math.round(requiredIncome),
    };
  }, [priceInCLP, downPaymentPct, termYears, activeRate]);

  const fmt = (v: number) => formatPriceLatam(v, 'CLP');

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Simulador Hipotecario Chile
            </CardTitle>
            <CardDescription>Con tasas reales de bancos chilenos</CardDescription>
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLP">CLP</SelectItem>
              <SelectItem value="UF">UF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="simulate">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simulate">Simulador</TabsTrigger>
            <TabsTrigger value="rates">Tasas Bancos</TabsTrigger>
          </TabsList>

          <TabsContent value="simulate" className="space-y-5 mt-4">
            {/* Property Price */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Valor propiedad ({currency})
              </Label>
              <Input
                type="number"
                value={propertyPrice}
                onChange={e => setPropertyPrice(Number(e.target.value))}
              />
              {currency === 'UF' && (
                <p className="text-xs text-muted-foreground">≈ {fmt(priceInCLP)}</p>
              )}
            </div>

            {/* Down Payment */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  Pie inicial
                </Label>
                <span className="text-sm font-semibold">{downPaymentPct}% ({fmt(results.downPayment)})</span>
              </div>
              <Slider value={[downPaymentPct]} onValueChange={([v]) => setDownPaymentPct(v)} min={10} max={50} step={5} />
            </div>

            {/* Term */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Plazo: {termYears} años ({termYears * 12} cuotas)
              </Label>
              <Slider value={[termYears]} onValueChange={([v]) => setTermYears(v)} min={5} max={30} step={1} />
            </div>

            {/* Bank Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Banco
              </Label>
              <Select value={selectedBank} onValueChange={v => { setSelectedBank(v); setCustomRate(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BANK_RATES.map(b => (
                    <SelectItem key={b.bank} value={b.bank}>
                      {b.bank} — {b.rate}% anual
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Rate Override */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                Tasa anual (%)
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  value={customRate ?? bankRate}
                  onChange={e => setCustomRate(parseFloat(e.target.value) || 0)}
                  step={0.1}
                  min={0}
                  max={20}
                  className="w-28"
                />
                {customRate !== null && (
                  <Badge variant="outline" className="cursor-pointer" onClick={() => setCustomRate(null)}>
                    Restaurar
                  </Badge>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Cuota mensual estimada</p>
                <p className="text-3xl font-bold text-primary">{fmt(results.monthly)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Crédito hipotecario</p>
                  <p className="font-semibold">{fmt(results.loan)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total intereses</p>
                  <p className="font-semibold text-amber-600">{fmt(results.totalInterest)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total a pagar</p>
                  <p className="font-semibold">{fmt(results.total)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">CAE estimado <Info className="h-3 w-3" /></p>
                  <p className="font-semibold text-primary">{results.cae}%</p>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Renta líquida mínima sugerida (regla 30%)</p>
                <p className="text-lg font-bold text-foreground">{fmt(results.requiredIncome)}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rates" className="mt-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Tasas referenciales de bancos chilenos para créditos hipotecarios (UF + spread):
              </p>
              {BANK_RATES.map(b => (
                <div
                  key={b.bank}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => { setSelectedBank(b.bank); setCustomRate(null); }}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{b.bank}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedBank === b.bank ? 'default' : 'outline'}>
                      {b.rate}% anual
                    </Badge>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-3">
                * Tasas referenciales aproximadas. Consulte directamente con cada banco.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
