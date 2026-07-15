import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Building2, Rocket, Globe, TrendingUp, Shield, Users, Code, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PublicLayout from '@/components/layouts/PublicLayout';
import { PLAN_DETAILS, LATAM_PRICES } from '@/hooks/useSubscription';

const CLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
const UF_VALUE = 37500; // referencia aproximada CLP

const InmobiliariasLanding = () => {
  const navigate = useNavigate();
  const plans = ['inmobiliaria', 'grupo', 'enterprise'] as const;

  // ROI calculator
  const [lots, setLots] = useState(30);
  const [ticket, setTicket] = useState(45000000); // CLP por lote
  const [commission, setCommission] = useState(3); // %

  const monthlyRevenue = (lots / 12) * ticket;
  const monthlyCommission = monthlyRevenue * (commission / 100);
  const planCost = LATAM_PRICES.UF.inmobiliaria * UF_VALUE;
  const roi = planCost > 0 ? Math.round(monthlyCommission / planCost) : 0;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="container py-16 md:py-24 px-4 text-center max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-4 tracking-widest text-xs">PARA INMOBILIARIAS Y DESARROLLADORES</Badge>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
          El sistema operativo de tu inmobiliaria de terrenos
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Multi-proyecto, multi-agente, financiamiento directo, mapa 3D, tasación IA, API y white-label.
          Desde <strong className="text-foreground">5 UF/mes</strong>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/planes-loteos')}>
            Ver planes de loteos <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/contacto?source=inmobiliarias-landing')}>
            Hablar con ventas
          </Button>
        </div>
      </section>

      {/* Diferenciadores enterprise */}
      <section className="container px-4 max-w-6xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Diseñado para escalar</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Building2, title: 'Multi-proyecto', desc: 'Gestiona hasta 50 proyectos con inventario, precios y planes de venta independientes.' },
            { icon: Users, title: 'Equipo con roles', desc: 'Hasta 25 agentes con metas, comisiones automáticas y pipeline por vendedor.' },
            { icon: TrendingUp, title: 'BI + analytics', desc: 'Tablero ejecutivo con velocidad de venta, absorción, y proyección de flujo.' },
            { icon: Code, title: 'API + Webhooks', desc: 'Integra tu ERP, contabilidad y CRM externo con endpoints REST + firmas HMAC.' },
            { icon: Shield, title: 'SSO / SAML', desc: 'En Enterprise: single sign-on empresarial + SLA 99.9% + account manager.' },
            { icon: Globe, title: 'White-label', desc: 'Dominio propio y branding completo en Enterprise. Subdominio en Grupo.' },
          ].map((f) => (
            <Card key={f.title}>
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

      {/* ROI calculator */}
      <section className="container px-4 max-w-4xl mx-auto mb-20">
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <CardTitle>Calcula tu ROI</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Estima el retorno del plan Inmobiliaria (5 UF/mes ≈ {CLP(planCost)}) sobre tu operación anual.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="lots">Lotes vendidos / año</Label>
                <Input id="lots" type="number" value={lots} onChange={(e) => setLots(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label htmlFor="ticket">Ticket promedio (CLP)</Label>
                <Input id="ticket" type="number" value={ticket} onChange={(e) => setTicket(Number(e.target.value) || 0)} />
              </div>
              <div>
                <Label htmlFor="comm">Comisión (%)</Label>
                <Input id="comm" type="number" value={commission} onChange={(e) => setCommission(Number(e.target.value) || 0)} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Ingreso mensual promedio</p>
                <p className="text-xl font-bold">{CLP(monthlyRevenue)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Comisión mensual estimada</p>
                <p className="text-xl font-bold">{CLP(monthlyCommission)}</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <p className="text-xs text-primary">ROI vs. plan mensual</p>
                <p className="text-xl font-bold text-primary">{roi}×</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Planes destacados */}
      <section className="container px-4 max-w-6xl mx-auto mb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Planes para inmobiliarias</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((id) => {
            const p = PLAN_DETAILS[id];
            const price = LATAM_PRICES.UF[id];
            const isEnterprise = id === 'enterprise';
            return (
              <Card key={id} className={id === 'grupo' ? 'border-primary shadow-xl ring-2 ring-primary/20' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{p.name}</CardTitle>
                    {id === 'grupo' && <Badge>Recomendado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.target}</p>
                  <div className="mt-3">
                    {isEnterprise ? (
                      <span className="text-3xl font-bold">A medida</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">UF {price.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">/mes</span>
                      </>
                    )}
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
                  <Button
                    className="w-full"
                    variant={id === 'grupo' || isEnterprise ? 'default' : 'outline'}
                    onClick={() => isEnterprise ? navigate('/contacto?plan=enterprise-loteos') : navigate('/planes-loteos')}
                  >
                    {p.ctaLabel}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary/5 py-16">
        <div className="container px-4 max-w-3xl mx-auto text-center">
          <Rocket className="h-10 w-10 mx-auto mb-4 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Migra tu inmobiliaria en 48h</h2>
          <p className="text-muted-foreground mb-6">
            Importamos tu inventario desde KMZ, Excel o tu portal actual. Sin costo de onboarding en planes anuales.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/contacto?source=inmobiliarias-final-cta')}>
              Agendar demo
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/planes-loteos')}>
              Ver planes para loteos
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default InmobiliariasLanding;
