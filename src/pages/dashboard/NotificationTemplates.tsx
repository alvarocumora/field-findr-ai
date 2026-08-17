import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Loader2, Mail, MessageCircle, RotateCcw, Save } from 'lucide-react';
import { useNotificationTemplates, type ResolvedTemplate } from '@/hooks/useNotificationTemplates';
import {
  EVENT_LABELS,
  TEMPLATE_VARIABLES,
  renderTemplate,
  type NotificationEvent,
} from '@/lib/notifications/templates';
import { useProfile } from '@/hooks/useProfile';

const PREVIEW_VARS = {
  nombre: 'María Pérez',
  email: 'maria@correo.cl',
  telefono: '+56 9 8765 4321',
  propiedad: 'Parcela 12 · Parque Mirador',
  mensaje: 'Me gustaría saber si tiene acceso a agua.',
  fecha: '24 de agosto, 11:00',
  enlace: 'https://ofertaterrenos.com/propiedad/ejemplo',
};

function TemplateEditor({ template, agentName }: { template: ResolvedTemplate; agentName: string }) {
  const { save, reset } = useNotificationTemplates();
  const [subject, setSubject] = useState(template.subject ?? '');
  const [body, setBody] = useState(template.body);
  const [enabled, setEnabled] = useState(template.enabled);

  useEffect(() => {
    setSubject(template.subject ?? '');
    setBody(template.body);
    setEnabled(template.enabled);
  }, [template.id, template.subject, template.body, template.enabled]);

  const isEmail = template.channel === 'email';
  const preview = renderTemplate(body, { ...PREVIEW_VARS, agente: agentName });

  const insertVar = (token: string) => setBody((b) => `${b}${b.endsWith(' ') || !b ? '' : ' '}${token}`);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {isEmail ? <Mail className="h-4 w-4 text-primary" /> : <MessageCircle className="h-4 w-4 text-primary" />}
              {template.title}
              {template.isCustom && <Badge variant="secondary" className="text-[10px]">Personalizada</Badge>}
            </CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor={`enabled-${template.id}`} className="text-xs text-muted-foreground">Activa</Label>
            <Switch id={`enabled-${template.id}`} checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEmail && (
          <div className="space-y-1.5">
            <Label className="text-xs">Asunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto del email" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs">Mensaje</Label>
          <Textarea rows={isEmail ? 8 : 4} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.token}
              type="button"
              onClick={() => insertVar(v.token)}
              title={v.label}
              className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {v.token}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Vista previa</p>
          {isEmail && subject && (
            <p className="mb-2 text-sm font-medium">
              {renderTemplate(subject, { ...PREVIEW_VARS, agente: agentName })}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{preview}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={save.isPending}
            onClick={() =>
              save.mutate({
                event: template.event,
                channel: template.channel,
                audience: template.audience,
                subject: isEmail ? subject : null,
                body,
                enabled,
              })
            }
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
          {template.isCustom && (
            <Button
              size="sm"
              variant="outline"
              disabled={reset.isPending}
              onClick={() =>
                reset.mutate({ event: template.event, channel: template.channel, audience: template.audience })
              }
            >
              <RotateCcw className="h-4 w-4" /> Restaurar original
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Configuración de notificaciones automáticas (WhatsApp y email) por evento. */
const NotificationTemplates = () => {
  const { templates, isLoading } = useNotificationTemplates();
  const { profile } = useProfile();
  const agentName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'tu asesor';

  const events: NotificationEvent[] = ['lead_created', 'visit_requested'];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bell className="h-5 w-5 text-primary" /> Notificaciones automáticas
        </h1>
        <p className="text-sm text-muted-foreground">
          Personaliza los mensajes que se envían por email cuando llega un lead o se agenda una visita, y el texto
          de WhatsApp que se abre con un clic para responder.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="lead_created">
          <TabsList>
            {events.map((e) => (
              <TabsTrigger key={e} value={e}>{EVENT_LABELS[e]}</TabsTrigger>
            ))}
          </TabsList>
          {events.map((e) => (
            <TabsContent key={e} value={e} className="space-y-4 pt-4">
              {templates
                .filter((t) => t.event === e)
                .map((t) => (
                  <TemplateEditor key={t.id} template={t} agentName={agentName} />
                ))}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default NotificationTemplates;
