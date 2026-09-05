import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useLeads } from '@/hooks/useLeads';
import { useVisits } from '@/hooks/useVisits';
import { useSalesClosings } from '@/hooks/useSalesClosings';
import { useAgentCommissions } from '@/hooks/useAgentCommissions';
import { useProjects } from '@/hooks/useProjects';
import {
  Users, CalendarCheck, Handshake, AlertCircle, Search, Mail, Phone, DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const money = (n: number, c = 'CLP') =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: c || 'CLP', maximumFractionDigits: 0 }).format(n || 0);
const fmt = (d?: string | null) => (d ? format(new Date(d), "d MMM yyyy", { locale: es }) : '—');

/** Clave de agrupación por comprador: email > teléfono > nombre normalizado. */
const buyerKey = (name?: string | null, email?: string | null, phone?: string | null) =>
  (email?.trim().toLowerCase() || phone?.replace(/\D/g, '') || name?.trim().toLowerCase() || 'sin-datos');

interface ClientRow {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  leads: { id: string; project_id: string | null; status: string | null; created_at: string }[];
  visits: { id: string; project_id: string | null; scheduled_at: string; status: string }[];
  closings: { id: string; project_id: string | null; sale_amount: number; currency: string; status: string; closed_at: string | null; commission_amount: number; commission_id: string | null }[];
  pendingCommission: number;
  totalSales: number;
  lastActivity: string;
}

