import { useEffect, useMemo, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { LEAD_STATUS_CONFIG, type Lead, type LeadStatus, useLeads } from '@/hooks/useLeads';
import LeadScoreBadge from '@/components/leads/LeadScoreBadge';
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates';
import { useProfile } from '@/hooks/useProfile';
import { renderTemplate, whatsappLink } from '@/lib/notifications/templates';

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_REPLY = 1000;

/** Parsea la bitácora almacenada en `notes` (formato "[fecha] texto" por línea). */
function parseTimeline(notes?: string | null) {
  if (!notes) return [] as { stamp: string | null; text: string }[];
  return notes
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[([^\]]+)\]\s*(.*)$/);
      return match ? { stamp: match[1], text: match[2] } : { stamp: null, text: line };
    })
    .reverse();
}

const toDateInput = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  const { updateLead } = useLeads();
  const { getTemplate } = useNotificationTemplates();
  const { profile } = useProfile();
  const [status, setStatus] = useState<LeadStatus>('new');
  const [followUp, setFollowUp] = useState('');
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (!lead) return;
    setStatus((lead.status || 'new') as LeadStatus);
    setFollowUp(toDateInput(lead.next_follow_up));
    setReply('');
  }, [lead?.id, lead?.status, lead?.next_follow_up]);

  const timeline = useMemo(() => parseTimeline(lead?.notes), [lead?.notes]);

  if (!lead) return null;

  const fullName = `${lead.first_name} ${lead.last_name || ''}`.trim();
  const phoneDigits = (lead.phone || '').replace(/\D/g, '');
  const saving = updateLead.isPending;

  const handleSaveTracking = () => {
    updateLead.mutate({
      id: lead.id,
      status,
      next_follow_up: followUp ? new Date(`${followUp}T12:00:00`).toISOString() : null,
    });
  };

  const handleAddReply = () => {
    const text = reply.trim().slice(0, MAX_REPLY);
    if (!text) return;
    const stamp = new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
    const entry = `[${stamp}] ${text}`;
    updateLead.mutate(
      { id: lead.id, notes: lead.notes ? `${lead.notes}\n${entry}` : entry },
      { onSuccess: () => setReply('') },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>{fullName}</SheetTitle>
          <SheetDescription>
            {lead.source ? `Origen: ${lead.source}` : 'Sin origen registrado'} · Creado{' '}
            {new Date(lead.created_at).toLocaleDateString('es-CL')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge className={`${LEAD_STATUS_CONFIG[status]?.color} text-primary-foreground`}>
            {LEAD_STATUS_CONFIG[status]?.label}
          </Badge>
          <LeadScoreBadge lead={lead} />
        </div>

        {/* Contacto rápido */}
        <div className="mt-4 flex flex-wrap gap-2">
          {lead.phone && (
            <>
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${lead.phone}`} aria-label={`Llamar a ${fullName}`}>
                  <Phone className="h-4 w-4" /> Llamar
                </a>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a
                  href={whatsappLink(phoneDigits, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Escribir por WhatsApp a ${fullName}`}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
            </>
          )}
          {lead.email && (
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:${lead.email}`} aria-label={`Enviar email a ${fullName}`}>
                <Mail className="h-4 w-4" /> Email
              </a>
            </Button>
          )}
        </div>

        <Separator className="my-5" />

        {/* Estado y seguimiento */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-status">Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger id="lead-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_STATUS_CONFIG).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-followup">Próximo seguimiento</Label>
            <Input
              id="lead-followup"
              type="date"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
            />
          </div>

          <Button onClick={handleSaveTracking} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar seguimiento
          </Button>
        </div>

        <Separator className="my-5" />

        {/* Bitácora de respuestas */}
        <div className="space-y-3">
          <Label htmlFor="lead-reply">Registrar respuesta o nota</Label>
          <Textarea
            id="lead-reply"
            value={reply}
            maxLength={MAX_REPLY}
            rows={3}
            placeholder="Ej: Llamada realizada, pide visita el sábado…"
            onChange={(e) => setReply(e.target.value)}
          />
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleAddReply}
            disabled={saving || !reply.trim()}
          >
            <Send className="h-4 w-4" /> Añadir a la bitácora
          </Button>

          <div className="space-y-2 pt-2">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin interacciones registradas todavía.</p>
            ) : (
              timeline.map((item, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/40 p-3">
                  {item.stamp && (
                    <p className="text-xs text-muted-foreground">{item.stamp}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{item.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default LeadDetailSheet;
