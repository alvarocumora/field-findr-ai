import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { LifeBuoy } from 'lucide-react';
import { useCreateTicket } from '@/hooks/useSupportTickets';
import { SUPPORT_CATEGORIES, TICKET_PRIORITIES } from '@/lib/support/helpCenter';

interface Props {
  defaultCategory?: string;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary';
}

export const NewTicketDialog = ({
  defaultCategory = 'otro',
  triggerLabel = 'Abrir ticket',
  triggerVariant = 'default',
}: Props) => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  const [priority, setPriority] = useState('normal');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const create = useCreateTicket();

  const submit = () => {
    if (subject.trim().length < 4 || description.trim().length < 10) return;
    create.mutate(
      { category, priority, subject, description },
      {
        onSuccess: () => {
          setOpen(false);
          setSubject('');
          setDescription('');
          setPriority('normal');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="gap-2">
          <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo ticket de soporte</DialogTitle>
          <DialogDescription>
            Cuéntanos qué necesitas. Un administrador te responderá en esta misma conversación.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="ticket-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="ticket-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Asunto</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Diferencia en comisión de venta lote 24"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Detalle</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Incluye IDs, fechas y pasos para reproducir el problema."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={create.isPending || subject.trim().length < 4 || description.trim().length < 10}
          >
            Crear ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;
