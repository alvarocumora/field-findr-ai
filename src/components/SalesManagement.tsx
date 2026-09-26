import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users, CalendarClock, Handshake, DollarSign, ArrowRight, Plus, TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads, LEAD_STATUS_CONFIG, LeadStatus } from '@/hooks/useLeads';
import { useVisits, VISIT_STATUS, VisitStatus } from '@/hooks/useVisits';
import { useSalesClosings, CLOSING_STATUS, ClosingStatus } from '@/hooks/useSalesClosings';
import { useWorkspaceScope, withProjectScope } from '@/hooks/useWorkspaceScope';
import { cn } from '@/lib/utils';

const money = (n: number, currency = 'CLP') =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 })
    .format(n || 0);

const PIPELINE: { key: string; label: string; hint: string }[] = [
  { key: 'new', label: 'Nuevos', hint: 'Leads sin contactar' },
  { key: 'contacted', label: 'Contactados', hint: 'Primer contacto hecho' },
  { key: 'visit', label: 'Visita agendada', hint: 'Con visita programada' },
  { key: 'negotiating', label: 'Negociando', hint: 'Propuesta en curso' },
  { key: 'closing', label: 'En cierre', hint: 'Contrato / firma' },
  { key: 'closed', label: 'Cerrados', hint: 'Venta con comisión' },
];

