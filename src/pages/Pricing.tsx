import { useState } from 'react';
import { Check, X, Sparkles, Building2, Rocket, Loader2, TrendingUp, Zap, Globe, Users, Star, Crown, Eye, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  useCurrentPlan, useCreateCheckout,
  PLAN_DETAILS, LATAM_PRICES, LATAM_PRICES_ANNUAL, LISTING_ADDONS, ADDON_PRICES,
  PLAN_ORDER_CORREDORES, PLAN_ORDER_INMOBILIARIAS,
  PlanType, AddOnType,
} from '@/hooks/useSubscription';
import { COMPETITOR_BENCHMARK, BENCHMARK_ROWS } from '@/config/pricingBenchmark';
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
  corredor: User,
  corredora: Building2,
  inmobiliaria: TrendingUp,
  grupo: Zap,
  enterprise: Rocket,
  starter: Building2,
  growth: TrendingUp,
  scale: Zap,
};

const ADDON_ICONS: Record<AddOnType, React.ElementType> = {
  basic: Eye,
  featured: Star,
  super_featured: Crown,
};

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { plan: currentPlan, isLoading: planLoading } = useCurrentPlan();
  const { mutate: createCheckout, isPending } = useCreateCheckout();
  const [currency, setCurrency] = useState('UF');
  const [annual, setAnnual] = useState(false);

  const handleSelectPlan = (planId: PlanType) => {
    if (planId === 'enterprise') { navigate('/contacto'); return; }
    if (!user) { navigate('/auth?redirect=/pricing'); return; }
    if (planId === 'free') return;
    createCheckout(planId);
  };

  const formatPrice = (price: number, curr: string) => {
    if (price === 0) return curr === 'UF' ? 'Gratis' : 'Gratis';
    if (curr === 'UF') return `UF ${price.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    if (curr === 'USD') return `US$${price}`;
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: curr, maximumFractionDigits: 0 }).format(price);
  };

  const priceMap = annual ? LATAM_PRICES_ANNUAL[currency] : LATAM_PRICES[currency];

  const renderPlanCard = (planId: PlanType) => {
    const plan = PLAN_DETAILS[planId];
    const Icon = PLAN_ICONS[planId];
    const price = priceMap?.[planId] ?? plan.price;
    const isCurrent = currentPlan === planId;
    const isEnterprise = planId === 'enterprise';

    return (
      <Card
        key={planId}
        className={`relative flex flex-col transition-all ${
          plan.highlighted
            ? 'border-primary shadow-xl ring-2 ring-primary/20 md:scale-[1.02]'
            : 'border-border hover:border-primary/30'
        }`}
      >
        {plan.highlighted && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
            Más popular
          </Badge>
        )}
        <CardHeader className="text-center pb-3">
          <div className={`mx-auto p-3 rounded-full mb-3 ${plan.highlighted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <p className="text-xs text-muted-foreground min-h-[2.5rem]">{plan.target}</p>
          <CardDescription>
            {isEnterprise ? (
              <span className="text-3xl font-bold text-foreground">A medida</span>
            ) : (
              <>
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(price, currency)}
                </span>
                {price > 0 && (
                  <span className="text-muted-foreground text-sm">/mes{annual ? ' (anual)' : ''}</span>
                )}
              </>
            )}
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {plan.maxUnits && (
              <Badge variant="secondary" className="text-[10px]">
                {plan.maxUnits} publicaciones
              </Badge>
            )}
            {plan.includedFeatured > 0 && plan.includedFeatured < 9999 && (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                <Star className="h-2.5 w-2.5 mr-0.5" /> {plan.includedFeatured} destacadas
              </Badge>
            )}
            {plan.includedSuperFeatured > 0 && plan.includedSuperFeatured < 9999 && (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                <Crown className="h-2.5 w-2.5 mr-0.5" /> {plan.includedSuperFeatured} super
              </Badge>
            )}
          </div>
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
            variant={plan.highlighted || isEnterprise ? 'default' : 'outline'}
            size="lg"
            onClick={() => handleSelectPlan(planId)}
            disabled={planLoading || isPending || isCurrent}
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isCurrent ? 'Plan actual' : (plan.ctaLabel || 'Suscribirse')}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <PublicLayout>
      <div className="container py-16 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <Badge variant="secondary" className="mb-4 font-swiss tracking-widest text-xs">
            PLANES COMERCIALES · LATAM
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Planes para corredoras e inmobiliarias
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Publica, gestiona y cierra ventas con IA, mapa 3D, CRM y financiamiento directo.
            Sin comisiones por venta.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-primary/40 text-primary">✨ Primer mes 50% OFF</Badge>
            <Badge variant="outline">Sin permanencia</Badge>
            <Badge variant="outline">Cambia de plan cuando quieras</Badge>
          </div>
        </div>

        {/* Currency + billing toggle */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
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
          <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-2">
            <span className={`text-sm ${!annual ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Mensual</span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={`text-sm ${annual ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              Anual <Badge className="ml-1 bg-primary/10 text-primary border-primary/30 text-[10px]">−17% · 2 meses gratis</Badge>
            </span>
          </div>
        </div>

        {/* Role tabs */}
        <Tabs defaultValue="corredores" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="corredores" className="gap-1">
              <Building2 className="h-3.5 w-3.5" />
              Corredores
            </TabsTrigger>
            <TabsTrigger value="inmobiliarias" className="gap-1">
              <Rocket className="h-3.5 w-3.5" />
              Inmobiliarias
            </TabsTrigger>
            <TabsTrigger value="comprador" className="gap-1">
              <Users className="h-3.5 w-3.5" />
              Comprador
            </TabsTrigger>
          </TabsList>

          {/* Comprador */}
          <TabsContent value="comprador">
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
                    Explorar terrenos
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Corredores */}
          <TabsContent value="corredores">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {PLAN_ORDER_CORREDORES.map((id) => renderPlanCard(id))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              ¿Solo quieres probar? El plan <button className="underline underline-offset-2 hover:text-foreground" onClick={() => handleSelectPlan('free')}>Explorador (gratis)</button> te permite publicar 3 avisos.
            </p>
          </TabsContent>

          {/* Inmobiliarias */}
          <TabsContent value="inmobiliarias">
            <div className="grid md:grid-cols-3 gap-6">
              {PLAN_ORDER_INMOBILIARIAS.map((id) => renderPlanCard(id))}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Benchmark vs competencia ── */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
              TRANSPARENCIA
            </Badge>
            <h2 className="text-3xl font-bold mb-3 text-foreground">
              OfertaTerrenos vs otros portales
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comparación pública con ChilePropiedades, Portalinmobiliario, TocToc, Yapo, Zonaprop y EasyBroker.
              Datos recolectados de sus páginas oficiales.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-muted/40 z-10">Característica</th>
                  {COMPETITOR_BENCHMARK.map((c) => (
                    <th
                      key={c.competitor}
                      className={`text-center py-3 px-3 font-semibold whitespace-nowrap ${
                        c.competitor === 'OfertaTerrenos' ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      {c.competitor}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_ROWS.map((row, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30">
                    <td className="py-3 px-4 text-foreground font-medium sticky left-0 bg-background z-10">
                      {row.label}
                    </td>
                    {COMPETITOR_BENCHMARK.map((c) => {
                      const v = c[row.key as keyof typeof c];
                      const isUs = c.competitor === 'OfertaTerrenos';
                      return (
                        <td
                          key={c.competitor}
                          className={`text-center py-3 px-3 text-xs ${isUs ? 'bg-primary/5 font-medium text-foreground' : 'text-muted-foreground'}`}
                        >
                          {typeof v === 'boolean' ? (
                            v ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          ) : (
                            (v as string) || '—'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            Precios de referencia recolectados en jul-2026 desde sitios oficiales. Cada portal puede modificar sus precios sin previo aviso.
          </p>
        </div>

        {/* ── Add-ons ── */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 border-primary/40 text-primary">
              <Star className="h-3 w-3 mr-1" /> ADD-ON DE VISIBILIDAD
            </Badge>
            <h2 className="text-3xl font-bold mb-3 text-foreground">
              Impulsa publicaciones específicas
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              ¿Necesitas más destacadas de las incluidas en tu plan? Compra visibilidad extra por publicación / mes.
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
                      Máx. conversión
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
                      {price === 0 ? 'Ya incluido' : 'Activar add-on'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[
              { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Sí. El upgrade es inmediato y prorrateamos el cargo. El downgrade aplica al final del periodo actual.' },
              { q: '¿Cobran comisión por venta?', a: 'No. Pagas solo la suscripción mensual (o anual). Las ventas y financiamientos son 100% tuyos.' },
              { q: '¿Puedo pagar con factura empresa?', a: 'Sí, planes Inmobiliaria, Grupo y Enterprise incluyen facturación electrónica automática en Chile.' },
              { q: '¿Qué pasa si supero mis publicaciones?', a: 'Te avisamos con anticipación. Puedes hacer upgrade o comprar publicaciones adicionales sin perder tu inventario.' },
              { q: '¿El anual tiene permanencia?', a: 'El anual te da 2 meses gratis, pero puedes cancelar cuando quieras. Solo pierdes el descuento anticipado.' },
              { q: '¿Cómo funciona el descuento del primer mes?', a: 'Aplicamos 50% OFF sobre el primer cargo mensual al contratar por primera vez cualquier plan pagado.' },
            ].map((f, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{f.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">¿Operación a gran escala?</h2>
          <p className="text-muted-foreground mb-6">
            Planes Enterprise con SLA 99.9%, SSO, integración ERP y account manager dedicado
            para inmobiliarias con +500 unidades o marketplaces regionales.
          </p>
          <Button variant="outline" size="lg" onClick={() => navigate('/contacto')}>
            <Globe className="h-4 w-4 mr-2" />
            Contactar equipo comercial
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
