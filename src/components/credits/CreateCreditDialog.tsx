import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useCreateCredit, generateAmortizationSchedule } from '@/hooks/useCredits';
import { useReservations } from '@/hooks/useReservations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  trigger?: React.ReactNode;
}

export function CreateCreditDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: reservations = [] } = useReservations();
  const createCredit = useCreateCredit();

  const paidReservations = (reservations as any[]).filter(r => r.status === 'paid');

  const [reservationId, setReservationId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [interestRate, setInterestRate] = useState('12');
  const [termMonths, setTermMonths] = useState('24');

  const financed = Number(totalAmount) - Number(downPayment);
  const preview = financed > 0 && Number(termMonths) > 0
    ? generateAmortizationSchedule(financed, Number(interestRate), Number(termMonths), new Date())
    : null;

  const selectedRes = paidReservations.find(r => r.id === reservationId);

  const handleSubmit = async () => {
    if (!user || !reservationId || !totalAmount || financed <= 0) {
      toast.error('Completa todos los campos');
      return;
    }

    createCredit.mutate({
      reservation_id: reservationId,
      lot_id: selectedRes?.lot_id,
      user_id: user.id,
      total_amount: Number(totalAmount),
      down_payment: Number(downPayment),
      financed_amount: financed,
      interest_rate: Number(interestRate),
      term_months: Number(termMonths),
      monthly_payment: preview?.monthlyPayment || 0,
      payments: preview?.schedule || [],
    }, {
      onSuccess: () => {
        toast.success('Crédito creado exitosamente');
        setOpen(false);
      },
      onError: () => toast.error('Error al crear crédito'),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Crédito Interno</DialogTitle>
          <DialogDescription>Crea un plan de financiamiento directo desde una reserva pagada</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reservación Pagada</Label>
            <Select value={reservationId} onValueChange={setReservationId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar reserva" /></SelectTrigger>
              <SelectContent>
                {paidReservations.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.buyer_name} — Lote {r.lots?.lot_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio Total (CLP)</Label>
              <Input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="50000000" />
            </div>
            <div>
              <Label>Pie (CLP)</Label>
              <Input type="number" value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="10000000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tasa Anual (%)</Label>
              <Input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
            </div>
            <div>
              <Label>Plazo (meses)</Label>
              <Input type="number" value={termMonths} onChange={e => setTermMonths(e.target.value)} />
            </div>
          </div>

          {preview && (
            <div className="rounded-xl border border-border/40 p-4 bg-muted/30 space-y-1">
              <p className="text-sm font-medium text-foreground">Vista Previa</p>
              <p className="text-xs text-muted-foreground">Monto financiado: ${financed.toLocaleString('es-CL')}</p>
              <p className="text-xs text-muted-foreground">Cuota mensual: <span className="font-bold text-foreground">${preview.monthlyPayment.toLocaleString('es-CL')}</span></p>
              <p className="text-xs text-muted-foreground">Total a pagar: ${(preview.monthlyPayment * Number(termMonths)).toLocaleString('es-CL')}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createCredit.isPending}>
              {createCredit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Crédito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
