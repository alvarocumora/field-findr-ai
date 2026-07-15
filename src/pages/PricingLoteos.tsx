import { Link } from 'react-router-dom';
import { Check, ArrowRight, Building2, Map, Users, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const plans = [
  {
    name: 'Starter Loteo',
    key: 'starter-loteo',
    price: '$49.990',
    period: '/mes',
    description: 'Para corredores o inmobiliarias que quieren publicar y validar demanda de un loteo.',
    highlight: false,
    features: [
      '1 proyecto de loteo activo',
      'Hasta 50 lotes gestionados',
      'Vitrina pública de inmobiliaria',
      'Captura de leads desde proyectos',
      'Dashboard de leads y reservas',
      'Soporte por email',
    ],
    cta: 'Comenzar Starter',
  },
  {
    name: 'Growth Inmobiliaria',
    key: 'growth-inmobiliaria',
    price: '$149.990',
    period: '/mes',
    description: 'Para equipos que venden varios proyectos y necesitan control comercial diario.',
    highlight: true,
    features: [
      'Hasta 5 proyectos activos',
      'Hasta 500 lotes gestionados',
      'Pipeline comercial y CRM',
      'Reservas y pagos por proyecto',
      'Dashboard multi-proyecto',
      'Vitrina pública con proyectos destacados',
      'Feed de actividad del equipo',
      'Soporte prioritario',
    ],
    cta: 'Solicitar Growth',
  },
  {
    name: 'Enterprise Loteos',
    key: 'enterprise-loteos',
    price: 'A medida',
    period: '',
    description: 'Para inmobiliarias con múltiples loteos, equipos comerciales y reporting ejecutivo.',
    highlight: false,
    features: [
      'Proyectos y lotes ilimitados según contrato',
      'Usuarios por rol: admin, jefe comercial y asesores',
      'Reportes ejecutivos y financieros',
      'Configuración de flujos de reserva',
      'Acompañamiento de implementación',
      'Integraciones y soporte dedicado',
    ],
    cta: 'Agendar demo Enterprise',
  },
];

const outcomes = [
  { icon: Building2, title: 'Gestión de proyectos', text: 'Centraliza proyectos, lotes, disponibilidad y avance comercial.' },
  { icon: Users, title: 'Leads y CRM', text: 'Captura interesados y ordena el seguimiento del equipo comercial.' },
  { icon: Map, title: 'Vitrina pública', text: 'Publica una página comercial para cada inmobiliaria y sus proyectos activos.' },
  { icon: BarChart3, title: 'Control ejecutivo', text: 'Visualiza actividad, reservas, pagos y desempeño comercial.' },
];

const getPlanContactUrl = (planKey: string, source = 'planes-loteos') => (
  `/contacto-loteos?plan=${encodeURIComponent(planKey)}&source=${encodeURIComponent(source)}`
);

const PricingLoteos = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-5" variant="secondary">Planes para inmobiliarias y loteos</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Vende, reserva y gestiona loteos desde una sola plataforma.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              OfertaTerrenos centraliza la operación comercial de proyectos inmobiliarios: vitrina pública, leads, CRM, reservas, pagos y dashboards por proyecto.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to={getPlanContactUrl('growth-inmobiliaria', 'planes-loteos-hero')}>
                  Solicitar demo comercial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to={getPlanContactUrl('enterprise-loteos', 'planes-loteos-hero-secondary')}>Hablar con ventas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((item) => (
            <Card key={item.title} className="border-border/60">
              <CardContent className="p-5">
                <item.icon className="mb-4 h-7 w-7 text-primary" />
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-16 md:pb-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.highlight ? 'relative border-primary shadow-lg' : 'border-border/60'}>
              {plan.highlight && (
                <Badge className="absolute right-5 top-5 gap-1">
                  <Sparkles className="h-3 w-3" /> Recomendado
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <p className="min-h-12 text-sm text-muted-foreground">{plan.description}</p>
                <div className="pt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.highlight ? 'default' : 'outline'} asChild>
                  <Link to={getPlanContactUrl(plan.key, 'planes-loteos-card')}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border/50 bg-muted/30">
        <div className="container grid gap-6 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Listo para vender planes de gestión de loteos</h2>
            <p className="mt-3 text-muted-foreground">
              La propuesta comercial ya separa planes por nivel de operación y prepara el siguiente paso: checkout, activación de plan y límites por cuenta.
            </p>
          </div>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Siguiente integración</p>
                <p className="text-sm text-muted-foreground">Conectar cada plan a checkout y activar límites comerciales dentro del dashboard.</p>
                <Button className="mt-4" size="sm" asChild>
                  <Link to={getPlanContactUrl('growth-inmobiliaria', 'planes-loteos-footer')}>Solicitar activación</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default PricingLoteos;
