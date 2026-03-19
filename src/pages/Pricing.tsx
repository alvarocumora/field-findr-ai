import { useState } from 'react';
import { Check, Sparkles, Building2, Rocket, Loader2, TrendingUp, Zap, Globe, Users, Star, Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  useCurrentPlan, useCreateCheckout,
  PLAN_DETAILS, LATAM_PRICES, LISTING_ADDONS, ADDON_PRICES,
  PlanType, AddOnType,
} from '@/hooks/useSubscription';
import PublicLayout from '@/components/layouts/PublicLayout';

const CURRENCIES = [
  { code: 'UF', label: 'UF', country: 'Chile (UF)', flag: '🇨🇱' },
  { code: 'CLP', label: 'CLP $', country: 'Chile', flag: '🇨🇱' },
  { code: 'USD', label: 'USD $', country: 'Internacional', flag: '🌎' },
  { code: 'MXN', label: 'MXN $', country: 'México', flag: '🇲🇽' },
  { code: 'COP', label: 'COP $', country: 'Colombia', flag: '🇨🇴' },
  { code: 'ARS', label: 'ARS $', country: 'Argentina', flag: '🇦🇷' },
];

const PLAN_ICONS: Record<PlanType, React.ElementType> = {
  free: Sparkles,
  starter: Building2,
  growth: TrendingUp,
  scale: Zap,
  enterprise: Rocket,
};

