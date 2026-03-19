import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Check, 
  BarChart3, 
  Users, 
  Building2, 
  Sparkles,
  Lock
} from 'lucide-react';
import { PLAN_DETAILS } from '@/hooks/useSubscription';

interface UpgradePromptProps {
  currentPath?: string;
}

const UpgradePrompt = ({ currentPath }: UpgradePromptProps) => {
  const recommendedPlan = PLAN_DETAILS.growth;

  const premiumFeatures = [
    { icon: Building2, label: 'Hasta 150 lotes gestionados' },
    { icon: Sparkles, label: 'CRM completo + Lead Scoring AI' },
    { icon: Users, label: 'Reservas online con pasarela de pago' },
    { icon: BarChart3, label: 'Analytics avanzados + Dashboard multi-proyecto' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full border-primary/20 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Contenido Premium</CardTitle>
          <CardDescription className="text-base">
            Esta sección está disponible solo para usuarios con plan de pago
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Plan highlight */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">{recommendedPlan.name}</span>
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                Recomendado
              </Badge>
            </div>
            <div className="text-2xl font-bold text-foreground mb-1">
              ${professionalPlan.price.toLocaleString('es-CL')}
              <span className="text-sm font-normal text-muted-foreground">/mes</span>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Incluye:</p>
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="space-y-3 pt-2">
            <Button asChild className="w-full" size="lg">
              <Link to="/pricing">
                <Crown className="h-4 w-4 mr-2" />
                Ver Planes Premium
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>

          {/* Current path info */}
          {currentPath && (
            <p className="text-xs text-center text-muted-foreground">
              Intentaste acceder a: <code className="bg-muted px-1 rounded">{currentPath}</code>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpgradePrompt;
