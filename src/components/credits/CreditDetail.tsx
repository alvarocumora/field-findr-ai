import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Credit, useCreditPayments, useRecordPayment } from '@/hooks/useCredits';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const PAYMENT_STATUS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  paid: { label: 'Pagado', color: 'text-green-600 bg-green-500/10', icon: CheckCircle2 },
  pending: { label: 'Pendiente', color: 'text-amber-600 bg-amber-500/10', icon: Clock },
  overdue: { label: 'Vencido', color: 'text-red-600 bg-red-500/10', icon: AlertTriangle },
  partial: { label: 'Parcial', color: 'text-blue-600 bg-blue-500/10', icon: DollarSign },
};

export function CreditDetail({ credit, onBack }: { credit: Credit; onBack: () => void }) {
  const { data: payments = [], isLoading } = useCreditPayments(credit.id);
  const recordPayment = useRecordPayment();

  const paidCount = payments.filter(p => p.status === 'paid').length;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  const handleRecordPayment = (paymentId: string) => {
    recordPayment.mutate(
      { paymentId, paidDate: new Date().toISOString(), method: 'manual' },
      {
        onSuccess: () => toast.success('Pago registrado'),
        onError: () => toast.error('Error al registrar pago'),
      }
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Crédito — Lote {(credit as any).lots?.lot_number}
        </h1>
        <p className="text-sm text-muted-foreground">
          {(credit as any).lots?.projects?.name}
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: `$${Number(credit.total_amount).toLocaleString('es-CL')}` },
          { label: 'Pie', value: `$${Number(credit.down_payment).toLocaleString('es-CL')}` },
          { label: 'Financiado', value: `$${Number(credit.financed_amount).toLocaleString('es-CL')}` },
          { label: 'Cuota Mensual', value: `$${Number(credit.monthly_payment).toLocaleString('es-CL')}` },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progreso: {paidCount}/{payments.length} cuotas</span>
        <span className="font-medium text-foreground">Pagado: ${totalPaid.toLocaleString('es-CL')}</span>
      </CardContent></Card>

      <Separator />

      {/* Payment Calendar */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Calendario de Pagos</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {payments.map(p => {
              const config = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending;
              const Icon = config.icon;
              return (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Cuota #{p.payment_number}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence: {format(new Date(p.due_date), 'dd MMM yyyy', { locale: es })}
                        {p.paid_date && ` · Pagado: ${format(new Date(p.paid_date), 'dd MMM yyyy', { locale: es })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      ${Number(p.amount).toLocaleString('es-CL')}
                    </span>
                    {(p.status === 'pending' || p.status === 'overdue') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs"
                        disabled={recordPayment.isPending}
                        onClick={() => handleRecordPayment(p.id)}
                      >
                        Registrar Pago
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
