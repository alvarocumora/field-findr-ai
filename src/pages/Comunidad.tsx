import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Users, Store, Share2, HandCoins, MapPin, ArrowRight } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useBrokerRanking } from '@/hooks/useBrokers';

const PILLARS = [
  {
    icon: Users,
    title: 'Red de vendedores',
    text: 'Corredores, inmobiliarias y captadores trabajando sobre el mismo inventario, con atribución clara de cada lead.',
    to: '/brokers',
    cta: 'Conocer la comunidad',
  },
  {
    icon: Store,
    title: 'Proyectos en venta',
    text: 'Catálogo interno de loteos habilitados para terceros: comisión ofrecida, stock y material de venta listo.',
    to: '/asesor/proyectos-en-venta',
    cta: 'Ver proyectos',
  },
  {
    icon: Share2,
    title: 'Vitrina y link propio',
    text: 'Cada miembro tiene su perfil público y su link personal; todo lo que entra por ahí queda atribuido.',
    to: '/brokers/inscripcion',
    cta: 'Crear mi vitrina',
  },
  {
    icon: HandCoins,
    title: 'Comisiones y red',
    text: 'Comisión directa, override por red de referidos y pagos trazables sobre cada venta cerrada.',
    to: '/referidos',
    cta: 'Cómo funciona',
  },
];

const Comunidad = () => {
  const { data: ranking = [], isLoading } = useBrokerRanking(6);

  useSEO({
    title: 'Comunidad de terrenos: brokers, proyectos y red | Oferta Terrenos',
    description:
      'La red que vende terrenos: brokers verificados, proyectos disponibles para comercializar, comisiones trazables y ranking abierto de la comunidad.',
    canonicalUrl: '/comunidad',
  });

  return (
    <PublicLayout>
      <main>
        {/* Hero */}
        <section className="border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container px-4 py-16 md:py-24 max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">Comunidad abierta</Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              El terreno se vende en red, no en solitario
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Una sola plataforma donde quien tiene el terreno, quien lo vende y quien lo compra
              se encuentran con la misma información, las mismas herramientas y comisiones claras.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/brokers/inscripcion">Unirme a la comunidad</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/explorar">Explorar terrenos</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pilares */}
        <section className="container px-4 py-14">
          <h2 className="text-2xl font-bold mb-8">Qué encuentras aquí</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map(({ icon: Icon, title, text, to, cta }) => (
              <Card key={title} className="border-border/60 h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <Icon className="h-6 w-6 text-primary mb-3" aria-hidden="true" />
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground flex-1">{text}</p>
                  <Button asChild variant="ghost" className="mt-4 self-start px-0">
                    <Link to={to}>
                      {cta} <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ranking */}
        <section className="container px-4 pb-16">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
                Miembros destacados
              </h2>
              <p className="text-sm text-muted-foreground">
                Ranking abierto por ventas registradas y proyectos activos.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/brokers/ranking">Ver ranking completo</Link>
            </Button>
          </div>

          {isLoading && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          )}

          {!isLoading && ranking.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center">
                <p className="text-muted-foreground mb-6">
                  La comunidad recién comienza. Sé uno de los primeros en aparecer aquí.
                </p>
                <Button asChild><Link to="/brokers/inscripcion">Postular ahora</Link></Button>
              </CardContent>
            </Card>
          )}

          {ranking.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ranking.map((b) => (
                <li key={b.slug}>
                  <Card className="border-border/60 h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link to={`/b/${b.slug}`} className="font-semibold hover:underline truncate">
                          {b.display_name}
                        </Link>
                        <Badge variant="secondary">{b.level}</Badge>
                      </div>
                      {b.zones && b.zones.length > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          {b.zones.join(' · ')}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        {b.sales_count} ventas · {b.projects_count} proyectos
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </PublicLayout>
  );
};

export default Comunidad;
