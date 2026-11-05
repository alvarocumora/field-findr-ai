import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSEO } from '@/hooks/useSEO';
import {
  Handshake, MapPinned, TrendingUp, ShieldCheck, Users, FileText, ArrowRight,
} from 'lucide-react';
import { BROKER_MIN_SALE_COMMISSION_CLP, brokerCommissionSummary, clpAmount } from '@/lib/brokerProgram';

const benefits = [
  {
    icon: MapPinned,
    title: 'Catálogo de loteos listos para vender',
    text: 'Accede a proyectos de parcelaciones en Chile y LATAM con stock, planos y precios actualizados.',
  },
  {
    icon: TrendingUp,
    title: `Comisión fija desde ${clpAmount(BROKER_MIN_SALE_COMMISSION_CLP)} por lote vendido`,
    text: `Cada proyecto fija su monto, sin importar el precio del lote. ${brokerCommissionSummary('. ')}.`,
  },
  {
    icon: FileText,
    title: 'Kit de venta incluido',
    text: 'Brochure, planos, fichas PDF por lote, mapas y textos listos para WhatsApp.',
  },
  {
    icon: Users,
    title: 'Tu red suma',
    text: 'Invita a otros brokers con tu link y participa del override de tu red.',
  },
  {
    icon: ShieldCheck,
    title: 'Respaldo legal y documental',
    text: 'Proyectos revisados: dominio vigente, subdivisión y documentación disponible.',
  },
  {
    icon: Handshake,
    title: 'CRM y seguimiento',
    text: 'Leads atribuidos, pipeline, reservas y cierre en una sola plataforma.',
  },
];

const steps = [
  { n: '01', t: 'Postulas', d: 'Completas el formulario con tu experiencia y zona de trabajo.' },
  { n: '02', t: 'Te validamos', d: 'Revisamos tu perfil y activamos tu cuenta de broker.' },
  { n: '03', t: 'Eliges proyectos', d: 'Solicitas los loteos que quieres vender y ves tu comisión.' },
  { n: '04', t: 'Vendes y cobras', d: 'Compartes tu link, recibes leads atribuidos y cobras tu comisión.' },
];

const BrokersLanding = () => {
  useSEO({
    title: 'Comunidad de Brokers | Vende loteos y terrenos en Chile y LATAM',
    description:
      'Únete a la comunidad de brokers de Oferta Terrenos: catálogo de loteos listos para vender, comisiones trazables, kit de venta y CRM incluido.',
    canonicalUrl: '/brokers',
  });

  return (
    <PublicLayout>
      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="container px-4 py-20 md:py-28 max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">Comunidad de Brokers</Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
              Vende loteos y parcelas sin tener inventario propio
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Accede a proyectos de parcelación verificados en Chile y LATAM, con comisión
              publicada, material de venta y seguimiento de cada cliente que traes.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button size="lg" asChild>
                <Link to="/brokers/inscripcion">
                  Postular como broker <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/brokers/ranking">Ver la comunidad</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Todo lo que necesitas para vender
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <Card key={b.title} className="border-border/60">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <b.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold mb-1">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/30">
          <div className="container px-4 py-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center">Cómo funciona</h2>
            <ol className="grid gap-6 md:grid-cols-4">
              {steps.map((s) => (
                <li key={s.n}>
                  <div className="text-3xl font-bold text-primary/40 mb-2">{s.n}</div>
                  <h3 className="font-semibold mb-1">{s.t}</h3>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="container px-4 py-16 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            La red de venta de loteos más grande de LATAM se construye ahora
          </h2>
          <p className="text-muted-foreground mb-8">
            Postula hoy. Revisamos las solicitudes en menos de 48 horas hábiles.
          </p>
          <Button size="lg" asChild>
            <Link to="/brokers/inscripcion">Quiero inscribirme</Link>
          </Button>
        </section>
      </main>
    </PublicLayout>
  );
};

export default BrokersLanding;
