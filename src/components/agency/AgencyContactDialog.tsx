import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail } from 'lucide-react';
import { useCreatePublicLead } from '@/hooks/useAgencyShowcase';
import { validatePublicLead, type PublicLeadForm } from '@/lib/agency/leadForm';
import { toast } from 'sonner';

const EMPTY: PublicLeadForm = { firstName: '', email: '', phone: '', message: '' };

/** "Solicitar información" form on the public agency showcase. */
export const AgencyContactDialog = ({ slug, agencyName }: { slug: string; agencyName: string }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PublicLeadForm>(EMPTY);
  const create = useCreatePublicLead();

  const set = <K extends keyof PublicLeadForm>(k: K, v: PublicLeadForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const err = validatePublicLead(form);
    if (err) return toast.error(err);
    create.mutate(
      { slug, form },
      { onSuccess: () => { setForm(EMPTY); setOpen(false); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Mail className="h-4 w-4" /> Solicitar información</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contactar a {agencyName}</DialogTitle>
          <DialogDescription>Déjanos tus datos y te contactaremos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre *</Label>
            <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="tu@email.cl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+56 9 …" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mensaje</Label>
            <Textarea rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Me interesa…" />
          </div>
          <Button className="w-full" disabled={create.isPending} onClick={submit}>
            {create.isPending ? 'Enviando…' : 'Enviar'}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Al enviar aceptas ser contactado por la inmobiliaria.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
