import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getReferralCode } from '@/lib/referrals/attribution';
import { shareAttribution } from '@/lib/landing/shareAttribution';

interface Props {
  projectId: string;
  projectOwnerId: string;
  projectSlug: string;
  /** Lote preseleccionado (al hacer clic en el masterplan). */
  lot?: { id: string; lot_number?: string | null } | null;
  onSuccess?: () => void;
}

/**
 * Formulario de contacto de la landing genérica: crea el lead vía la edge
 * function `submit-interest` (misma vía que el resto del sitio), así queda
 * en el CRM del dueño del proyecto — nunca más leads perdidos en un mailto.
 */
export const LandingLeadForm = ({ projectId, projectOwnerId, projectSlug, lot, onSuccess }: Props) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = firstName.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const notes = [
        lot?.lot_number ? `[Lote] ${lot.lot_number}` : null,
        shareAttribution(window.location.search),
        message.trim() ? `[Mensaje] ${message.trim()}` : null,
      ].filter(Boolean).join(' · ');
      const { data, error } = await supabase.functions.invoke('submit-interest', {
        body: {
          referralCode: getReferralCode() ?? undefined,
          projectOwnerId,
          projectId,
          lotId: lot?.id || undefined,
          firstName: firstName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          source: lot ? `landing-${projectSlug}-lote-${lot.lot_number ?? ''}` : `landing-${projectSlug}`,
          notes: notes || undefined,
        },
      });
      if (error || (data as { error?: string } | null)?.error) {
        throw new Error((data as { error?: string } | null)?.error || error?.message);
      }
      setDone(true);
      toast.success('¡Contacto enviado! Te escribiremos pronto.');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'No pudimos enviar tu consulta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        ✅ Recibimos tu consulta{lot?.lot_number ? ` por el lote ${lot.lot_number}` : ''}. Te contactaremos a la brevedad.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {lot?.lot_number && (
        <p className="text-sm font-medium text-primary">Consulta por el Lote {lot.lot_number}</p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="ll-name">Nombre *</Label>
          <Input id="ll-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Tu nombre" />
        </div>
        <div>
          <Label htmlFor="ll-phone">Teléfono</Label>
          <Input id="ll-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+56 9 …" />
        </div>
      </div>
      <div>
        <Label htmlFor="ll-email">Email *</Label>
        <Input id="ll-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.cl" />
      </div>
      <div>
        <Label htmlFor="ll-msg">Mensaje</Label>
        <Textarea id="ll-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Quiero más información sobre este proyecto…" />
      </div>
      <Button className="w-full" disabled={!canSubmit || submitting} onClick={submit}>
        <Send className="h-4 w-4 mr-2" />
        {submitting ? 'Enviando…' : 'Enviar consulta'}
      </Button>
    </div>
  );
};