const ADDON_ICONS: Record<AddOnType, React.ElementType> = {
  basic: Eye,
  featured: Star,
  super_featured: Crown,
};

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan: currentPlan, isLoading: planLoading } = useCurrentPlan();
  const { mutate: createCheckout, isPending } = useCreateCheckout();
  const [currency, setCurrency] = useState('UF');

  const handleSelectPlan = (planId: PlanType) => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }
    if (planId === 'free') return;
    createCheckout(planId);
  };

  const formatPrice = (price: number, curr: string) => {
    if (price === 0) return 'Gratis';
    if (curr === 'UF') return `UF ${price.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    if (curr === 'USD') return `US$${price}`;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(price);
  };

  const plans = (Object.keys(PLAN_DETAILS) as PlanType[]).map((key) => {
    const plan = PLAN_DETAILS[key];
    const Icon = PLAN_ICONS[key];
    const price = LATAM_PRICES[currency]?.[key] ?? plan.price;
    return { ...plan, price, icon: Icon, isCurrent: currentPlan === key };
  });

  return (
    <PublicLayout>
      <div className="container py-16 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4 font-swiss tracking-widest text-xs">
            PLANES COMERCIALES LATAM
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Escala tu operación inmobiliaria
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Planes diseñados para corredores, desarrolladores e inmobiliarias en Chile, Argentina, Colombia y México.
            Paga por la cantidad de lotes que gestionas.
          </p>
        </div>

        {/* Currency selector */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 bg-muted rounded-lg p-1">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  currency === c.code
                    ? 'bg-background text-foreground shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.flag} {c.code}
              </button>
            ))}
          </div>
        </div>

        {/* Role tabs */}
        <Tabs defaultValue="agent" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="buyer" className="gap-1">
              <Users className="h-3.5 w-3.5" />
              Comprador
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Agente
            </TabsTrigger>
            <TabsTrigger value="developer" className="gap-1">
              <Rocket className="h-3.5 w-3.5" />
              Inmobiliaria
            </TabsTrigger>
          </TabsList>

          {/* Buyer tab */}
          <TabsContent value="buyer">
            <div className="max-w-md mx-auto">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto p-3 rounded-full bg-primary/10 mb-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Acceso Gratuito</CardTitle>
                  <CardDescription className="text-base">
                    Explora, compara y encuentra tu terreno ideal sin costo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      'Búsqueda ilimitada en marketplace',
                      'Mapa interactivo con terrenos',
                      'Comparador de lotes',
                      'Alertas de oportunidades',
                      'Cotizador y simulador de cuotas',
                      'Reserva online con garantía',
                      'Mi Terreno — panel de comprador',
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" size="lg" variant="outline" onClick={() => navigate('/explorar')}>
                    Explorar Terrenos
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Agent tab */}
          <TabsContent value="agent">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.filter((p) => p.id !== 'enterprise').map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all ${
                    plan.highlighted
                      ? 'border-primary shadow-xl ring-2 ring-primary/20 scale-[1.02]'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Más Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-3">
                    <div className={`mx-auto p-3 rounded-full mb-3 ${plan.highlighted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <plan.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">
                        {formatPrice(plan.price, currency)}
                      </span>
                      {plan.price > 0 && <span className="text-muted-foreground">/mes</span>}
                    </CardDescription>
                    {plan.maxUnits && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Hasta <strong className="text-foreground">{plan.maxUnits} lotes</strong> · {plan.maxProjects} proyecto{plan.maxProjects > 1 ? 's' : ''}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2.5">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-xs">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={planLoading || isPending || plan.isCurrent}
                    >
                      {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {plan.isCurrent ? 'Plan Actual' : plan.price === 0 ? 'Comenzar Gratis' : 'Suscribirse'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Developer / Inmobiliaria tab */}
          <TabsContent value="developer">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.filter((p) => p.id === 'scale' || p.id === 'enterprise').map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.id === 'enterprise'
                      ? 'border-primary shadow-xl ring-2 ring-primary/20'
                      : 'border-border'
                  }`}
                >
                  <CardHeader className="text-center pb-3">
                    <div className="mx-auto p-3 rounded-full mb-3 bg-primary/10 text-primary">
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-4xl font-bold text-foreground">
                        {plan.id === 'enterprise' ? 'Contactar' : formatPrice(plan.price, currency)}
                      </span>
                      {plan.price > 0 && plan.id !== 'enterprise' && (
                        <span className="text-muted-foreground">/mes</span>
                      )}
                    </CardDescription>
                    {plan.maxUnits && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Hasta <strong className="text-foreground">{plan.maxUnits} lotes</strong> · {plan.maxProjects} proyectos
                      </p>
                    )}
                    {!plan.maxUnits && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <strong className="text-foreground">Lotes ilimitados</strong> · Proyectos ilimitados
                      </p>
                    )}
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
                      variant={plan.id === 'enterprise' ? 'default' : 'outline'}
                      size="lg"
                      onClick={() =>
                        plan.id === 'enterprise'
                          ? navigate('/contacto')
                          : handleSelectPlan(plan.id)
                      }
                      disabled={planLoading || isPending || plan.isCurrent}
                    >
                      {plan.isCurrent ? 'Plan Actual' : plan.id === 'enterprise' ? 'Contactar Ventas' : 'Suscribirse'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Featured Listings Add-On Section ── */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
              <Star className="h-3 w-3 mr-1" /> ADD-ON DE VISIBILIDAD
            </Badge>
            <h2 className="text-3xl font-bold mb-3 text-foreground">
              Publicaciones Destacadas
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Aumenta la exposición de tus terrenos con visibilidad premium. Precio por publicación, por mes — compatible con cualquier plan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {LISTING_ADDONS.map((addon) => {
              const Icon = ADDON_ICONS[addon.id];
              const price = ADDON_PRICES[currency]?.[addon.id] ?? 0;
              const isSuper = addon.id === 'super_featured';
              const isFeatured = addon.id === 'featured';

              return (
                <Card
                  key={addon.id}
                  className={`relative flex flex-col transition-all ${
                    isSuper
                      ? 'border-primary shadow-xl ring-2 ring-primary/20'
                      : isFeatured
                        ? 'border-primary/40 shadow-md'
                        : 'border-border'
                  }`}
                >
                  {isSuper && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Máx. Conversión
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-3">
                    <div className={`mx-auto p-3 rounded-full mb-3 ${
                      isSuper ? 'bg-primary/10 text-primary' : isFeatured ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{addon.name}</CardTitle>
                    <CardDescription className="text-xs">{addon.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-foreground">
                        {price === 0 ? 'Incluido' : formatPrice(price, currency)}
                      </span>
                      {price > 0 && <span className="text-muted-foreground text-sm"> /pub/mes</span>}
                    </div>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {addon.multiplier}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-2">
                      {addon.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-xs">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isSuper ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => price === 0 ? undefined : (user ? navigate('/dashboard') : navigate('/auth?redirect=/pricing'))}
                      disabled={price === 0}
                    >
                      {price === 0 ? 'Ya incluido' : 'Activar Add-on'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mt-20 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Comparación de funcionalidades</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Funcionalidad</th>
                  {(Object.keys(PLAN_DETAILS) as PlanType[]).map((key) => (
                    <th key={key} className="text-center py-3 px-3 font-semibold">
                      {PLAN_DETAILS[key].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Precio mensual', values: ['Gratis', formatPrice(LATAM_PRICES[currency].starter, currency), formatPrice(LATAM_PRICES[currency].growth, currency), formatPrice(LATAM_PRICES[currency].scale, currency), formatPrice(LATAM_PRICES[currency].enterprise, currency)] },
                  { label: 'Lotes máx.', values: ['5', '30', '150', '500', '∞'] },
                  { label: 'Proyectos activos', values: ['1', '3', '10', '50', '∞'] },
                  { label: 'Publicaciones marketplace', values: ['3', '20', '100', '500', '∞'] },
                  { label: 'CRM de leads', values: ['—', 'Básico', 'Completo + AI', '✓', '✓'] },
                  { label: 'Reservas online', values: ['—', '—', '✓', '✓', '✓'] },
                  { label: 'Financiamiento directo', values: ['—', '—', '✓', '✓', '✓'] },
                  { label: 'Dashboard multi-proyecto', values: ['—', '—', '✓', '✓', '✓'] },
                  { label: 'Equipo multi-agente', values: ['—', '—', '—', '10', '∞'] },
                  { label: 'API REST + Webhooks', values: ['—', '—', '—', '✓', 'Custom'] },
                  { label: 'White-label', values: ['—', '—', '—', 'Parcial', 'Completo'] },
                  { label: 'Soporte', values: ['Email', 'Email', 'Prioritario', 'Dedicado', 'SLA 24/7'] },
                ].map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 text-foreground font-medium">{row.label}</td>
                    {row.values.map((v, j) => (
                      <td key={j} className="text-center py-3 px-3 text-muted-foreground">
                        {v === '✓' ? (
                          <Check className="h-4 w-4 text-primary mx-auto" />
                        ) : v === '—' ? (
                          <span className="text-muted-foreground/40">—</span>
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Operación a gran escala?</h2>
          <p className="text-muted-foreground mb-6">
            Planes corporativos con SLA, integraciones ERP y soporte dedicado para inmobiliarias con +500 unidades
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate('/contacto')}>
            <Globe className="h-4 w-4 mr-2" />
            Contactar Equipo Comercial
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
