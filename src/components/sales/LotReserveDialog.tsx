import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import type { SalesLot } from './LotSalesSheet';

interface LotReserveDialogProps {
  lot: SalesLot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
}

/**
 * Reserva real de una parcela: escribe en `reservations` mediante la función
 * `create_public_reservation` (48 h de vigencia, monto tomado del proyecto),
 * de modo que la reserva aparece de inmediato en el panel del vendedor.
 */
export const LotReserveDialog = ({ lot, open, onOpenChange, projectName }: LotReserveDialogProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rut, setRut] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = name.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && !submitting;

  const submit = async () => {
    if (!lot) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('create_public_reservation', {
        p_lot_id: lot.id,
        p_buyer_name: name.trim(),
        p_buyer_email: email.trim(),
        p_buyer_phone: phone.trim() || undefined,
        p_buyer_rut: rut.trim() || undefined,
        p_notes:
          [`Reserva desde landing ${projectName}`, notes.trim() || null].filter(Boolean).join(' · '),
      });
      if (error) throw error;
      setDone(true);
      toast.success('Reserva registrada. El equipo comercial te contactará para confirmarla.');
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos registrar la reserva. Intenta nuevamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setDone(false);
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reservar lote {lot?.lot_number ?? ''}</DialogTitle>
          <DialogDescription>
            {projectName} · La reserva queda vigente 48 horas mientras se confirma con el equipo
            comercial.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ✅ Tu reserva del lote {lot?.lot_number ?? ''} quedó registrada. Te contactaremos para
            coordinar el pago de la señal.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="res-name">Nombre *</Label>
                <Input id="res-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="res-email">Email *</Label>
                <Input
                  id="res-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="res-phone">Teléfono</Label>
                <Input id="res-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="res-rut">RUT</Label>
                <Input id="res-rut" value={rut} onChange={(e) => setRut(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="res-notes">Comentarios</Label>
              <Textarea
                id="res-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button className="w-full min-h-11" disabled={!canSubmit} onClick={submit}>
              {submitting ? 'Registrando…' : 'Confirmar reserva'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LotReserveDialog;
