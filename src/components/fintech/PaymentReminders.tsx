import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle2, Bell } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreditPayment } from '@/hooks/useCredits';

interface PaymentRemindersProps {
  payments: CreditPayment[];
  onRecordPayment?: (paymentId: string) => void;
  isRecording?: boolean;
}

export const PaymentReminders = ({ payments, onRecordPayment, isRecording }: PaymentRemindersProps) => {
  const now = new Date();

  const overduePayments = payments.filter(p => p.status === 'pending' && isPast(new Date(p.due_date)));
  const upcomingPayments = payments.filter(p => {
    if (p.status !== 'pending') return false;
    const due = new Date(p.due_date);
    const days = differenceInDays(due, now);
    return days >= 0 && days <= 7;
  });

  if (overduePayments.length === 0 && upcomingPayments.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-600" />
          Alertas de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overduePayments.map(p => {
          const daysOverdue = differenceInDays(now, new Date(p.due_date));
          return (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">Cuota #{p.payment_number} vencida</p>
                  <p className="text-xs text-muted-foreground">
                    Venció {format(new Date(p.due_date), 'dd MMM yyyy', { locale: es })} · {daysOverdue} días de atraso
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">${Number(p.amount).toLocaleString('es-CL')}</Badge>
                {onRecordPayment && (
                  <Button size="sm" variant="outline" className="text-xs" disabled={isRecording} onClick={() => onRecordPayment(p.id)}>
                    Registrar
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {upcomingPayments.map(p => {
          const daysUntil = differenceInDays(new Date(p.due_date), now);
          return (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">Cuota #{p.payment_number} próxima</p>
                  <p className="text-xs text-muted-foreground">
                    Vence {format(new Date(p.due_date), 'dd MMM yyyy', { locale: es })} · {daysUntil === 0 ? 'Hoy' : `en ${daysUntil} días`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">${Number(p.amount).toLocaleString('es-CL')}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
