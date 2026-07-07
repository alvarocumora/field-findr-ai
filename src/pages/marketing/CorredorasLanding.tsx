import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Star, Building2, User, Zap, MapPin, Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PublicLayout from '@/components/layouts/PublicLayout';
import { PLAN_DETAILS, LATAM_PRICES } from '@/hooks/useSubscription';
import { COMPETITOR_BENCHMARK } from '@/config/pricingBenchmark';

const CorredorasLanding = () => {
  const navigate = useNavigate();
  const plans = ['corredor', 'corredora', 'inmobiliaria'] as const;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="container py-16 md:py-24 px-4 text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-4 tracking-widest text-xs">PARA CORREDORAS</Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
          Vende más terrenos con IA, no con publicaciones muertas
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Desde <strong className="text-foreground">1 UF/mes</strong>. CRM con lead scoring, mapa 3D, tasación con IA y WhatsApp integrado.
          Sin comisiones por venta.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/auth?redirect=/pricing')}>
            Empezar por 1 UF/mes <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
            Ver todos los planes
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          ✨ Primer mes 50% OFF · Sin permanencia · Cambia de plan cuando quieras
        </p>
      </section>

      {/* Comparativa dolor */}
      <section className="container px-4 max-w-4xl mx-auto mb-20">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-6">
            <div>
              <Badge variant="outline" className="mb-2">Tu situación hoy</Badge>
              <h3 className="text-xl font-bold mb-3">Pagas por publicar y esperas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>· $6.990–$15.990 CLP en ChilePropiedades solo por listar</li>
                <li>· Sin CRM ni scoring de leads</li>
                <li>· Ejecutivo de portal enterprise que nunca contesta</li>
                <li>· Sin tasación ni mapa 3D para diferenciarte</li>
              </ul>
            </div>
            <div>
              <Badge className="mb-2 bg-primary text-primary-foreground">Con OfertaTerrenos</Badge>
              <h3 className="text-xl font-bold mb-3">Cobras el ticket completo</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Desde 1 UF/mes con IA + CRM incluidos</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Reservas online con Mercado Pago</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Financiamiento directo (créditos internos)</li>
                <li className="flex gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> Tasación IA y mapa 3D de cada lote</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="container px-4 max-w-6xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Todo lo que necesitas para cerrar</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Bot, title: 'CRM con IA', desc: 'Lead scoring automático, alertas de leads calientes y sugerencia de próxima acción.' },
            { icon: MapPin, title: 'Mapa 3D + planos', desc: 'Muestra tus loteos con vista satelital 3D, polígonos y planos interactivos.' },
            { icon: Star, title: 'Tasación IA', desc: 'Genera tasaciones profesionales verificables por blockchain en minutos.' },
            { icon: MessageSquare, title: 'WhatsApp directo', desc: 'Botón WhatsApp en cada ficha, con captura automática de lead al CRM.' },
            { icon: Zap, title: 'Reservas online', desc: 'Cobra pie de reserva con Mercado Pago sin que el comprador te llame.' },
            { icon: Building2, title: 'Multi-agente', desc: 'Equipo con roles, metas de venta y liquidación automática de comisiones.' },
          ].map((f) => (
            <Card key={f.title} className="border-border hover:border-primary/30 transition-colors">
              <CardHeader>
                <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit mb-2">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Planes destacados */}
      <section className="container px-4 max-w-6xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Elige tu plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((id) => {
            const p = PLAN_DETAILS[id];
            const price = LATAM_PRICES.UF[id];
            return (
              <Card key={id} className={p.highlighted ? 'border-primary shadow-xl ring-2 ring-primary/20' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{p.name}</CardTitle>
                    {p.highlighted && <Badge>Más popular</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.target}</p>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">UF {price.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {p.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {h}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={p.highlighted ? 'default' : 'outline'} onClick={() => navigate('/pricing')}>
                    {p.ctaLabel}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Comparativa rápida */}
      <section className="container px-4 max-w-4xl mx-auto mb-20 text-center">
        <h2 className="text-2xl font-bold mb-4">¿Por qué no seguir con ChilePropiedades o Portalinmobiliario?</h2>
        <p className="text-muted-foreground mb-6">
          Cobran por listar y no te dan herramientas para cerrar. Nosotros te damos el stack completo por menos.
        </p>
        <Link to="/pricing" className="text-primary hover:underline text-sm font-medium">
          Ver tabla comparativa completa →
        </Link>
      </section>

      {/* CTA final */}
      <section className="bg-primary/5 py-16 mb-0">
        <div className="container px-4 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Empieza hoy por 1 UF/mes</h2>
          <p className="text-muted-foreground mb-6">
            Sin tarjeta de crédito para el plan gratis. Cambia o cancela cuando quieras.
          </p>
          <Button size="lg" onClick={() => navigate('/auth?redirect=/pricing')}>
            Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
};

export default CorredorasLanding;
