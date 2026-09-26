import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useRegisterSale } from '@/hooks/useReservations';

interface ConvertToSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    buyer_name: string;
    reservation_amount: number | null;
    lead_id?: string | null;
    lots?: {
      lot_number?: string | null;
      name?: string | null;
      price?: number | null;
      area?: number | null;
    } | null;
  } | null;
}

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

/**
 * Closes a sale from a paid reservation: captures the final negotiated price,
 * optionally generates the agent commission, and converts atomically via the
 * register_sale RPC (lot → sold, final price recorded, commission created).
 */
const ConvertToSaleDialog = ({ open, onOpenChange, reservation }: ConvertToSaleDialogProps) => {
  const registerSale = useRegisterSale();
  const [saleAmount, setSaleAmount] = useState('');
  const [withCommission, setWithCommission] = useState(true);
  const [commissionRate, setCommissionRate] = useState('3');
  const [notes, setNotes] = useState('');

  const lot = reservation?.lots;
  const listPrice = lot?.price ?? null;

  // Prefill the sale amount with the lot's list price each time it opens.
  useEffect(() => {
    if (open) {
      setSaleAmount(listPrice ? String(listPrice) : '');
      setNotes('');
    }
  }, [open, listPrice]);

  const amount = Number(saleAmount) || 0;
  const rate = Number(commissionRate) || 0;
  const commissionAmount = withCommission && rate > 0 ? Math.round((amount * rate) / 100) : 0;
  const deposit = reservation?.reservation_amount ?? 0;
  const balance = Math.max(0, amount - deposit);

  const valid = amount > 0 && (!withCommission || (rate >= 0 && rate <= 50));

  const handleConfirm = () => {
    if (!reservation || !valid) return;
    registerSale.mutate(
      {
        reservationId: reservation.id,
        saleAmount: amount,
        commissionRate: withCommission && rate > 0 ? rate : null,
        notes: notes.trim() || null,
        leadId: reservation.lead_id ?? null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  if (!reservation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            Registrar venta
          </DialogTitle>
          <DialogDescription>
            {lot?.name || `Lote ${lot?.lot_number ?? ''}`} · Comprador: {reservation.buyer_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="sale-amount">Precio final de venta (CLP)</Label>
            <Input
              id="sale-amount"
              type="number"
              min={1}
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
            />
            {listPrice !== null && amount > 0 && amount !== listPrice && (
              <p className="text-xs text-muted-foreground">
                Precio de lista: {formatCLP(listPrice)} ·{' '}
                <span className={amount < listPrice ? 'text-amber-600' : 'text-green-600'}>
                  {amount < listPrice ? '−' : '+'}
                  {Math.abs(Math.round(((amount - listPrice) / listPrice) * 100))}%
                </span>
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Seña pagada</span>
              <span className="font-medium tabular-nums">{formatCLP(deposit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saldo por cobrar</span>
              <span className="font-semibold tabular-nums">{formatCLP(balance)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="with-commission" className="text-sm">Generar comisión</Label>
              <p className="text-xs text-muted-foreground">Registra tu comisión de venta</p>
            </div>
            <Switch id="with-commission" checked={withCommission} onCheckedChange={setWithCommission} />
          </div>

          {withCommission && (
            <div className="space-y-1.5">
              <Label htmlFor="commission-rate">Tasa de comisión (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min={0}
                max={50}
                step={0.5}
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
              {commissionAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Comisión: <span className="font-semibold text-foreground">{formatCLP(commissionAmount)}</span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sale-notes">Notas (opcional)</Label>
            <Textarea
              id="sale-notes"
              rows={2}
              placeholder="Condiciones, forma de pago, observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!valid || registerSale.isPending} className="gap-1.5">
            {registerSale.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToSaleDialog;
