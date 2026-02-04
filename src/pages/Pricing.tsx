import { Check, Sparkles, Building2, Rocket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useCurrentPlan, useCreateCheckout, PLAN_DETAILS, PlanType } from '@/hooks/useSubscription';
import PublicLayout from '@/components/layouts/PublicLayout';

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan: currentPlan, isLoading: planLoading } = useCurrentPlan();
  const { mutate: createCheckout, isPending } = useCreateCheckout();

  const handleSelectPlan = (planId: PlanType) => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }

    if (planId === 'free') {
      return; // Already on free plan
    }

    createCheckout(planId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(price);
  };

  const plans = [
    {
      ...PLAN_DETAILS.free,
      icon: Sparkles,
      popular: false,
      buttonText: currentPlan === 'free' ? 'Plan Actual' : 'Comenzar Gratis'
    },
    {
      ...PLAN_DETAILS.professional,
      icon: Building2,
      popular: true,
      buttonText: currentPlan === 'professional' ? 'Plan Actual' : 'Suscribirse'
    },
    {
      ...PLAN_DETAILS.enterprise,
      icon: Rocket,
      popular: false,
      buttonText: currentPlan === 'enterprise' ? 'Plan Actual' : 'Suscribirse'
    }
  ];

  return (
    <PublicLayout>
      <div className="container py-16 px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Planes y Precios
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Elige el plan perfecto para ti
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Desde particulares hasta empresas, tenemos el plan ideal para potenciar
            tu negocio inmobiliario con inteligencia artificial
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border'
              }`}
            >
              {plan.popular && (
                <Badge 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary"
                >
                  Más Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto p-3 rounded-full mb-4 ${
                  plan.popular 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <plan.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === 0 ? 'Gratis' : formatPrice(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/mes</span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={planLoading || isPending || currentPlan === plan.id}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Necesitas algo más?</h2>
          <p className="text-muted-foreground mb-6">
            Contáctanos para planes corporativos personalizados con funcionalidades exclusivas
          </p>
          <Button variant="outline" size="lg">
            Contactar Ventas
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
