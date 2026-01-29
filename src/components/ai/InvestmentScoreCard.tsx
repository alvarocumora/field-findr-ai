import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  MapPin,
  DollarSign,
  Sparkles,
  Scale,
  Building,
  Droplets
} from 'lucide-react';
import type { InvestmentAnalysis } from '@/hooks/useInvestmentCopilot';

interface InvestmentScoreCardProps {
  analysis: InvestmentAnalysis;
}

const categoryIcons: Record<string, React.ReactNode> = {
  ubicacion: <MapPin className="h-4 w-4" />,
  precio: <DollarSign className="h-4 w-4" />,
  potencial: <Sparkles className="h-4 w-4" />,
  legalidad: <Scale className="h-4 w-4" />,
  infraestructura: <Building className="h-4 w-4" />,
  liquidez: <Droplets className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  ubicacion: 'Ubicación',
  precio: 'Precio',
  potencial: 'Potencial',
  legalidad: 'Legalidad',
  infraestructura: 'Infraestructura',
  liquidez: 'Liquidez',
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
};

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getRiskBadge = (risk: string) => {
  switch (risk) {
    case 'bajo':
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Riesgo Bajo</Badge>;
    case 'medio':
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Riesgo Medio</Badge>;
    case 'alto':
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Riesgo Alto</Badge>;
    default:
      return null;
  }
};

export const InvestmentScoreCard = ({ analysis }: InvestmentScoreCardProps) => {
  const { investmentScore, scoreBreakdown, riskLevel, riskFactors, opportunities, plusvaliaProjection, recommendation, idealBuyerProfile } = analysis;

  return (
    <div className="space-y-4">
      {/* Main Score */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${getScoreBg(investmentScore)}`} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Score de Inversión
            </CardTitle>
            {getRiskBadge(riskLevel)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-5xl font-bold ${getScoreColor(investmentScore)}`}>
              {investmentScore}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="block">de 100 puntos</span>
              <span className="block text-xs">
                {investmentScore >= 80 ? 'Excelente inversión' : 
                 investmentScore >= 60 ? 'Buena oportunidad' : 
                 investmentScore >= 40 ? 'Requiere análisis' : 'Alto riesgo'}
              </span>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Desglose de Puntuación</h4>
            <TooltipProvider>
              {Object.entries(scoreBreakdown).map(([key, value]) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-help">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {categoryIcons[key]}
                          {categoryLabels[key]}
                        </span>
                        <span className={getScoreColor(value.score)}>{value.score}/100</span>
                      </div>
                      <Progress value={value.score} className="h-1.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">{value.comentario}</p>
                    <p className="text-xs text-muted-foreground mt-1">Peso: {(value.peso * 100).toFixed(0)}%</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Plusvalía Projection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Proyección de Plusvalía
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '1 año', value: plusvaliaProjection.year1 },
              { label: '3 años', value: plusvaliaProjection.year3 },
              { label: '5 años', value: plusvaliaProjection.year5 },
              { label: '10 años', value: plusvaliaProjection.year10 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center p-2 bg-muted/50 rounded-lg">
                <div className={`text-lg font-bold ${value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {value >= 0 ? '+' : ''}{value}%
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              Factores de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {riskFactors.map((factor, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <TrendingDown className="h-3 w-3 mt-0.5 text-red-400 shrink-0" />
                  {factor}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-500">
              <CheckCircle className="h-4 w-4" />
              Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {opportunities.map((opp, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <TrendingUp className="h-3 w-3 mt-0.5 text-green-400 shrink-0" />
                  {opp}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Recomendación del Copiloto
          </h4>
          <p className="text-sm text-muted-foreground">{recommendation}</p>
          <div className="mt-3 pt-3 border-t border-border">
            <h5 className="text-xs font-medium text-muted-foreground mb-1">Perfil de Comprador Ideal:</h5>
            <p className="text-xs">{idealBuyerProfile}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