const ClientsBook = () => {
  const { leads = [], isLoading: loadingLeads } = useLeads();
  const { visits = [], isLoading: loadingVisits } = useVisits();
  const { closings = [], isLoading: loadingClosings } = useSalesClosings();
  const { data: commissions = [] } = useAgentCommissions();
  const { projects = [] } = useProjects();
  const [q, setQ] = useState('');

  const projectName = (id?: string | null) => projects.find(p => p.id === id)?.name ?? 'Sin proyecto';

  const pendingByCommissionId = useMemo(() => {
    const map = new Map<string, number>();
    commissions.forEach(c => {
      if (c.status !== 'paid') map.set(c.id, Number(c.commission_amount || 0));
    });
    return map;
  }, [commissions]);

  const clients = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();
    const ensure = (name: string, email: string | null, phone: string | null): ClientRow => {
      const key = buyerKey(name, email, phone);
      let row = map.get(key);
      if (!row) {
        row = {
          key, name: name || 'Sin nombre', email, phone,
          leads: [], visits: [], closings: [],
          pendingCommission: 0, totalSales: 0, lastActivity: '1970-01-01',
        };
        map.set(key, row);
      }
      if (!row.email && email) row.email = email;
      if (!row.phone && phone) row.phone = phone;
      return row;
    };
    const touch = (row: ClientRow, date: string) => {
      if (date > row.lastActivity) row.lastActivity = date;
    };

    leads.forEach(l => {
      const row = ensure([l.first_name, l.last_name].filter(Boolean).join(' '), l.email, l.phone);
      row.leads.push({ id: l.id, project_id: l.project_id, status: l.status, created_at: l.created_at });
      touch(row, l.created_at);
    });
    visits.forEach(v => {
      const row = ensure(v.visitor_name, v.visitor_email, v.visitor_phone);
      row.visits.push({ id: v.id, project_id: v.project_id, scheduled_at: v.scheduled_at, status: v.status });
      touch(row, v.scheduled_at);
    });
    closings.forEach(c => {
      const row = ensure(c.buyer_name, c.buyer_email, c.buyer_phone);
      const pending = c.commission_id ? (pendingByCommissionId.get(c.commission_id) ?? 0) : 0;
      row.closings.push({
        id: c.id, project_id: c.project_id, sale_amount: Number(c.sale_amount || 0), currency: c.currency,
        status: c.status, closed_at: c.closed_at, commission_amount: Number(c.commission_amount || 0),
        commission_id: c.commission_id,
      });
      row.pendingCommission += pending;
      if (c.status === 'closed') row.totalSales += Number(c.sale_amount || 0);
      touch(row, c.closed_at ?? c.created_at);
    });

    return [...map.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  }, [leads, visits, closings, pendingByCommissionId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(term));
  }, [clients, q]);

  const isLoading = loadingLeads || loadingVisits || loadingClosings;
  const totalPending = clients.reduce((s, c) => s + c.pendingCommission, 0);
  const withPending = clients.filter(c => c.pendingCommission > 0);

  const kpis = [
    { label: 'Clientes', value: String(clients.length), icon: Users },
    { label: 'Visitas agendadas', value: String(visits.length), icon: CalendarCheck },
    { label: 'Ventas cerradas', value: String(closings.filter(c => c.status === 'closed').length), icon: Handshake },
    { label: 'Comisión pendiente', value: money(totalPending), icon: DollarSign },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Cada comprador con sus consultas, visitas y cierres en un solo lugar.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono"
            className="pl-9"
            aria-label="Buscar cliente"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                <k.icon className="h-3.5 w-3.5" aria-hidden />
                {k.label}
              </div>
              <p className="mt-1 text-xl font-semibold text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {withPending.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Tienes {money(totalPending)} en comisiones pendientes de pago
              </p>
              <p className="text-xs text-muted-foreground">
                {withPending.map(c => c.name).slice(0, 4).join(', ')}
                {withPending.length > 4 ? ` y ${withPending.length - 4} más` : ''}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href="/asesor/comisiones">Ver comisiones</a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cartera de clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay clientes registrados. Se agregan solos con cada consulta, visita o cierre.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filtered.map(c => (
                <AccordionItem key={c.key} value={c.key}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 pr-3 text-left">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.leads.length} consulta{c.leads.length === 1 ? '' : 's'} · {c.visits.length} visita{c.visits.length === 1 ? '' : 's'} · {c.closings.length} cierre{c.closings.length === 1 ? '' : 's'}
                      </span>
                      {c.totalSales > 0 && (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                          {money(c.totalSales)}
                        </Badge>
                      )}
                      {c.pendingCommission > 0 && (
                        <Badge className="bg-amber-500/15 text-amber-700 border border-amber-500/30 hover:bg-amber-500/15">
                          Comisión pendiente {money(c.pendingCommission)}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pb-2">
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {c.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" aria-hidden />{c.email}</span>}
                        {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" aria-hidden />{c.phone}</span>}
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consultas</p>
                          {c.leads.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : c.leads.map(l => (
                            <div key={l.id} className="mb-2 rounded-lg border border-border/60 p-2">
                              <p className="text-sm text-foreground">{projectName(l.project_id)}</p>
                              <p className="text-xs text-muted-foreground">{l.status ?? 'nuevo'} · {fmt(l.created_at)}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visitas</p>
                          {c.visits.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : c.visits.map(v => (
                            <div key={v.id} className="mb-2 rounded-lg border border-border/60 p-2">
                              <p className="text-sm text-foreground">{projectName(v.project_id)}</p>
                              <p className="text-xs text-muted-foreground">{v.status} · {fmt(v.scheduled_at)}</p>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cierres</p>
                          {c.closings.length === 0 ? <p className="text-xs text-muted-foreground">—</p> : c.closings.map(cl => (
                            <div key={cl.id} className="mb-2 rounded-lg border border-border/60 p-2">
                              <p className="text-sm text-foreground">{projectName(cl.project_id)}</p>
                              <p className="text-xs text-muted-foreground">
                                {money(cl.sale_amount, cl.currency)} · {cl.status} · {fmt(cl.closed_at)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Comisión {money(cl.commission_amount, cl.currency)}
                                {cl.commission_id && pendingByCommissionId.has(cl.commission_id) ? ' · pendiente' : ' · pagada o sin registrar'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsBook;
