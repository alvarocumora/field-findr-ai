import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Target, 
  FileCheck, 
  TrendingUp, 
  BarChart3,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useInvestmentCopilot } from '@/hooks/useInvestmentCopilot';
import { InvestmentScoreCard } from './InvestmentScoreCard';
import { DueDiligenceChecklist } from './DueDiligenceChecklist';

interface PropertyData {
  id: string;
  title: string;
  price: number;
  area_m2?: number | null;
  area_ha?: number | null;
  location: string;
  region?: string | null;
  type: string;
  zoning?: string | null;
  legal_status?: string | null;
  utilities?: Record<string, boolean> | null;
  subdivision_eligible?: boolean | null;
  tags?: string[] | null;
}

interface AIInvestmentCopilotProps {
  property: PropertyData;
  trigger?: React.ReactNode;
}

export const AIInvestmentCopilot = ({ property, trigger }: AIInvestmentCopilotProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('investment');
  
  const {
    investmentAnalysis,
    dueDiligence,
    marketComparison,
    roiProjection,
    isLoading,
    activeAnalysis,
    analyzeInvestment,
    getDueDiligence,
    getMarketComparison,
    getROIProjection,
  } = useInvestmentCopilot();

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    
    // Auto-fetch data when switching tabs if not already loaded
    switch (tab) {
      case 'investment':
        if (!investmentAnalysis) await analyzeInvestment(property);
        break;
      case 'due-diligence':
        if (!dueDiligence) await getDueDiligence(property);
        break;
      case 'market':
        if (!marketComparison) await getMarketComparison(property);
        break;
      case 'roi':
        if (!roiProjection) await getROIProjection(property);
        break;
    }
  };

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !investmentAnalysis) {
      await analyzeInvestment(property);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button className="gap-2" variant="default">
            <Brain className="h-4 w-4" />
            Analizar Inversión con IA
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Copiloto de Inversión IA
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{property.title}</p>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-4 shrink-0">
            <TabsTrigger value="investment" className="text-xs gap-1">
              <Target className="h-3 w-3" />
              <span className="hidden sm:inline">Score</span>
            </TabsTrigger>
            <TabsTrigger value="due-diligence" className="text-xs gap-1">
              <FileCheck className="h-3 w-3" />
              <span className="hidden sm:inline">Due Diligence</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              <span className="hidden sm:inline">Mercado</span>
            </TabsTrigger>
            <TabsTrigger value="roi" className="text-xs gap-1">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline">ROI</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="investment" className="m-0 pr-4">
              {isLoading && activeAnalysis === 'investment' ? (
                <LoadingState message="Analizando inversión..." />
              ) : investmentAnalysis ? (
                <InvestmentScoreCard analysis={investmentAnalysis} />
              ) : (
                <EmptyState 
                  message="Haz clic para analizar esta propiedad"
                  onAction={() => analyzeInvestment(property)}
                />
              )}
            </TabsContent>

            <TabsContent value="due-diligence" className="m-0 pr-4">
              {isLoading && activeAnalysis === 'due-diligence' ? (
                <LoadingState message="Generando checklist..." />
              ) : dueDiligence ? (
                <DueDiligenceChecklist result={dueDiligence} />
              ) : (
                <EmptyState 
                  message="Genera un checklist de due diligence personalizado"
                  onAction={() => getDueDiligence(property)}
                />
              )}
            </TabsContent>

            <TabsContent value="market" className="m-0 pr-4">
              {isLoading && activeAnalysis === 'market' ? (
                <LoadingState message="Analizando mercado..." />
              ) : marketComparison ? (
                <MarketComparisonCard data={marketComparison} />
              ) : (
                <EmptyState 
                  message="Analiza el posicionamiento de mercado"
                  onAction={() => getMarketComparison(property)}
                />
              )}
            </TabsContent>

            <TabsContent value="roi" className="m-0 pr-4">
              {isLoading && activeAnalysis === 'roi' ? (
                <LoadingState message="Proyectando ROI..." />
              ) : roiProjection ? (
                <ROIProjectionCard data={roiProjection} />
              ) : (
                <EmptyState 
                  message="Proyecta el retorno de inversión"
                  onAction={() => getROIProjection(property)}
                />
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const LoadingState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-sm text-muted-foreground">{message}</p>
    <p className="text-xs text-muted-foreground mt-1">Esto puede tomar unos segundos...</p>
  </div>
);

const EmptyState = ({ message, onAction }: { message: string; onAction: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Brain className="h-12 w-12 text-muted-foreground mb-4" />
    <p className="text-sm text-muted-foreground mb-4">{message}</p>
    <Button onClick={onAction}>
      <Sparkles className="h-4 w-4 mr-2" />
      Analizar con IA
    </Button>
  </div>
);

// Market Comparison Component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MarketComparison } from '@/hooks/useInvestmentCopilot';

const MarketComparisonCard = ({ data }: { data: MarketComparison }) => (
  <div className="space-y-4">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Análisis de Mercado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">${data.pricePerSqm.toLocaleString('es-CL')}</div>
            <div className="text-xs text-muted-foreground">Precio/m²</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">${data.marketAverage.toLocaleString('es-CL')}</div>
            <div className="text-xs text-muted-foreground">Promedio zona</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm">Posición en mercado:</span>
          <Badge className={
            data.pricePosition === 'por debajo' ? 'bg-green-500/10 text-green-500' :
            data.pricePosition === 'por encima' ? 'bg-red-500/10 text-red-500' :
            'bg-yellow-500/10 text-yellow-500'
          }>
            {data.percentageDiff > 0 ? '+' : ''}{data.percentageDiff}% {data.pricePosition}
          </Badge>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-center">
            <Badge className={
              data.marketTrend === 'alcista' ? 'bg-green-500/10 text-green-500' :
              data.marketTrend === 'bajista' ? 'bg-red-500/10 text-red-500' :
              'bg-yellow-500/10 text-yellow-500'
            }>
              {data.marketTrend}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Tendencia</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-center">
            <Badge className={
              data.demandLevel === 'alta' ? 'bg-green-500/10 text-green-500' :
              data.demandLevel === 'baja' ? 'bg-red-500/10 text-red-500' :
              'bg-yellow-500/10 text-yellow-500'
            }>
              {data.demandLevel}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Demanda</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tiempo estimado de venta:</span>
          <span className="font-medium">{data.timeToSell}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Margen de negociación:</span>
          <span className="font-medium">{data.negotiationRoom}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Propiedades comparables:</span>
          <span className="font-medium">~{data.comparableProperties}</span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground mb-2">Factores estacionales:</p>
        <p className="text-sm">{data.seasonalFactors}</p>
      </CardContent>
    </Card>
  </div>
);

// ROI Projection Component
import type { ROIProjection } from '@/hooks/useInvestmentCopilot';

const ROIProjectionCard = ({ data }: { data: ROIProjection }) => (
  <div className="space-y-4">
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Proyección de ROI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data.scenarios).map(([scenario, values]) => (
            <div key={scenario} className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">{scenario}</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    5 años: {values.roi5Years > 0 ? '+' : ''}{values.roi5Years}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    10 años: {values.roi10Years > 0 ? '+' : ''}{values.roi10Years}%
                  </Badge>
                </div>
              </div>
              <ul className="space-y-1">
                {values.assumptions.slice(0, 2).map((assumption, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {assumption}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Análisis de Flujo de Caja</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Costos de mantención (anual):</span>
            <span className="text-red-500">-${data.cashFlowAnalysis.holdingCosts.toLocaleString('es-CL')}</span>
          </div>
          {data.cashFlowAnalysis.potentialIncome && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ingreso potencial:</span>
              <span className="text-green-500">+${data.cashFlowAnalysis.potentialIncome.toLocaleString('es-CL')}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t">
            <span className="font-medium">Flujo neto:</span>
            <span className={data.cashFlowAnalysis.netCashFlow >= 0 ? 'text-green-500' : 'text-red-500'}>
              ${data.cashFlowAnalysis.netCashFlow.toLocaleString('es-CL')}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Punto de equilibrio: {data.breakEvenPoint}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Estrategias de Salida</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.exitStrategies.map((strategy, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{strategy.strategy}</span>
                <Badge className={
                  strategy.risk === 'bajo' ? 'bg-green-500/10 text-green-500' :
                  strategy.risk === 'alto' ? 'bg-red-500/10 text-red-500' :
                  'bg-yellow-500/10 text-yellow-500'
                }>
                  {strategy.risk}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{strategy.description}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <span>Retorno: <span className="text-green-500">+{strategy.expectedReturn}%</span></span>
                <span>Plazo: {strategy.timeframe}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-4">
        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Recomendación
        </h4>
        <p className="text-sm text-muted-foreground">{data.recommendation}</p>
      </CardContent>
    </Card>
  </div>
);
