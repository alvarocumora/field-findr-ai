import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllCreditPayments } from '@/hooks/useAllCreditPayments';
import { useRecordPayment } from '@/hooks/useCredits';
import { formatPriceLatam } from '@/lib/latam';
import { format, isThisMonth, isThisWeek, isPast, isFuture, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Calendar, AlertTriangle, CheckCircle2, Clock, DollarSign,
  TrendingUp, Filter, Download,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  paid: { label: 'Pagado', color: 'text-green-600', variant: 'default' },
  pending: { label: 'Pendiente', color: 'text-amber-600', variant: 'secondary' },
  overdue: { label: 'Vencido', color: 'text-red-600', variant: 'destructive' },
  partial: { label: 'Parcial', color: 'text-blue-600', variant: 'outline' },
};

const PaymentManagement = () => {
  const { data: allPayments = [], isLoading } = useAllCreditPayments();
  const recordPayment = useRecordPayment();
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState('upcoming');

  const handleRecord = (paymentId: string) => {
    recordPayment.mutate(
      { paymentId, paidDate: new Date().toISOString(), method: 'manual' },
      {
        onSuccess: () => toast.success('Pago registrado exitosamente'),
        onError: () => toast.error('Error al registrar pago'),
      }
    );
  };

  const stats = useMemo(() => {
    const overdue = allPayments.filter(p => p.status === 'overdue');
    const pending = allPayments.filter(p => p.status === 'pending');
    const paid = allPayments.filter(p => p.status === 'paid');
    const thisMonthDue = pending.filter(p => isThisMonth(new Date(p.due_date)));
    return {
      overdueCount: overdue.length,
      overdueAmount: overdue.reduce((s, p) => s + Number(p.amount), 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, p) => s + Number(p.amount), 0),
      paidCount: paid.length,
      paidAmount: paid.reduce((s, p) => s + Number(p.amount), 0),
      thisMonthCount: thisMonthDue.length,
      thisMonthAmount: thisMonthDue.reduce((s, p) => s + Number(p.amount), 0),
    };
  }, [allPayments]);

  const filteredPayments = useMemo(() => {
    let filtered = allPayments;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    switch (tab) {
      case 'overdue':
        return filtered.filter(p => p.status === 'overdue').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      case 'upcoming':
        return filtered.filter(p => p.status === 'pending').sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      case 'paid':
        return filtered.filter(p => p.status === 'paid').sort((a, b) => new Date(b.paid_date || b.due_date).getTime() - new Date(a.paid_date || a.due_date).getTime());
      default:
        return filtered.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    }
  }, [allPayments, statusFilter, tab]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Pagos</h1>
        <p className="text-sm text-muted-foreground">Control centralizado de cuotas de créditos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Vencidas</p>
              <p className="text-lg font-bold text-red-600">{stats.overdueCount}</p>
              <p className="text-xs text-muted-foreground">{formatPriceLatam(stats.overdueAmount, 'CLP')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pendientes</p>
              <p className="text-lg font-bold text-amber-600">{stats.pendingCount}</p>
              <p className="text-xs text-muted-foreground">{formatPriceLatam(stats.pendingAmount, 'CLP')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cobrados</p>
              <p className="text-lg font-bold text-green-600">{stats.paidCount}</p>
              <p className="text-xs text-muted-foreground">{formatPriceLatam(stats.paidAmount, 'CLP')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Este Mes</p>
              <p className="text-lg font-bold text-primary">{stats.thisMonthCount}</p>
              <p className="text-xs text-muted-foreground">{formatPriceLatam(stats.thisMonthAmount, 'CLP')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overdue" className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Vencidas {stats.overdueCount > 0 && <Badge variant="destructive" className="ml-1 h-5 text-[10px]">{stats.overdueCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            Próximas
          </TabsTrigger>
          <TabsTrigger value="paid" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pagadas
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            Todas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filteredPayments.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Sin pagos en esta vista</h3>
              <p className="text-sm text-muted-foreground">Los pagos aparecerán aquí cuando se creen créditos.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredPayments.map(p => {
                const config = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                const dueDate = new Date(p.due_date);
                const isUrgent = p.status === 'overdue' || (p.status === 'pending' && isPast(addDays(dueDate, -3)));
                return (
                  <Card key={p.id} className={`${isUrgent && p.status !== 'paid' ? 'border-red-500/30' : ''}`}>
                    <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          p.status === 'paid' ? 'bg-green-500/10' : p.status === 'overdue' ? 'bg-red-500/10' : 'bg-amber-500/10'
                        }`}>
                          {p.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                           p.status === 'overdue' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                           <Clock className="h-4 w-4 text-amber-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.credit_name} — Cuota #{p.payment_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vence: {format(dueDate, 'dd MMM yyyy', { locale: es })}
                            {p.paid_date && ` · Pagado: ${format(new Date(p.paid_date), 'dd MMM yyyy', { locale: es })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground">{formatPriceLatam(Number(p.amount), 'CLP')}</span>
                        <Badge variant={config.variant}>{config.label}</Badge>
                        {(p.status === 'pending' || p.status === 'overdue') && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            disabled={recordPayment.isPending}
                            onClick={() => handleRecord(p.id)}
                          >
                            Registrar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentManagement;
