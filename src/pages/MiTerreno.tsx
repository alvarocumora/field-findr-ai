import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Ruler,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  FileText,
  Download,
  Calendar,
  Phone,
  Mail,
  User,
  Home,
  Shield,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

type ReservationStatus = 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'converted';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; icon: typeof Clock; className: string; bgClass: string }> = {
  pending_payment: { label: 'Pendiente de Pago', icon: Clock, className: 'text-amber-600', bgClass: 'bg-amber-500/10 border-amber-500/20' },
  paid: { label: 'Reserva Confirmada', icon: CheckCircle2, className: 'text-green-600', bgClass: 'bg-green-500/10 border-green-500/20' },
  expired: { label: 'Expirada', icon: AlertTriangle, className: 'text-red-600', bgClass: 'bg-red-500/10 border-red-500/20' },
  cancelled: { label: 'Cancelada', icon: XCircle, className: 'text-muted-foreground', bgClass: 'bg-muted border-border' },
  converted: { label: 'Venta Completada', icon: ArrowUpRight, className: 'text-blue-600', bgClass: 'bg-blue-500/10 border-blue-500/20' },
};

const STEPS = [
  { key: 'reservation', label: 'Reserva', statuses: ['pending_payment', 'paid', 'expired', 'cancelled', 'converted'] },
  { key: 'payment', label: 'Pago Seña', statuses: ['paid', 'converted'] },
  { key: 'contract', label: 'Contrato', statuses: ['converted'] },
  { key: 'delivery', label: 'Entrega', statuses: [] as string[] },
];

const MiTerreno = () => {
  const { user } = useAuth();
  const { data: reservations = [], isLoading } = useReservations();

  const userName = user?.user_metadata?.first_name || 'Comprador';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const activeReservations = (reservations as any[]).filter(
    (r: any) => ['paid', 'pending_payment', 'converted'].includes(r.status)
  );
  const pastReservations = (reservations as any[]).filter(
    (r: any) => ['expired', 'cancelled'].includes(r.status)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Mi Terreno</h1>
              <p className="text-xs text-muted-foreground">Hola, {userName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {activeReservations.length === 0 && pastReservations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Active Reservations */}
            {activeReservations.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Mis Reservas Activas
                </h2>
                <div className="space-y-6">
                  {activeReservations.map((r: any) => (
                    <ReservationCard key={r.id} reservation={r} />
                  ))}
                </div>
              </section>
            )}

            {/* Past Reservations */}
            {pastReservations.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Historial
                </h2>
                <div className="space-y-3">
                  {pastReservations.map((r: any) => (
                    <PastReservationCard key={r.id} reservation={r} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
      <Home className="h-8 w-8 text-muted-foreground" />
    </div>
    <h2 className="text-xl font-semibold text-foreground mb-2">Aún no tienes reservas</h2>
    <p className="text-muted-foreground mb-6 max-w-md">
      Explora nuestros proyectos disponibles y reserva tu lote ideal con solo un clic.
    </p>
    <Button asChild className="rounded-xl">
      <Link to="/explorar">Explorar Proyectos</Link>
    </Button>
  </div>
);

const ReservationCard = ({ reservation }: { reservation: any }) => {
  const lot = reservation.lots;
  const project = lot?.projects;
  const status = reservation.status as ReservationStatus;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment;
  const StatusIcon = config.icon;

  // Calculate progress
  const completedSteps = STEPS.filter(s => s.statuses.includes(status)).length;
  const progressPercent = Math.round((completedSteps / STEPS.length) * 100);

  return (
    <Card className="border-border/40 overflow-hidden">
      {/* Status Banner */}
      <div className={`px-4 py-3 border-b ${config.bgClass} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${config.className}`} />
          <span className={`font-semibold text-sm ${config.className}`}>{config.label}</span>
        </div>
        {status === 'pending_payment' && (
          <span className="text-xs text-amber-600">
            Expira: {format(new Date(reservation.expires_at), 'dd/MM/yyyy HH:mm', { locale: es })}
          </span>
        )}
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Lot & Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Proyecto</p>
              <h3 className="text-lg font-bold text-foreground">{project?.name || 'Proyecto'}</h3>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Lote</p>
              <h4 className="text-base font-semibold text-foreground">
                {lot?.name || `Lote ${lot?.lot_number}`}
              </h4>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Ruler className="h-4 w-4" />
                {lot?.area} m²
              </span>
              {lot?.price && (
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <DollarSign className="h-4 w-4" />
                  ${lot.price.toLocaleString('es-CL')}
                </span>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Seña Pagada</p>
              <p className="text-2xl font-bold text-foreground">
                ${reservation.reservation_amount?.toLocaleString('es-CL')}
                <span className="text-sm font-normal text-muted-foreground ml-1">{reservation.currency}</span>
              </p>
            </div>
            {reservation.paid_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Pagado el {format(new Date(reservation.paid_at), 'dd MMM yyyy', { locale: es })}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Reservado el {format(new Date(reservation.created_at), 'dd MMM yyyy', { locale: es })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Progress Tracker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Progreso</span>
            <span className="text-muted-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((step, i) => {
              const isComplete = step.statuses.includes(status);
              return (
                <div key={step.key} className="text-center">
                  <div className={`h-8 w-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1 ${
                    isComplete
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isComplete ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Buyer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span>{reservation.buyer_name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{reservation.buyer_email}</span>
          </div>
          {reservation.buyer_phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{reservation.buyer_phone}</span>
            </div>
          )}
        </div>

        {/* Documents placeholder */}
        <div className="rounded-xl border border-dashed border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Documentos</p>
              <p className="text-xs text-muted-foreground">
                {status === 'converted'
                  ? 'Tu contrato estará disponible próximamente'
                  : 'Los documentos estarán disponibles una vez completada la venta'}
              </p>
            </div>
            <Button variant="outline" size="sm" disabled className="rounded-xl gap-1">
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PastReservationCard = ({ reservation }: { reservation: any }) => {
  const lot = reservation.lots;
  const project = lot?.projects;
  const status = reservation.status as ReservationStatus;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.cancelled;

  return (
    <Card className="border-border/40 opacity-70">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <config.icon className={`h-5 w-5 ${config.className}`} />
          <div>
            <p className="text-sm font-medium text-foreground">
              {lot?.name || `Lote ${lot?.lot_number}`}
              <span className="text-muted-foreground font-normal ml-2">
                {project?.name}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(reservation.created_at), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={config.bgClass}>
          {config.label}
        </Badge>
      </CardContent>
    </Card>
  );
};

export default MiTerreno;
