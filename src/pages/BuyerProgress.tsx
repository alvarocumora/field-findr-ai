import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Compass, CalendarCheck, FileSignature, CheckCircle2, Clock,
  MapPin, ChevronRight, Sparkles, Video, User as UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

type Lead = { id: string; project_name: string | null; status: string | null; interest_type: string | null; created_at: string; next_follow_up: string | null };
type Visit = { id: string; project_name: string | null; lot_number: string | null; scheduled_at: string; duration_minutes: number; mode: string; status: string; outcome: string | null };
type Reservation = { id: string; lot_number: string | null; project_name: string | null; status: string; reservation_amount: number; currency: string; paid_at: string | null; expires_at: string | null; created_at: string };
type Closing = { id: string; project_name: string | null; lot_number: string | null; sale_amount: number; currency: string; status: string; contract_signed_at: string | null; closed_at: string | null; created_at: string };
type ProgressData = { leads: Lead[]; visits: Visit[]; reservations: Reservation[]; closings: Closing[] };

const LEAD_STATUS: Record<string, string> = {
  nuevo: 'Recibido', capturado: 'Recibido', contactado: 'En contacto', calificado: 'Calificado',
  visita: 'Visita agendada', negociando: 'En negociación', ganado: 'Compra completada', perdido: 'Cerrado', descartado: 'Cerrado',
};
const VISIT_STATUS: Record<string, { label: string; cls: string }> = {
  programada: { label: 'Programada', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  confirmada: { label: 'Confirmada', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  completada: { label: 'Realizada', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  cancelada: { label: 'Cancelada', cls: 'bg-muted text-muted-foreground border-border' },
  no_asistio: { label: 'No asistió', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};
const RES_STATUS: Record<string, string> = {
  pending_payment: 'Pendiente de pago', paid: 'Reserva confirmada', expired: 'Expirada',
  cancelled: 'Cancelada', converted: 'Venta completada',
};

const fmt = (d: string | null) => (d ? format(new Date(d), "d 'de' MMMM yyyy", { locale: es }) : '—');
const fmtMoney = (n: number, c: string) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: c || 'CLP', maximumFractionDigits: 0 }).format(n);

const BuyerProgress = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_buyer_progress' as never);
      if (error) throw error;
      return data as unknown as ProgressData;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const leads = data?.leads ?? [];
  const visits = data?.visits ?? [];
  const reservations = data?.reservations ?? [];
  const closings = data?.closings ?? [];

  const hasContact = leads.length > 0;
  const hasVisit = visits.some(v => ['confirmada', 'completada'].includes(v.status));
  const hasReservation = reservations.some(r => ['paid', 'converted'].includes(r.status));
  const hasClosing = closings.some(c => c.status === 'closed' || c.closed_at);

  const stages = [
    { label: 'Interés registrado', done: hasContact, icon: Compass },
    { label: 'Visita al terreno', done: hasVisit, icon: CalendarCheck },
    { label: 'Reserva pagada', done: hasReservation, icon: FileSignature },
    { label: 'Compra cerrada', done: hasClosing, icon: CheckCircle2 },
  ];
  const pct = Math.round((stages.filter(s => s.done).length / stages.length) * 100);
  const upcomingVisits = visits.filter(v => new Date(v.scheduled_at) > new Date() && ['programada', 'confirmada'].includes(v.status));
  const isEmpty = !hasContact && visits.length === 0 && reservations.length === 0 && closings.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mi Progreso de Compra</h1>
          <p className="text-muted-foreground">Sigue el avance de tu compra: contacto, visitas, reserva y cierre.</p>
        </header>

        {/* Pipeline */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tu camino de compra</CardTitle>
              <Badge variant="outline">{pct}% completado</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={pct} className="h-2" />
            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stages.map((s, i) => (
                <li key={i} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center ${s.done ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-muted/30'}`}>
                  <s.icon className={`h-5 w-5 ${s.done ? 'text-emerald-600' : 'text-muted-foreground'}`} aria-hidden />
                  <span className="text-xs font-medium leading-tight">{s.label}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {isEmpty ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-12 text-center space-y-4">
              <Sparkles className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden />
              <div>
                <p className="font-semibold text-lg">Aún no tienes un proceso de compra activo</p>
                <p className="text-sm text-muted-foreground">Explora los proyectos disponibles y agenda tu primera visita.</p>
              </div>
              <Link to="/explorar" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Explorar terrenos <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Consultas / interés */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" aria-hidden /> Mis consultas ({leads.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leads.length === 0 && <p className="text-sm text-muted-foreground">Sin consultas registradas.</p>}
                {leads.map(l => (
                  <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.project_name ?? 'Consulta general'}</p>
                      <p className="text-xs text-muted-foreground">{fmt(l.created_at)}</p>
                    </div>
                    <Badge variant="outline">{LEAD_STATUS[l.status ?? ''] ?? l.status ?? 'Recibido'}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Visitas */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-primary" aria-hidden /> Mis visitas ({visits.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {visits.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes visitas agendadas.</p>}
                {upcomingVisits.length > 0 && (
                  <p className="text-xs font-medium text-emerald-600">Próxima visita: {fmt(upcomingVisits[0].scheduled_at)}</p>
                )}
                {visits.map(v => {
                  const st = VISIT_STATUS[v.status] ?? { label: v.status, cls: 'bg-muted text-muted-foreground border-border' };
                  return (
                    <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {v.project_name ?? 'Proyecto'}{v.lot_number ? ` · Lote ${v.lot_number}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {v.mode === 'virtual' ? <Video className="h-3 w-3" aria-hidden /> : <UserIcon className="h-3 w-3" aria-hidden />}
                          {format(new Date(v.scheduled_at), "d MMM yyyy · HH:mm", { locale: es })} hrs
                        </p>
                      </div>
                      <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Reservas */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden /> Mis reservas ({reservations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reservations.length === 0 && <p className="text-sm text-muted-foreground">Sin reservas todavía.</p>}
                {reservations.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {r.project_name ?? 'Proyecto'}{r.lot_number ? ` · Lote ${r.lot_number}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtMoney(r.reservation_amount, r.currency)} · {fmt(r.created_at)}
                      </p>
                    </div>
                    <Badge variant="outline">{RES_STATUS[r.status] ?? r.status}</Badge>
                  </div>
                ))}
                {reservations.length > 0 && (
                  <Link to="/mi-terreno" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Ver detalle en Mi Terreno <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Cierres */}
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-primary" aria-hidden /> Mis cierres ({closings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {closings.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes compras en proceso de cierre.</p>}
                {closings.map(c => (
                  <div key={c.id} className="rounded-xl border p-3 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium truncate">
                        {c.project_name ?? 'Proyecto'}{c.lot_number ? ` · Lote ${c.lot_number}` : ''}
                      </p>
                      <Badge variant="outline" className={c.status === 'closed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}>
                        {c.status === 'closed' ? 'Compra completada' : 'En cierre'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtMoney(c.sale_amount, c.currency)}
                      {c.contract_signed_at && <> · Contrato firmado el {fmt(c.contract_signed_at)}</>}
                      {c.closed_at && <> · Cerrado el {fmt(c.closed_at)}</>}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerProgress;
