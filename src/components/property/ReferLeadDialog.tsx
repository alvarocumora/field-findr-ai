import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Handshake, Loader2 } from 'lucide-react';
import { useCreateReferralLead } from '@/hooks/useReferrals.commissions';

interface Props {
  listingId: string;
  listingTitle: string;
  trigger?: React.ReactNode;
}

/**
 * Lets an authenticated broker (agent role) refer a client to another agent's
 * listing. Creates a lead on the listing owner's account with the referring
 * agent recorded — on sale, register_sale generates a split commission.
 */
const ReferLeadDialog = ({ listingId, listingTitle, trigger }: Props) => {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');

  const create = useCreateReferralLead();

  const handleSubmit = () => {
    if (!firstName.trim()) return;
    create.mutate(
      {
        listingId,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setFirstName(''); setLastName(''); setEmail('');
          setPhone(''); setNotes(''); setBudgetMin(''); setBudgetMax('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full gap-2">
            <Handshake className="h-4 w-4" />
            Referir cliente y ganar comisión
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Referir cliente
          </DialogTitle>
          <DialogDescription>
            Registra un cliente interesado en <span className="font-medium">{listingTitle}</span>.
            Si la venta se concreta, recibirás tu comisión de referido automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="col-span-1">
            <Label>Nombre *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label>Apellido</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label>Teléfono</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label>Presupuesto mín</Label>
            <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          </div>
          <div className="col-span-1">
            <Label>Presupuesto máx</Label>
            <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Notas</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto útil para el agente dueño de la propiedad…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!firstName.trim() || create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar referido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReferLeadDialog;
