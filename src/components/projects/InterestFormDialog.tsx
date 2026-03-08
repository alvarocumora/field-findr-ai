import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Send, Ruler, DollarSign, MapPin } from 'lucide-react';

interface InterestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lot: {
    id: string;
    lot_number: string;
    area: number;
    price: number | null;
    name?: string | null;
  } | null;
  projectName: string;
  projectId: string;
  projectOwnerId: string;
  simulationSummary?: string;
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price);
};

export const InterestFormDialog = ({
  open,
  onOpenChange,
  lot,
  projectName,
  projectId,
  projectOwnerId,
  simulationSummary,
}: InterestFormDialogProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lot || !name.trim() || !email.trim()) return;

    setSubmitting(true);
    try {
      // Create lead for the project owner
      const { error } = await supabase.from('leads').insert({
        user_id: projectOwnerId,
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || null,
        email: email.trim(),
        phone: phone.trim() || null,
        project_id: projectId,
        lot_id: lot.id,
        source: 'cotizador_publico',
        status: 'new',
        notes: [
          `Interesado en Lote ${lot.lot_number} (${Number(lot.area).toLocaleString()} m²)`,
          lot.price ? `Precio: ${formatPrice(lot.price)}` : '',
          simulationSummary ? `Simulación: ${simulationSummary}` : '',
          message ? `Mensaje: ${message}` : '',
        ].filter(Boolean).join('\n'),
        budget_min: lot.price ? lot.price * 0.8 : null,
        budget_max: lot.price ? lot.price * 1.2 : null,
        preferred_area_min: Number(lot.area) * 0.8,
        preferred_area_max: Number(lot.area) * 1.2,
      } as any);

      if (error) throw error;

      toast.success('¡Solicitud enviada!', {
        description: 'Un asesor se pondrá en contacto contigo pronto.',
      });
      onOpenChange(false);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      toast.error('Error al enviar', { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!lot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Solicitar Información
          </DialogTitle>
          <DialogDescription>
            Completa tus datos y un asesor te contactará sobre este lote.
          </DialogDescription>
        </DialogHeader>

        {/* Lot Summary */}
        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Lote {lot.lot_number}</span>
            <Badge variant="outline">{projectName}</Badge>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {Number(lot.area).toLocaleString()} m²
            </span>
            {lot.price && (
              <span className="flex items-center gap-1 text-foreground font-medium">
                <DollarSign className="h-3.5 w-3.5" />
                {formatPrice(lot.price)}
              </span>
            )}
          </div>
          {simulationSummary && (
            <p className="text-xs text-primary bg-primary/5 rounded px-2 py-1">
              💰 {simulationSummary}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interest-name">Nombre completo *</Label>
            <Input
              id="interest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest-email">Email *</Label>
            <Input
              id="interest-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@email.com"
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest-phone">Teléfono</Label>
            <Input
              id="interest-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              maxLength={20}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interest-message">Mensaje (opcional)</Label>
            <Textarea
              id="interest-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="¿Alguna pregunta sobre el lote?"
              rows={2}
              maxLength={500}
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Al enviar, aceptas ser contactado por un asesor del proyecto.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
