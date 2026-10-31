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
import { useRegisterSale, useRegisterBrokerProjectSale, useProjectClosingBrokers } from '@/hooks/useReservations';
import { useCommissionRules } from '@/hooks/useAdminCommissions';
import { fixedProjectRule, formatCLPCommission, isFixedBrokerProject } from '@/lib/commissions/fixedProjectRule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ConvertToSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    buyer_name: string;
    reservation_amount: number | null;
    lots?: {
      project_id?: string | null;
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
  const brokerSale = useRegisterBrokerProjectSale();
  const commissionRules = useCommissionRules();
  const projectId = reservation?.lots?.project_id;
  const needsFixedCommission = isFixedBrokerProject(projectId);
  const fixedTerms = projectId ? fixedProjectRule(commissionRules.data ?? [], projectId) : null;
  const brokers = useProjectClosingBrokers(projectId, open && needsFixedCommission);
  const [closingAgentId, setClosingAgentId] = useState('');
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
      setClosingAgentId('');
      setNotes('');
    }
  }, [open, listPrice]);

  const amount = Number(saleAmount) || 0;
  const rate = Number(commissionRate) || 0;
  const commissionAmount = withCommission && rate > 0 ? Math.round((amount * rate) / 100) : 0;
  const deposit = reservation?.reservation_amount ?? 0;
  const balance = Math.max(0, amount - deposit);

  const valid = amount > 0 &&
    (needsFixedCommission
      ? !!fixedTerms && !!closingAgentId && !brokers.isLoading && !brokers.error && !commissionRules.error
      : (!withCommission || (rate >= 0 && rate <= 50)));

  const handleConfirm = () => {
    if (!reservation || !valid) return;
    if (needsFixedCommission) {
      brokerSale.mutate({
        reservationId: reservation.id,
        saleAmount: amount,
        closingAgentId,
        notes: notes.trim() || null,
      }, { onSuccess: () => onOpenChange(false) });
      return;
    }
    registerSale.mutate(
      {
        reservationId: reservation.id,
        saleAmount: amount,
        commissionRate: withCommission && rate > 0 ? rate : null,
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

          {needsFixedCommission ? (
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-semibold">Comisión fija del proyecto</p>
              {commissionRules.isLoading ? (
                <p className="text-xs text-muted-foreground">Consultando condiciones comerciales…</p>
              ) : fixedTerms ? (
                <>
                  <p className="text-sm">
                    Vendedor: <strong>{formatCLPCommission(fixedTerms.seller)}</strong>
                    {' · '}Captación: <strong>{fixedTerms.captador === null
                      ? 'por acordar' : formatCLPCommission(fixedTerms.captador)}</strong>
                  </p>
                  <Label htmlFor="closing-agent">Vendedor aprobado responsable *</Label>
                  <Select value={closingAgentId} onValueChange={setClosingAgentId}>
                    <SelectTrigger id="closing-agent"><SelectValue placeholder="Seleccionar vendedor" /></SelectTrigger>
                    <SelectContent>
                      {(brokers.data ?? []).map((broker) => (
                        <SelectItem key={broker.user_id} value={broker.user_id}>{broker.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {brokers.isLoading && <p className="text-xs text-muted-foreground">Consultando brokers aprobados…</p>}
                  {brokers.error && <p className="text-xs text-destructive">No se pudo validar a los vendedores autorizados.</p>}
                  {!brokers.isLoading && !brokers.error && (brokers.data ?? []).length === 0 &&
                    <p className="text-xs text-destructive">No hay vendedores aprobados para este proyecto. Debes aprobar una asignación antes del cierre.</p>}
                  <p className="text-xs text-muted-foreground">
                    El captador se verifica con la reserva registrada. Si es la misma persona que el vendedor,
                    el cierre requiere revisión comercial. Ningún pago se confirma automáticamente.
                  </p>
                </>
              ) : (
                <p className="text-xs text-destructive">
                  No encontramos la regla fija de este proyecto en la base de datos.
                  Instala las migraciones antes de registrar la venta.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="with-commission" className="text-sm">Generar comisión</Label>
                <p className="text-xs text-muted-foreground">Registra tu comisión de venta</p>
              </div>
              <Switch id="with-commission" checked={withCommission} onCheckedChange={setWithCommission} />
            </div>
          )}

          {!needsFixedCommission && withCommission && (
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
          <Button onClick={handleConfirm} disabled={!valid || registerSale.isPending || brokerSale.isPending} className="gap-1.5">
            {(registerSale.isPending || brokerSale.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar venta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertToSaleDialog;
