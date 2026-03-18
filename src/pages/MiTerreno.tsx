import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import { useClosingSteps } from '@/hooks/useClosingSteps';
import { useCreditPayments } from '@/hooks/useCredits';
import { ClosingTimeline } from '@/components/closing/ClosingTimeline';
import { TransactionDocuments } from '@/components/closing/TransactionDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin, Ruler, DollarSign, CheckCircle2, Clock, AlertTriangle,
  XCircle, ArrowUpRight, FileText, Download, Calendar, Phone,
  Mail, User, Home, Shield, Scale, MessageCircle, CreditCard,
  Receipt, ChevronRight, ExternalLink, TrendingUp, Palette,
} from 'lucide-react';
import ContractSigningDialog from '@/components/signature/ContractSigningDialog';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { generateContractPDF } from '@/lib/contractPdfGenerator';

const ParcelaDesigner3D = lazy(() =>
  import('@/components/parcela/ParcelaDesigner3D').then(m => ({ default: m.ParcelaDesigner3D }))
);
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ReservationStatus = 'pending_payment' | 'paid' | 'expired' | 'cancelled' | 'converted';

const STATUS_CONFIG: Record<ReservationStatus, { label: string; icon: typeof Clock; className: string; bgClass: string }> = {
  pending_payment: { label: 'Pendiente de Pago', icon: Clock, className: 'text-amber-600', bgClass: 'bg-amber-500/10 border-amber-500/20' },
  paid: { label: 'Reserva Confirmada', icon: CheckCircle2, className: 'text-green-600', bgClass: 'bg-green-500/10 border-green-500/20' },
  expired: { label: 'Expirada', icon: AlertTriangle, className: 'text-red-600', bgClass: 'bg-red-500/10 border-red-500/20' },
  cancelled: { label: 'Cancelada', icon: XCircle, className: 'text-muted-foreground', bgClass: 'bg-muted border-border' },
  converted: { label: 'Venta Completada', icon: ArrowUpRight, className: 'text-blue-600', bgClass: 'bg-blue-500/10 border-blue-500/20' },
};

const TIMELINE_STEPS = [
  { key: 'reserva', label: 'Reserva', description: 'Depósito pagado' },
  { key: 'promesa', label: 'Promesa', description: 'Firma de promesa' },
  { key: 'escritura', label: 'Escritura', description: 'Escritura pública' },
  { key: 'inscripcion_cbr', label: 'Inscripción', description: 'Inscripción CBR' },
];

