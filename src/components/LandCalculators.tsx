import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Percent,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import Layout from './Layout';

const LandCalculators = () => {
  // ROI Calculator State
  const [roiInputs, setRoiInputs] = useState({
    purchasePrice: 0,
    urbanizationCost: 0,
    salePricePerLot: 0,
    totalLots: 0,
    timeMonths: 0
  });

  // Development Cost Calculator State
  const [devInputs, setDevInputs] = useState({
    landArea: 0,
    lotSize: 0,
    roadCostPerMeter: 0,
    electricityCostPerLot: 0,
    waterCostPerLot: 0
  });

  // Profitability Calculator State
  const [profitInputs, setProfitInputs] = useState({
    landType: 'agricultural',
    hectares: 0,
    yieldPerHa: 0,
    pricePerUnit: 0,
    annualCosts: 0
  });

  const calculateROI = () => {
    const totalInvestment = roiInputs.purchasePrice + roiInputs.urbanizationCost;
    const totalRevenue = roiInputs.salePricePerLot * roiInputs.totalLots;
    const profit = totalRevenue - totalInvestment;
    const roi = (profit / totalInvestment) * 100;
    const annualROI = (roi / roiInputs.timeMonths) * 12;
    
    return {
      totalInvestment,
      totalRevenue,
      profit,
      roi: roi.toFixed(2),
      annualROI: annualROI.toFixed(2),
      profitPerLot: (profit / roiInputs.totalLots).toFixed(0)
    };
  };

  const calculateDevelopmentCost = () => {
    const totalLots = Math.floor(devInputs.landArea / devInputs.lotSize);
    const roadMeters = Math.sqrt(devInputs.landArea) * 1.5;
    const roadCost = roadMeters * devInputs.roadCostPerMeter;
    const electricityCost = totalLots * devInputs.electricityCostPerLot;
    const waterCost = totalLots * devInputs.waterCostPerLot;
    const totalCost = roadCost + electricityCost + waterCost;
    const costPerLot = totalCost / totalLots;

    return {
      totalLots,
      roadMeters: roadMeters.toFixed(0),
      roadCost: roadCost.toFixed(0),
      electricityCost: electricityCost.toFixed(0),
      waterCost: waterCost.toFixed(0),
      totalCost: totalCost.toFixed(0),
      costPerLot: costPerLot.toFixed(0)
    };
  };

  const calculateProfitability = () => {
    const totalYield = profitInputs.hectares * profitInputs.yieldPerHa;
    const revenue = totalYield * profitInputs.pricePerUnit;
    const profit = revenue - profitInputs.annualCosts;
    const profitMargin = (profit / revenue) * 100;
    const profitPerHa = profit / profitInputs.hectares;

    return {
      totalYield: totalYield.toFixed(0),
      revenue: revenue.toFixed(0),
      profit: profit.toFixed(0),
      profitMargin: profitMargin.toFixed(2),
      profitPerHa: profitPerHa.toFixed(0)
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const roiResults = calculateROI();
  const devResults = calculateDevelopmentCost();
  const profitResults = calculateProfitability();

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Calculadoras Inteligentes</h1>
            <p className="text-muted-foreground mt-1">Herramientas financieras para inversión en parcelas</p>
          </div>
          <Badge className="bg-gradient-primary text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
        </div>

        <Tabs defaultValue="roi" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roi">ROI Loteo</TabsTrigger>
            <TabsTrigger value="development">Costos Urbanización</TabsTrigger>
            <TabsTrigger value="profitability">Rentabilidad Agrícola</TabsTrigger>
          </TabsList>

          {/* ROI Calculator */}
          <TabsContent value="roi" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Calculadora de ROI
                  </CardTitle>
                  <CardDescription>Calcula el retorno de inversión de tu proyecto de loteo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Precio de Compra Terreno</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={roiInputs.purchasePrice || ''}
                      onChange={(e) => setRoiInputs({...roiInputs, purchasePrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo de Urbanización</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={roiInputs.urbanizationCost || ''}
                      onChange={(e) => setRoiInputs({...roiInputs, urbanizationCost: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio de Venta por Lote</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={roiInputs.salePricePerLot || ''}
                      onChange={(e) => setRoiInputs({...roiInputs, salePricePerLot: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de Lotes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={roiInputs.totalLots || ''}
                      onChange={(e) => setRoiInputs({...roiInputs, totalLots: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiempo del Proyecto (meses)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={roiInputs.timeMonths || ''}
                      onChange={(e) => setRoiInputs({...roiInputs, timeMonths: Number(e.target.value)})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Resultados
                  </CardTitle>
                  <CardDescription>Análisis financiero del proyecto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Inversión Total</span>
                      <span className="font-semibold">{formatCurrency(roiResults.totalInvestment)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Ingreso Total</span>
                      <span className="font-semibold text-green-600">{formatCurrency(roiResults.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Utilidad Neta</span>
                      <span className="font-bold text-lg text-primary">{formatCurrency(roiResults.profit)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">ROI Total</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{roiResults.roi}%</span>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">ROI Anual</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">{roiResults.annualROI}%</span>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Utilidad por Lote</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(Number(roiResults.profitPerLot))} por unidad vendida
                        </p>
                      </div>
                    </div>
                  </div>

                  {Number(roiResults.roi) > 30 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">Excelente Inversión</p>
                          <p className="text-xs text-green-700">
                            El ROI proyectado supera el 30%, indicando una oportunidad altamente rentable.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Development Cost Calculator */}
          <TabsContent value="development" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Costos de Urbanización</CardTitle>
                  <CardDescription>Calcula los costos de desarrollo del loteo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Superficie Total (m²)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={devInputs.landArea || ''}
                      onChange={(e) => setDevInputs({...devInputs, landArea: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tamaño por Lote (m²)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={devInputs.lotSize || ''}
                      onChange={(e) => setDevInputs({...devInputs, lotSize: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo Camino por Metro</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={devInputs.roadCostPerMeter || ''}
                      onChange={(e) => setDevInputs({...devInputs, roadCostPerMeter: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo Electricidad por Lote</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={devInputs.electricityCostPerLot || ''}
                      onChange={(e) => setDevInputs({...devInputs, electricityCostPerLot: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo Agua por Lote</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={devInputs.waterCostPerLot || ''}
                      onChange={(e) => setDevInputs({...devInputs, waterCostPerLot: Number(e.target.value)})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Costos</CardTitle>
                  <CardDescription>Desglose completo del proyecto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total de Lotes</div>
                    <div className="text-3xl font-bold text-primary">{devResults.totalLots}</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm">Caminos ({devResults.roadMeters}m)</span>
                      <span className="font-semibold">{formatCurrency(Number(devResults.roadCost))}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm">Electricidad</span>
                      <span className="font-semibold">{formatCurrency(Number(devResults.electricityCost))}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm">Agua Potable</span>
                      <span className="font-semibold">{formatCurrency(Number(devResults.waterCost))}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Costo Total</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(Number(devResults.totalCost))}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Costo por Lote</span>
                      <span className="font-semibold">{formatCurrency(Number(devResults.costPerLot))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agricultural Profitability Calculator */}
          <TabsContent value="profitability" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rentabilidad Agrícola</CardTitle>
                  <CardDescription>Calcula el potencial de ingresos por cultivo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Cultivo</Label>
                    <Select value={profitInputs.landType} onValueChange={(value) => setProfitInputs({...profitInputs, landType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agricultural">Uva Vinífera</SelectItem>
                        <SelectItem value="fruits">Paltos</SelectItem>
                        <SelectItem value="vegetables">Berries</SelectItem>
                        <SelectItem value="cereals">Trigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hectáreas</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={profitInputs.hectares || ''}
                      onChange={(e) => setProfitInputs({...profitInputs, hectares: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rendimiento por Hectárea (kg)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={profitInputs.yieldPerHa || ''}
                      onChange={(e) => setProfitInputs({...profitInputs, yieldPerHa: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio por Kg</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={profitInputs.pricePerUnit || ''}
                      onChange={(e) => setProfitInputs({...profitInputs, pricePerUnit: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costos Anuales</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={profitInputs.annualCosts || ''}
                      onChange={(e) => setProfitInputs({...profitInputs, annualCosts: Number(e.target.value)})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proyección Anual</CardTitle>
                  <CardDescription>Estimación de rentabilidad</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Producción Total</div>
                    <div className="text-2xl font-bold">{profitResults.totalYield} kg</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm">Ingresos</span>
                      <span className="font-semibold text-green-600">{formatCurrency(Number(profitResults.revenue))}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm">Margen de Utilidad</span>
                      <span className="font-semibold">{profitResults.profitMargin}%</span>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Utilidad Anual</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(Number(profitResults.profit))}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Utilidad por Hectárea</span>
                      <span className="font-semibold">{formatCurrency(Number(profitResults.profitPerHa))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LandCalculators;
