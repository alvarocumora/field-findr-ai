import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { usePublicEvents } from '@/hooks/useEvents';

const Events = () => {
  const { data: events = [], isLoading } = usePublicEvents();
  return (
    <PublicLayout>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <Badge variant="outline">Open Land</Badge>
        <h1 className="mt-3 text-3xl font-bold">Eventos y visitas abiertas</h1>
        <p className="mt-2 text-muted-foreground">Conoce proyectos, recorre parcelas y conversa con sus equipos comerciales.</p>
        {isLoading ? <p className="py-16 text-center text-muted-foreground">Cargando eventos…</p> : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/eventos/${event.slug}`}>
                <Card className="h-full transition hover:border-primary/50">
                  <CardContent className="space-y-3 p-5">
                    <h2 className="text-lg font-semibold">{event.title}</h2>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                    <p className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4 text-primary" />{new Date(event.starts_at).toLocaleString('es-CL')}</p>
                    <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{event.venue || event.address || 'Ubicación por confirmar'}</p>
                    {event.capacity && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-4 w-4" />{event.capacity} cupos</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
            {events.length === 0 && <p className="col-span-full py-16 text-center text-muted-foreground">No hay próximos eventos publicados.</p>}
          </div>
        )}
      </main>
    </PublicLayout>
  );
};
export default Events;
