import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, MapPin } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useBrokerRanking } from '@/hooks/useBrokers';

const LEVEL_LABEL: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  elite: 'Elite',
  partner: 'Partner',
};

const BrokerRanking = () => {
  const { data = [], isLoading } = useBrokerRanking(30);

  useSEO({
    title: 'Ranking de brokers de loteos | Oferta Terrenos',
    description:
      'Conoce a los brokers más activos de la comunidad de Oferta Terrenos: ventas registradas, proyectos asignados y zonas de trabajo.',
    canonicalUrl: '/brokers/ranking',
  });

  return (
    <PublicLayout>
      <main className="container px-4 py-12 max-w-4xl">
        <header className="mb-10 text-center">
          <Trophy className="h-10 w-10 mx-auto mb-3 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold mb-2">Comunidad de brokers</h1>
          <p className="text-muted-foreground">
            Los profesionales que están moviendo el mercado de loteos y parcelas.
          </p>
        </header>

        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        )}

        {!isLoading && data.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground mb-6">
                La comunidad recién comienza. Sé uno de los primeros brokers en aparecer aquí.
              </p>
              <Button asChild><Link to="/brokers/inscripcion">Postular ahora</Link></Button>
            </CardContent>
          </Card>
        )}

        <ol className="space-y-3">
          {data.map((b, i) => (
            <li key={b.slug}>
              <Card className="border-border/60">
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="text-xl font-bold text-muted-foreground w-8 shrink-0 text-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold truncate">{b.display_name}</h2>
                      <Badge variant="secondary">{LEVEL_LABEL[b.level] ?? b.level}</Badge>
                    </div>
                    {b.company_name && (
                      <p className="text-sm text-muted-foreground truncate">{b.company_name}</p>
                    )}
                    {b.zones && b.zones.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {b.zones.join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">{b.sales_count}</p>
                    <p className="text-xs text-muted-foreground">ventas</p>
                    <p className="text-xs text-muted-foreground">{b.projects_count} proyectos</p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link to="/brokers/inscripcion">Sumarme a la comunidad</Link>
          </Button>
        </div>
      </main>
    </PublicLayout>
  );
};

export default BrokerRanking;