const SalesManagement = () => {
  const { projectId } = useWorkspaceScope();
  const { leads, isLoading: leadsLoading } = useLeads(projectId);
  const { visits, isLoading: visitsLoading } = useVisits(projectId);
  const { closings, isLoading: closingsLoading } = useSalesClosings(projectId);
  const isLoading = leadsLoading || visitsLoading || closingsLoading;

  const upcomingVisits = useMemo(
    () => visits
      .filter((v) => ['scheduled', 'confirmed'].includes(v.status)
        && isAfter(new Date(v.scheduled_at), new Date(Date.now() - 12 * 3600 * 1000)))
      .slice(0, 5),
    [visits],
  );

  const openClosings = useMemo(
    () => closings.filter((c) => ['draft', 'contract_sent', 'signed'].includes(c.status)),
    [closings],
  );
  const closed = useMemo(() => closings.filter((c) => c.status === 'closed'), [closings]);

  const leadIdsWithVisit = useMemo(
    () => new Set(visits.filter((v) => v.lead_id).map((v) => v.lead_id as string)),
    [visits],
  );
  const leadIdsInClosing = useMemo(
    () => new Set(closings.filter((c) => c.lead_id).map((c) => c.lead_id as string)),
    [closings],
  );

  const columns = useMemo(() => {
    const buckets: Record<string, { id: string; title: string; subtitle: string; amount?: number }[]> = {
      new: [], contacted: [], visit: [], negotiating: [], closing: [], closed: [],
    };
    leads.forEach((l) => {
      const name = `${l.first_name} ${l.last_name ?? ''}`.trim();
      const item = {
        id: l.id,
        title: name || 'Sin nombre',
        subtitle: l.email || l.phone || LEAD_STATUS_CONFIG[(l.status as LeadStatus) ?? 'new']?.label || '',
        amount: Number(l.budget_max || 0) || undefined,
      };
      if (leadIdsInClosing.has(l.id)) return;
      if (l.status === 'converted' || l.status === 'lost') return;
      if (l.status === 'negotiating') buckets.negotiating.push(item);
      else if (leadIdsWithVisit.has(l.id)) buckets.visit.push(item);
      else if (l.status === 'contacted' || l.status === 'interested') buckets.contacted.push(item);
      else buckets.new.push(item);
    });
    openClosings.forEach((c) => buckets.closing.push({
      id: c.id,
      title: c.buyer_name,
      subtitle: CLOSING_STATUS[(c.status as ClosingStatus)]?.label ?? '',
      amount: Number(c.sale_amount || 0),
    }));
    closed.forEach((c) => buckets.closed.push({
      id: c.id,
      title: c.buyer_name,
      subtitle: `Comisión ${money(Number(c.commission_amount), c.currency || 'CLP')}`,
      amount: Number(c.sale_amount || 0),
    }));
    return buckets;
  }, [leads, openClosings, closed, leadIdsWithVisit, leadIdsInClosing]);

  const kpis = [
    {
      label: 'Leads activos',
      value: leads.filter((l) => !['converted', 'lost'].includes(l.status ?? '')).length,
      icon: Users,
      to: withProjectScope('/asesor/leads', projectId),
      cta: 'Ver leads',
    },
    {
      label: 'Visitas próximas',
      value: upcomingVisits.length,
      icon: CalendarClock,
      to: withProjectScope('/asesor/visitas', projectId),
      cta: 'Agenda',
    },
    {
      label: 'Cierres en curso',
      value: openClosings.length,
      icon: Handshake,
      to: withProjectScope('/asesor/cierres', projectId),
      cta: 'Cerrar venta',
    },
    {
      label: 'Comisión generada',
      value: money(closed.reduce((s, c) => s + Number(c.commission_amount || 0), 0)),
      icon: DollarSign,
      to: withProjectScope('/asesor/comisiones', projectId),
      cta: 'Comisiones',
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Leads, visitas y cierres en un solo pipeline. La comisión se genera al cerrar la venta.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to={withProjectScope("/asesor/visitas", projectId)}><CalendarClock className="h-4 w-4" aria-hidden="true" /> Agendar visita</Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to={withProjectScope("/asesor/cierres", projectId)}><Plus className="h-4 w-4" aria-hidden="true" /> Nuevo cierre</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="group">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                {isLoading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl font-bold">{k.value}</p>
                )}
                <Button asChild size="sm" variant="ghost" className="px-0 h-auto text-primary gap-1">
                  <Link to={k.to}>{k.cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" aria-hidden="true" /> Pipeline comercial
          </CardTitle>
          <Badge variant="outline">{leads.length + closings.length} registros</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="flex gap-3 min-w-[56rem]">
            {PIPELINE.map((col) => {
              const items = columns[col.key] ?? [];
              const total = items.reduce((s, i) => s + (i.amount || 0), 0);
              return (
                <section key={col.key} className="flex-1 min-w-[11rem] rounded-xl border bg-muted/30 p-3">
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">{col.label}</h2>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{col.hint}</p>
                    {total > 0 && (
                      <p className="text-[11px] font-medium text-primary mt-1">{money(total)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {isLoading && <Skeleton className="h-14 w-full" />}
                    {items.slice(0, 6).map((i) => (
                      <div key={i.id} className="rounded-lg border bg-background p-2">
                        <p className="text-sm font-medium truncate">{i.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{i.subtitle}</p>
                        {i.amount ? (
                          <p className="text-xs font-semibold mt-1">{money(i.amount)}</p>
                        ) : null}
                      </div>
                    ))}
                    {!isLoading && items.length === 0 && (
                      <p className="text-xs text-muted-foreground py-4 text-center">Vacío</p>
                    )}
                    {items.length > 6 && (
                      <p className="text-[11px] text-muted-foreground">+{items.length - 6} más</p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Próximas visitas</CardTitle>
            <Button asChild size="sm" variant="ghost"><Link to={withProjectScope("/asesor/visitas", projectId)}>Ver todas</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <Skeleton className="h-16 w-full" />}
            {!isLoading && upcomingVisits.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Sin visitas agendadas.</p>
            )}
            {upcomingVisits.map((v) => {
              const st = VISIT_STATUS[(v.status as VisitStatus)] ?? VISIT_STATUS.scheduled;
              const when = new Date(v.scheduled_at);
              return (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{v.visitor_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isToday(when) ? 'Hoy' : format(when, "d MMM", { locale: es })} ·{' '}
                      {format(when, 'HH:mm')} · {v.mode}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('border shrink-0', st.className)}>{st.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Cierres recientes</CardTitle>
            <Button asChild size="sm" variant="ghost"><Link to="/asesor/cierres">Gestionar</Link></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <Skeleton className="h-16 w-full" />}
            {!isLoading && closings.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">Aún no registras cierres.</p>
            )}
            {closings.slice(0, 5).map((c) => {
              const st = CLOSING_STATUS[(c.status as ClosingStatus)] ?? CLOSING_STATUS.draft;
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.buyer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {money(Number(c.sale_amount), c.currency || 'CLP')} · comisión{' '}
                      {money(Number(c.commission_amount), c.currency || 'CLP')}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('border shrink-0', st.className)}>{st.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesManagement;
