import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, FileText, MessageCircle, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVisits } from '@/hooks/useVisits';
import { useExpiringSalesQuotes } from '@/hooks/useSalesQuotes';
import { useReservations } from '@/hooks/useReservations';
import { useProjects } from '@/hooks/useProjects';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const inRange = (iso: string | null | undefined, start: Date, end: Date) => {
  if (!iso) return false;
  const value = new Date(iso);
  return value >= start && value <= end;
};

const ExecutiveTodayPanel = () => {
  const { projects } = useProjects();
  const { visits } = useVisits();
  const { data: quotes = [] } = useExpiringSalesQuotes(72);
  const { data: reservations = [] } = useReservations();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Incluye proyectos del equipo/organización, no solo los propios.
  const ownedProjectIds = useMemo(
    () => new Set(projects.map((project) => project.id)),
    [projects],
  );

  const priorities = useMemo(() => {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const todayVisits = visits
      .filter((visit) => inRange(visit.scheduled_at, todayStart, todayEnd) && !['cancelled', 'rescheduled'].includes(visit.status ?? ''))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    const overdueFollowUps = visits
      .filter((visit) => visit.follow_up_at && new Date(visit.follow_up_at) < now && visit.status !== 'cancelled' && visit.next_action && visit.next_action !== 'none')
      .sort((a, b) => new Date(a.follow_up_at ?? 0).getTime() - new Date(b.follow_up_at ?? 0).getTime());

    const expiringQuotes = quotes
      .filter((quote) => new Date(quote.valid_until) >= now)
      .sort((a, b) => new Date(a.valid_until).getTime() - new Date(b.valid_until).getTime());

    const pendingReservations = (reservations)
      .filter((reservation) => ownedProjectIds.has(reservation.lots?.project_id))
      .filter((reservation) => ['pending_payment', 'paid'].includes(reservation.status))
      .sort((a, b) => new Date(a.expires_at ?? a.created_at ?? 0).getTime() - new Date(b.expires_at ?? b.created_at ?? 0).getTime());

    return { todayVisits, overdueFollowUps, expiringQuotes, pendingReservations };
  }, [visits, quotes, reservations, now, ownedProjectIds]);

  const total = priorities.todayVisits.length + priorities.overdueFollowUps.length + priorities.expiringQuotes.length + priorities.pendingReservations.length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Hoy del Ejecutivo</CardTitle>
              <Badge variant={total > 0 ? 'default' : 'outline'}>{total} acciones</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Prioridades comerciales que requieren acción hoy.</p>
          </div>
          <Button variant="outline" size="sm" asChild><Link to="/asesor/visitas"><CalendarClock className="mr-2 h-4 w-4" />Agenda completa</Link></Button>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No hay acciones urgentes. Revisa inventario disponible y genera nuevas oportunidades.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <PriorityCard icon={CalendarClock} title="Visitas de hoy" count={priorities.todayVisits.length} tone="Agenda" to="/asesor/visitas" detail={priorities.todayVisits[0]?.visitor_name} />
            <PriorityCard icon={AlertTriangle} title="Seguimientos vencidos" count={priorities.overdueFollowUps.length} tone="Atención" to="/asesor/visitas" detail={priorities.overdueFollowUps[0]?.visitor_name} />
            <PriorityCard icon={FileText} title="Cotizaciones ≤ 72 h" count={priorities.expiringQuotes.length} tone="Por vencer" to="/asesor/executive#cotizaciones" detail={priorities.expiringQuotes[0]?.customer_name} />
            <PriorityCard icon={ShoppingCart} title="Reservas activas" count={priorities.pendingReservations.length} tone="Pago/cierre" to="/asesor/reservations" detail={priorities.pendingReservations[0]?.buyer_name} />
          </div>
        )}
        {priorities.overdueFollowUps.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-500/10 p-3 text-sm">
            <span><strong>{priorities.overdueFollowUps.length}</strong> seguimiento(s) requieren contacto inmediato.</span>
            <Button size="sm" variant="outline" asChild><Link to="/asesor/visitas"><MessageCircle className="mr-2 h-4 w-4" />Resolver seguimientos</Link></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PriorityCard = ({ icon: Icon, title, count, tone, to, detail }: { icon: typeof CalendarClock; title: string; count: number; tone: string; to: string; detail?: string | null }) => (
  <Link to={to} className="block">
    <div className="h-full rounded-xl border p-4 transition-colors hover:border-primary/50 hover:bg-muted/20">
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
        <Badge variant="outline">{tone}</Badge>
      </div>
      <p className="mt-3 text-2xl font-bold">{count}</p>
      <p className="text-sm font-medium">{title}</p>
      {detail && <p className="mt-1 truncate text-xs text-muted-foreground">Primero: {detail}</p>}
    </div>
  </Link>
);

export default ExecutiveTodayPanel;
