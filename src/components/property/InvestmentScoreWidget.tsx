import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestmentScoreWidgetProps {
  price: number;
  area_m2: number | null;
  area_ha: number | null;
  legal_status: string | null;
  utilities: { water?: boolean; electricity?: string; road_access?: string };
  subdivision_eligible: boolean | null;
  zoning: string | null;
  tags: string[];
}

const computeScore = (props: InvestmentScoreWidgetProps) => {
  let score = 40; // base
  const factors: { label: string; impact: number; status: 'positive' | 'negative' | 'neutral' }[] = [];

  // Legal
  if (props.legal_status === 'verified') {
    score += 15;
    factors.push({ label: 'Situación legal verificada', impact: 15, status: 'positive' });
  } else {
    factors.push({ label: 'Legal pendiente de verificar', impact: -5, status: 'negative' });
    score -= 5;
  }

  // Utilities
  if (props.utilities?.water) {
    score += 10;
    factors.push({ label: 'Agua disponible', impact: 10, status: 'positive' });
  } else {
    factors.push({ label: 'Sin agua confirmada', impact: -5, status: 'negative' });
    score -= 5;
  }

  if (props.utilities?.electricity) {
    score += 8;
    factors.push({ label: 'Electricidad disponible', impact: 8, status: 'positive' });
  }

  if (props.utilities?.road_access) {
    score += 7;
    factors.push({ label: 'Acceso vial confirmado', impact: 7, status: 'positive' });
  }

  // Subdivision
  if (props.subdivision_eligible) {
    score += 12;
    factors.push({ label: 'Apto para subdivisión', impact: 12, status: 'positive' });
  }

  // Area bonus
  if (props.area_ha && props.area_ha >= 5) {
    score += 8;
    factors.push({ label: 'Gran superficie (>5 ha)', impact: 8, status: 'positive' });
  }

  // Price per m2
  if (props.area_m2 && props.area_m2 > 0) {
    const ppm2 = props.price / props.area_m2;
    if (ppm2 < 5000) {
      score += 10;
      factors.push({ label: 'Precio/m² muy competitivo', impact: 10, status: 'positive' });
    } else if (ppm2 < 15000) {
      score += 5;
      factors.push({ label: 'Precio/m² razonable', impact: 5, status: 'positive' });
    }
  }

  return { score: Math.min(100, Math.max(0, score)), factors };
};

const getScoreColor = (score: number) => {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excelente';
  if (score >= 65) return 'Bueno';
  if (score >= 50) return 'Moderado';
  return 'Bajo';
};

const getProgressColor = (score: number) => {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
};

const InvestmentScoreWidget = (props: InvestmentScoreWidgetProps) => {
  const { score, factors } = computeScore(props);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Investment Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(score / 100) * 176} 176`}
                strokeLinecap="round"
                className={getScoreColor(score)}
              />
            </svg>
            <span className={cn("text-xl font-bold", getScoreColor(score))}>{score}</span>
          </div>
          <div>
            <p className={cn("text-sm font-semibold", getScoreColor(score))}>
              {getScoreLabel(score)}
            </p>
            <p className="text-[11px] text-muted-foreground">Potencial de inversión</p>
          </div>
        </div>

        {/* Factors */}
        <div className="space-y-1.5">
          {factors.slice(0, 5).map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              {f.status === 'positive' ? (
                <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
              ) : f.status === 'negative' ? (
                <AlertTriangle className="h-3 w-3 text-yellow-400 flex-shrink-0" />
              ) : (
                <Info className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-muted-foreground">{f.label}</span>
              <span className={cn(
                "ml-auto font-medium",
                f.impact > 0 ? 'text-green-400' : 'text-yellow-400'
              )}>
                {f.impact > 0 ? '+' : ''}{f.impact}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentScoreWidget;
