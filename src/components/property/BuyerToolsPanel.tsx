import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calculator, TrendingUp, Wallet } from 'lucide-react';
import { computeFinancing, computeInvestment } from '@/lib/buyerTools';

interface BuyerToolsPanelProps {
  price: number;
  areaM2?: number | null;
}

const clp = (v: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Math.round(v || 0));

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={strong ? 'font-bold text-primary' : 'font-medium text-foreground'}>{value}</span>
  </div>
);

/** Client-side buyer tools: financing simulator + investment/ROI projection. */
export const BuyerToolsPanel = ({ price, areaM2 }: BuyerToolsPanelProps) => {
  // Financing state
  const [downPct, setDownPct] = useState(20);
  const [months, setMonths] = useState(24);
  const [rate, setRate] = useState(12);
  // Investment state
  const [appr, setAppr] = useState(8);
  const [years, setYears] = useState(5);

  const fin = useMemo(
    () => computeFinancing({ price, downPct, months, annualRatePct: rate }),
    [price, downPct, months, rate],
  );
  const inv = useMemo(
    () => computeInvestment({ price, appreciationPct: appr, years, areaM2: areaM2 ?? undefined, minLotM2: 5000 }),
    [price, appr, years, areaM2],
  );

  if (!price || price <= 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Herramientas para tu decisión
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="financiamiento">
          <TabsList className="grid grid-cols-2 h-8 mb-4">
            <TabsTrigger value="financiamiento" className="text-xs gap-1"><Wallet className="h-3 w-3" />Financiamiento</TabsTrigger>
            <TabsTrigger value="inversion" className="text-xs gap-1"><TrendingUp className="h-3 w-3" />Inversión</TabsTrigger>
          </TabsList>

          <TabsContent value="financiamiento" className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <Label>Pie</Label><span className="text-muted-foreground">{downPct}% · {clp(fin.downPayment)}</span>
                </div>
                <Slider value={[downPct]} min={0} max={80} step={5} onValueChange={([v]) => setDownPct(v)} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <Label>Plazo</Label><span className="text-muted-foreground">{months} cuotas</span>
                </div>
                <Slider value={[months]} min={6} max={120} step={6} onValueChange={([v]) => setMonths(v)} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <Label>Tasa anual</Label><span className="text-muted-foreground">{rate}%</span>
                </div>
                <Slider value={[rate]} min={0} max={30} step={0.5} onValueChange={([v]) => setRate(v)} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <Row label="Monto financiado" value={clp(fin.principal)} />
              <Row label="Cuota mensual" value={clp(fin.monthlyPayment)} strong />
              <Row label="Intereses totales" value={clp(fin.totalInterest)} />
              <Row label="Total a pagar" value={clp(fin.totalPaid)} />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Simulación referencial (sistema francés, tasa fija). No constituye una oferta de crédito.
            </p>
          </TabsContent>

          <TabsContent value="inversion" className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <Label>Plusvalía anual estimada</Label><span className="text-muted-foreground">{appr}%</span>
                </div>
                <Slider value={[appr]} min={0} max={20} step={1} onValueChange={([v]) => setAppr(v)} />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <Label>Horizonte</Label><span className="text-muted-foreground">{years} años</span>
                </div>
                <Slider value={[years]} min={1} max={20} step={1} onValueChange={([v]) => setYears(v)} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <Row label={`Valor proyectado (${years} años)`} value={clp(inv.projectedValue)} strong />
              <Row label="Plusvalía acumulada" value={clp(inv.capitalGain)} />
              <Row label="ROI total" value={`${inv.totalRoiPct.toFixed(1)}%`} />
              <Row label="ROI anualizado" value={`${inv.annualRoiPct.toFixed(1)}%`} />
              {inv.subdivisionLots !== null && inv.subdivisionLots > 1 && (
                <Row label="Potencial de subdivisión" value={`~${inv.subdivisionLots} lotes`} />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Proyección referencial basada en supuestos que tú ajustas. Rentabilidades pasadas no garantizan resultados futuros.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BuyerToolsPanel;