const MiTerreno = () => {
  const { user } = useAuth();
  const { data: reservations = [], isLoading } = useReservations();

  const userName = user?.user_metadata?.first_name || 'Comprador';

  // Fetch credits for buyer
  const { data: buyerCredits = [] } = useQuery({
    queryKey: ['buyer-credits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('credits')
        .select('*, lots(lot_number, name, area, project_id, projects(name))')
        .eq('buyer_user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link to="/explorar">Explorar</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link to="/">Inicio</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Quick Stats */}
        {activeReservations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={Shield}
              label="Reservas Activas"
              value={activeReservations.length.toString()}
              color="text-primary"
            />
            <StatCard
              icon={DollarSign}
              label="Total Depositado"
              value={`$${activeReservations
                .filter((r: any) => r.status === 'paid' || r.status === 'converted')
                .reduce((s: number, r: any) => s + (r.reservation_amount || 0), 0)
                .toLocaleString('es-CL')}`}
              color="text-green-600"
            />
            <StatCard
              icon={CreditCard}
              label="Créditos Activos"
              value={buyerCredits.filter((c: any) => c.status === 'active').length.toString()}
              color="text-blue-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Valor Total"
              value={`$${activeReservations
                .reduce((s: number, r: any) => s + (r.lots?.price || 0), 0)
                .toLocaleString('es-CL')}`}
              color="text-amber-600"
            />
          </div>
        )}

        {activeReservations.length === 0 && pastReservations.length === 0 && buyerCredits.length === 0 ? (
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
                    <ReservationCard key={r.id} reservation={r} buyerCredits={buyerCredits} />
                  ))}
                </div>
              </section>
            )}

            {/* Active Credits (standalone) */}
            {buyerCredits.filter((c: any) => c.status === 'active').length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Mis Créditos
                </h2>
                <div className="space-y-4">
                  {buyerCredits
                    .filter((c: any) => c.status === 'active')
                    .map((credit: any) => (
                      <CreditSummaryCard key={credit.id} credit={credit} />
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

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <Card className="border-border/40">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

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

const ReservationCard = ({ reservation, buyerCredits }: { reservation: any; buyerCredits: any[] }) => {
  const lot = reservation.lots;
  const project = lot?.projects;
  const status = reservation.status as ReservationStatus;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment;
  const StatusIcon = config.icon;
  const [signingOpen, setSigningOpen] = useState(false);
  const { data: closingSteps = [] } = useClosingSteps(
    ['paid', 'converted'].includes(status) ? reservation.id : null
  );

  // Find linked credit
  const linkedCredit = buyerCredits.find((c: any) => c.reservation_id === reservation.id);

  // Visual timeline progress
  const completedClosingSteps = closingSteps.filter((s: any) => s.status === 'completed');
  const totalSteps = TIMELINE_STEPS.length;
  const progressPercent = Math.round((completedClosingSteps.length / totalSteps) * 100);

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

      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-sm px-4 py-2.5">
              Resumen
            </TabsTrigger>
            {['paid', 'converted'].includes(status) && (
              <>
                <TabsTrigger value="legal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-sm px-4 py-2.5">
                  Cierre Legal
                </TabsTrigger>
                <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-sm px-4 py-2.5">
                  Documentos
                </TabsTrigger>
              </>
            )}
            {linkedCredit && (
              <TabsTrigger value="payments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-sm px-4 py-2.5">
                Pagos
              </TabsTrigger>
            )}
            {['paid', 'converted'].includes(status) && lot?.polygon && (
              <TabsTrigger value="designer" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-sm px-4 py-2.5 gap-1">
                <Palette className="h-3.5 w-3.5" />
                Diseñar
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Proyecto</p>
                  <Link 
                    to={`/proyecto/${project?.id}`} 
                    className="text-lg font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {project?.name || 'Proyecto'}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
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

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Depósito</p>
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

            {/* Visual Progress Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Progreso de Compra</span>
                <span className="text-muted-foreground">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="grid grid-cols-4 gap-1">
                {TIMELINE_STEPS.map((step) => {
                  const closingStep = closingSteps.find((cs: any) => cs.step_type === step.key);
                  const isComplete = closingStep?.status === 'completed';
                  const isInProgress = closingStep?.status === 'in_progress';
                  return (
                    <div key={step.key} className="text-center">
                      <div className={`h-8 w-8 rounded-full mx-auto flex items-center justify-center text-xs font-bold mb-1 transition-colors ${
                        isComplete
                          ? 'bg-primary text-primary-foreground'
                          : isInProgress
                          ? 'bg-primary/30 text-primary border-2 border-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isComplete ? '✓' : isInProgress ? '⏳' : ''}
                      </div>
                      <span className={`text-[10px] leading-tight block ${
                        isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Contact Asesor */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 flex-1 rounded-xl" asChild>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hola, soy ${reservation.buyer_name}. Consulta sobre mi reserva del Lote ${lot?.lot_number} en ${project?.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactar Asesor
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                disabled={!['paid', 'converted'].includes(status)}
                onClick={() => {
                  generateContractPDF({
                    projectName: project?.name || 'Proyecto',
                    projectLocation: project?.location || project?.city || '',
                    projectRol: project?.rol_number || undefined,
                    lotNumber: lot?.lot_number || '',
                    lotArea: lot?.area || 0,
                    lotPrice: lot?.price ?? null,
                    buyerName: reservation.buyer_name,
                    buyerRut: reservation.buyer_rut || undefined,
                    buyerEmail: reservation.buyer_email,
                    buyerPhone: reservation.buyer_phone || undefined,
                    reservationId: reservation.id,
                    reservationAmount: reservation.reservation_amount,
                    currency: reservation.currency,
                    paidAt: reservation.paid_at || undefined,
                    createdAt: reservation.created_at,
                    generatedAt: new Date(),
                  });
                }}
              >
                <Download className="h-4 w-4" />
                Contrato PDF
              </Button>
            </div>
          </TabsContent>

          {/* Legal Tab */}
          {['paid', 'converted'].includes(status) && (
            <TabsContent value="legal" className="p-6 mt-0">
              {closingSteps.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Cierre Legal</h3>
                    </div>
                    {closingSteps.some((s: any) => s.step_type === 'promesa' && (s.status === 'in_progress' || s.status === 'pending')) && (
                      <Button size="sm" className="gap-2" onClick={() => setSigningOpen(true)}>
                        <FileText className="h-4 w-4" />
                        Firmar Contrato
                      </Button>
                    )}
                  </div>
                  <ClosingTimeline steps={closingSteps} />

                  <ContractSigningDialog
                    open={signingOpen}
                    onOpenChange={setSigningOpen}
                    contractData={{
                      projectName: project?.name || 'Proyecto',
                      lotNumber: lot?.lot_number || 'N/A',
                      buyerName: reservation.buyer_name,
                      amount: `$${(reservation.reservation_amount || 0).toLocaleString('es-CL')}`,
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Scale className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Los pasos de cierre legal se activarán cuando el asesor los configure.</p>
                </div>
              )}
            </TabsContent>
          )}

          {/* Documents Tab */}
          {['paid', 'converted'].includes(status) && (
            <TabsContent value="documents" className="p-6 mt-0">
              <TransactionDocuments reservationId={reservation.id} readOnly />
            </TabsContent>
          )}

          {/* Payments Tab */}
          {linkedCredit && (
            <TabsContent value="payments" className="p-6 mt-0">
              <CreditPaymentsView creditId={linkedCredit.id} credit={linkedCredit} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

const CreditPaymentsView = ({ creditId, credit }: { creditId: string; credit: any }) => {
  const { data: payments = [] } = useCreditPayments(creditId);

  const paidCount = payments.filter((p: any) => p.status === 'paid').length;
  const overdueCount = payments.filter((p: any) => p.status === 'overdue').length;
  const nextPayment = payments.find((p: any) => p.status === 'pending');

  return (
    <div className="space-y-4">
      {/* Credit Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Cuota Mensual</p>
          <p className="font-bold text-foreground">${Number(credit.monthly_payment).toLocaleString('es-CL')}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Pagadas</p>
          <p className="font-bold text-green-600">{paidCount} / {payments.length}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">Plazo</p>
          <p className="font-bold text-foreground">{credit.term_months} meses</p>
        </div>
      </div>

      {/* Next Payment Alert */}
      {nextPayment && (
        <Card className={`border ${isPast(new Date(nextPayment.due_date)) ? 'border-destructive/50 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className={`h-5 w-5 ${isPast(new Date(nextPayment.due_date)) ? 'text-destructive' : 'text-primary'}`} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Cuota #{nextPayment.payment_number}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vence: {format(new Date(nextPayment.due_date), 'dd MMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
            <span className="font-bold text-foreground">
              ${Number(nextPayment.amount).toLocaleString('es-CL')}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Overdue Warning */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">{overdueCount} cuota{overdueCount > 1 ? 's' : ''} atrasada{overdueCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Payment History */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {payments.slice(0, 12).map((p: any) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 text-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full ${
                p.status === 'paid' ? 'bg-green-500' :
                p.status === 'overdue' ? 'bg-destructive' :
                'bg-muted-foreground/30'
              }`} />
              <span className="text-muted-foreground">Cuota #{p.payment_number}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(p.due_date), 'dd/MM/yy', { locale: es })}
              </span>
              <Badge variant="outline" className={
                p.status === 'paid' ? 'text-green-600 border-green-500/30' :
                p.status === 'overdue' ? 'text-destructive border-destructive/30' :
                'text-muted-foreground'
              }>
                {p.status === 'paid' ? 'Pagada' : p.status === 'overdue' ? 'Atrasada' : 'Pendiente'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreditSummaryCard = ({ credit }: { credit: any }) => {
  const lotInfo = credit.lots;
  const projectName = lotInfo?.projects?.name || 'Proyecto';

  return (
    <Card className="border-border/40">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Lote {lotInfo?.lot_number} · {projectName}
            </p>
            <p className="text-xs text-muted-foreground">
              ${Number(credit.monthly_payment).toLocaleString('es-CL')}/mes · {credit.term_months} meses
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-foreground">
            ${Number(credit.financed_amount).toLocaleString('es-CL')}
          </p>
          <Badge variant="outline" className="text-xs">
            {credit.status === 'active' ? 'Activo' : credit.status}
          </Badge>
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
              <span className="text-muted-foreground font-normal ml-2">{project?.name}</span>
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
