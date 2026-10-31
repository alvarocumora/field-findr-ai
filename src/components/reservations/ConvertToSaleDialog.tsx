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
import { useCommissionRules } from '@/hooks/useAdminCommissions';
import { fixedProjectRule } from '@/lib/commissions/fixedProjectRule';

interface ConvertToSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    buyer_name: string;
    reservation_amount: number | null;
    lots?: {
      lot_number?: string | null;
      name?: string | null;
      price?: number | null;
      area?: number | null;
      project_id?: string | null;
    } | null;
  } | null;
}

const MIN_FIXED_SALE_CLP = 1_000_000;

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

/**
 * Closes a sale from a paid reservation: captures the final negotiated price
 * and converts atomically via the register_sale RPC (lot → sold, final price
 * recorded). The commission comes from the project rule (fixed CLP amounts set
 * by the project owner), never from a rate typed here.
 */
const ConvertToSaleDialog = ({ open, onOpenChange, reservation }: ConvertToSaleDialogProps) => {
  const registerSale = useRegisterSale();
  const [saleAmount, setSaleAmount] = useState('');
  const [withCommission, setWithCommission] = useState(true);
  const [notes, setNotes] = useState('');
  const rules = useCommissionRules();

  const lot = reservation?.lots;
  const fixed = lot?.project_id ? fixedProjectRule(rules.data ?? [], lot.project_id) : null;
  const listPrice = lot?.price ?? null;

  // Prefill the sale amount with the lot's list price each time it opens.
  useEffect(() => {
    if (open) {
      setSaleAmount(listPrice ? String(listPrice) : '');
      setNotes('');
    }
  }, [open, listPrice]);

  const amount = Number(saleAmount) || 0;
  const deposit = reservation?.reservation_amount ?? 0;
  const balance = Math.max(0, amount - deposit);

  // La comisión fija se aplica a precios en pesos; bajo $1.000.000 el trigger
  // de la base no la aplicaría (umbral CLP/UF) y quedaría en cero.
  const belowFixedMinimum = withCommission && fixed !== null && amount > 0 && amount < MIN_FIXED_SALE_CLP;
  const valid = amount > 0 && !belowFixedMinimum;

  const handleConfirm = () => {
    if (!reservation || !valid) return;
    registerSale.mutate(
      {
        reservationId: reservation.id,
        saleAmount: amount,
        // null = la base aplica la regla del proyecto; 0 = sin comisión.
        commissionRate: withCommission ? null : 0,
        notes: notes.trim() || null,
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
            {belowFixedMinimum && (
              <p className="text-xs text-destructive">
                Con comisión fija el precio debe estar en pesos (desde {formatCLP(MIN_FIXED_SALE_CLP)}).
              </p>
            )}
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
              <p className="text-xs text-muted-foreground">Según la comisión fijada en el proyecto</p>
            </div>
            <Switch id="with-commission" checked={withCommission} onCheckedChange={setWithCommission} />
          </div>

          {withCommission && (
            <div className="rounded-lg border p-3 text-xs space-y-1" aria-live="polite">
              {fixed ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comisión por venta</span>
                    <span className="font-semibold tabular-nums">{formatCLP(fixed.seller)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Captación (si hay broker referido)</span>
                    <span className="font-medium tabular-nums">
                      {fixed.captador === null ? 'Sin monto fijo' : formatCLP(fixed.captador)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {rules.isLoading
                    ? 'Cargando la comisión del proyecto…'
                    : 'El proyecto no tiene comisión fija: se aplica la regla general de la plataforma.'}
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
