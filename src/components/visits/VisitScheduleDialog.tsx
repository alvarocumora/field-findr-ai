import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarCheck, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

export interface VisitScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  lotId?: string | null;
  lotNumber?: string | null;
}

const SLOTS = [
  { value: '10:00', label: 'Mañana · 10:00' },
  { value: '12:00', label: 'Mediodía · 12:00' },
  { value: '15:00', label: 'Tarde · 15:00' },
  { value: '17:00', label: 'Tarde · 17:00' },
];

const MODES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'tour', label: 'Tour guiado' },
  { value: 'virtual', label: 'Videollamada' },
];

/**
 * Agendamiento público de visitas: escribe interesado + visita programada con
 * la función `create_public_visit_request`, sin lectura de tablas protegidas.
 */
export const VisitScheduleDialog = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  lotId,
  lotNumber,
}: VisitScheduleDialogProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(SLOTS[0].value);
  const [mode, setMode] = useState('presencial');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const canSubmit =
    name.trim().length > 1 &&
    (/\S+@\S+\.\S+/.test(email) || phone.trim().length >= 8) &&
    !!date &&
    !submitting;

  const reset = () => {
    setName(''); setEmail(''); setPhone(''); setDate('');
    setSlot(SLOTS[0].value); setMode('presencial'); setNotes(''); setDone(false);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const scheduled = new Date(`${date}T${slot}:00`);
      const { error } = await supabase.rpc('create_public_visit_request', {
        p_project_id: projectId,
        p_lot_id: lotId ?? undefined,
        p_name: name.trim(),
        p_email: email.trim() || undefined,
        p_phone: phone.trim() || undefined,
        p_scheduled_at: scheduled.toISOString(),
        p_mode: mode,
        p_notes: [
          `Visita solicitada desde ${projectName}`,
          lotNumber ? `Parcela ${lotNumber}` : null,
          notes.trim() || null,
        ].filter(Boolean).join(' · '),
      } as never);
      if (error) throw error;
      setDone(true);
      toast.success('Visita solicitada. Te confirmaremos el horario a la brevedad.');
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos agendar la visita. Intenta nuevamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Agendar visita
          </DialogTitle>
          <DialogDescription>
            {projectName}
            {lotNumber ? ` · Parcela ${lotNumber}` : ''}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-5 text-center">
            <p className="font-medium">Solicitud recibida</p>
            <p className="text-sm text-muted-foreground">
              Un asesor confirmará tu visita por teléfono o correo. Puedes cerrar esta ventana.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="visit-name">Nombre y apellido *</Label>
              <Input id="visit-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={90} />
            </div>
            <div>
              <Label htmlFor="visit-email">Email</Label>
              <Input id="visit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={140} />
            </div>
            <div>
              <Label htmlFor="visit-phone">Teléfono</Label>
              <Input id="visit-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
            </div>
            <div>
              <Label htmlFor="visit-date">Día preferido *</Label>
              <Input id="visit-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="visit-slot">Horario</Label>
              <select
                id="visit-slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="visit-mode">Modalidad</Label>
              <select
                id="visit-mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="visit-notes">Comentario (opcional)</Label>
              <Textarea id="visit-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
            </div>
            <div className="sm:col-span-2">
              <Button className="w-full" disabled={!canSubmit} onClick={submit}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarCheck className="mr-2 h-4 w-4" />}
                {submitting ? 'Enviando…' : 'Solicitar visita'}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Indícanos email o teléfono para confirmarte el horario.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VisitScheduleDialog;
