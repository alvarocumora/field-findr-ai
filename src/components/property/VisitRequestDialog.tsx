import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, User, Mail, Phone, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface VisitRequestDialogProps {
  listingId: string;
  listingOwnerId: string | null;
  listingTitle: string;
  trigger: React.ReactNode;
}

const VisitRequestDialog = ({ listingId, listingOwnerId, listingTitle, trigger }: VisitRequestDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '10:00',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.date) {
      toast({ title: 'Completa los campos obligatorios', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const preferredDate = new Date(`${form.date}T${form.time}:00`);
      
      if (!user) {
        // Visitante sin sesión: se registra como contacto (visita) en el CRM.
        const { error: leadError } = await supabase.rpc('create_listing_lead', {
          p_listing_id: listingId,
          p_first_name: form.name,
          p_email: form.email,
          p_phone: form.phone || null,
          p_message: `[Solicitud de visita] ${form.date} ${form.time} · ${listingTitle}${form.notes ? ` · ${form.notes}` : ''}`,
          p_source: 'visita_publica',
        });
        if (leadError) throw leadError;
        toast({ title: '¡Visita solicitada!', description: 'El agente te contactará para confirmar.' });
        setOpen(false);
        setForm({ name: '', email: '', phone: '', date: '', time: '10:00', notes: '' });
        return;
      }

      const { error } = await supabase.from('visit_requests' as any).insert({
        listing_id: listingId,
        listing_owner_id: listingOwnerId || '',
        requester_user_id: user.id,
        requester_name: form.name,
        requester_email: form.email,
        requester_phone: form.phone || null,
        preferred_date: preferredDate.toISOString(),
        preferred_time: form.time,
        notes: form.notes || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({ title: '¡Visita solicitada!', description: 'El agente te contactará para confirmar.' });
      setOpen(false);
      setForm({ name: '', email: user?.email || '', phone: '', date: '', time: '10:00', notes: '' });
    } catch (err) {
      console.error('Error creating visit request:', err);
      toast({ title: 'Error al solicitar visita', description: 'Intenta nuevamente.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendar visita
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Solicita una visita a "{listingTitle}"
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Nombre *</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tu nombre"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div>
            <Label>Email *</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div>
            <Label>Teléfono</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="+56 9 1234 5678"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha preferida *</Label>
              <Input
                type="date"
                min={minDate}
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Hora preferida</Label>
              <div className="relative mt-1">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Notas adicionales</Label>
            <Textarea
              placeholder="¿Alguna consulta o preferencia?"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Solicitar visita'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisitRequestDialog;
