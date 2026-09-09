import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3, MessageCircle, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useReservations } from '@/hooks/useReservations';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';

const money = (value: number) => new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
}).format(value || 0);

const ExecutiveCommercialDesk = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { data: reservations = [] } = useReservations();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const ownedProjectIds = useMemo(
    () => new Set(projects.filter((project) => project.user_id === user?.id).map((project) => project.id)),
    [projects, user?.id],
  );

  const commercial = useMemo(() => {
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const rows = (reservations as any[]).filter((reservation) => ownedProjectIds.has(reservation.lots?.project_id));

    const pendingPayment = rows
      .filter((reservation) => reservation.status === 'pending_payment' && new Date(reservation.expires_at) >= now)
      .sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());

    const urgentPayment = pendingPayment.filter((reservation) => {
      const expiry = new Date(reservation.expires_at);
      return expiry <= next24h;
    });

    const paidToClose = rows
      .filter((reservation) => reservation.status === 'paid')
      .sort((a, b) => new Date(a.paid_at ?? a.updated_at ?? 0).getTime() - new Date(b.paid_at ?? b.updated_at ?? 0).getTime());

    const closingVolume = paidToClose.reduce((sum, reservation) => sum + Number(reservation.lots?.price || 0), 0);

    return { pendingPayment, urgentPayment, paidToClose, closingVolume };
  }, [reservations, ownedProjectIds, now]);

  if (commercial.pendingPayment.length === 0 && commercial.paidToClose.length === 0) return null;

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Mesa Comercial</CardTitle>
              <Badge variant="outline">Reserva → Venta</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Cobra reservas pendientes y convierte pagos confirmados en ventas y comisiones.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link to="/asesor/reservations"><ShoppingCart className="mr-2 h-4 w-4" />Gestionar reservas</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Pendientes de pago" value={String(commercial.pendingPayment.length)} detail="Reservas por cobrar" />
          <Metric label="Vencen ≤ 24 h" value={String(commercial.urgentPayment.length)} detail="Prioridad de cobranza" warning={commercial.urgentPayment.length > 0} />
          <Metric label="Pagadas por cerrar" value={String(commercial.paidToClose.length)} detail="Listas para convertir" strong={commercial.paidToClose.length > 0} />
          <Metric label="Volumen por cerrar" value={money(commercial.closingVolume)} detail="Precio lista estimado" />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {commercial.urgentPayment.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4" />Cobranza urgente</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Primero: {commercial.urgentPayment[0]?.buyer_name}. Hay {commercial.urgentPayment.length} reserva(s) próximas a vencer.
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/asesor/reservations"><MessageCircle className="mr-2 h-4 w-4" />Cobrar</Link>
                </Button>
              </div>
            </div>
          )}

          {commercial.paidToClose.length > 0 && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-semibold"><ArrowUpRight className="h-4 w-4" />Ventas listas para cierre</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Primero: {commercial.paidToClose[0]?.buyer_name}. Convierte la reserva pagada y genera la comisión.
                  </p>
                </div>
                <Button size="sm" asChild>
                  <Link to="/asesor/reservations"><ArrowUpRight className="mr-2 h-4 w-4" />Cerrar venta</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Metric = ({ label, value, detail, warning, strong }: { label: string; value: string; detail: string; warning?: boolean; strong?: boolean }) => (
  <div className={`rounded-xl border p-4 ${warning ? 'border-amber-500/30' : strong ? 'border-emerald-500/30' : ''}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{detail}</p>
  </div>
);

export default ExecutiveCommercialDesk;
