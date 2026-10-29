import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Building2, Globe, Webhook, Key, Plus, Trash2, Copy, Check,
  ExternalLink, Loader2,
} from 'lucide-react';
import { useOrganizations, useCreateOrganization, useWebhookSubscriptions, useCreateWebhook, useDeleteWebhook } from '@/hooks/useEnterprise';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';

const WEBHOOK_EVENTS = [
  { value: 'reservation.created', label: 'Reserva creada' },
  { value: 'reservation.paid', label: 'Reserva pagada' },
  { value: 'lead.created', label: 'Lead registrado' },
  { value: 'lot.status_changed', label: 'Cambio estado lote' },
  { value: 'credit.payment_received', label: 'Pago de crédito' },
];

const EnterpriseSettings = () => {
  const { data: orgs = [], isLoading: orgsLoading } = useOrganizations();
  const createOrg = useCreateOrganization();
  const { data: webhooks = [], isLoading: webhooksLoading } = useWebhookSubscriptions();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  // Org form
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [orgOpen, setOrgOpen] = useState(false);

  // Webhook form
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreateOrg = () => {
    if (!orgName || !orgSlug) {
      toast.error('Nombre y slug son requeridos');
      return;
    }
    createOrg.mutate(
      { name: orgName, slug: orgSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), description: orgDesc },
      {
        onSuccess: () => {
          toast.success('Organización creada');
          setOrgOpen(false);
          setOrgName('');
          setOrgSlug('');
          setOrgDesc('');
        },
        onError: () => toast.error('Error al crear organización'),
      }
    );
  };

  const handleCreateWebhook = () => {
    if (!webhookUrl || webhookEvents.length === 0) {
      toast.error('URL y al menos un evento son requeridos');
      return;
    }
    const secret = crypto.randomUUID().replace(/-/g, '');
    createWebhook.mutate(
      { url: webhookUrl, events: webhookEvents, secret },
      {
        onSuccess: () => {
          toast.success('Webhook creado');
          setWebhookOpen(false);
          setWebhookUrl('');
          setWebhookEvents([]);
        },
        onError: () => toast.error('Error al crear webhook'),
      }
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enterprise</h1>
        <p className="text-sm text-muted-foreground">Organizaciones, API pública y webhooks</p>
      </div>

      <Tabs defaultValue="orgs">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="orgs" className="gap-2"><Building2 className="h-4 w-4" />Organización</TabsTrigger>
          <TabsTrigger value="api" className="gap-2"><Key className="h-4 w-4" />API</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2"><Webhook className="h-4 w-4" />Webhooks</TabsTrigger>
        </TabsList>

        {/* Organizations */}
        <TabsContent value="orgs" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mis Organizaciones</h2>
            <Dialog open={orgOpen} onOpenChange={setOrgOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Nueva Organización</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Organización</DialogTitle>
                  <DialogDescription>Configura tu empresa para gestionar múltiples proyectos</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div><Label>Nombre</Label><Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Mi Inmobiliaria" /></div>
                  <div><Label>Slug (URL)</Label><Input value={orgSlug} onChange={e => setOrgSlug(e.target.value)} placeholder="mi-inmobiliaria" /></div>
                  <div><Label>Descripción</Label><Input value={orgDesc} onChange={e => setOrgDesc(e.target.value)} placeholder="Descripción breve" /></div>
                  <Button onClick={handleCreateOrg} disabled={createOrg.isPending} className="w-full">
                    {createOrg.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {orgsLoading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Cargando...</CardContent></Card>
          ) : orgs.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Sin organizaciones</h3>
              <p className="text-sm text-muted-foreground">Crea una organización para agrupar proyectos y gestionar equipos</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {orgs.map((org) => (
                <Card key={org.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl font-bold text-primary-foreground" style={{ backgroundColor: org.primary_color }}>
                        {org.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{org.name}</p>
                        <p className="text-sm text-muted-foreground">{org.slug} · {org.description || 'Sin descripción'}</p>
                      </div>
                    </div>
                    <Badge variant="outline">Owner</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* API */}
        <TabsContent value="api" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />API REST Pública</CardTitle>
              <CardDescription>Endpoints disponibles para integración con sistemas externos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Base URL</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apiBaseUrl, 'base')}>
                    {copied === 'base' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <code className="text-xs break-all">{apiBaseUrl}</code>
              </div>

              <div className="space-y-3">
                {[
                  { method: 'GET', endpoint: '?endpoint=listings', desc: 'Listar propiedades activas con filtros', params: 'type, country, region, city, min_price, max_price, min_area, max_area, limit, offset' },
                  { method: 'GET', endpoint: '?endpoint=projects', desc: 'Listar proyectos activos', params: 'limit' },
                  { method: 'GET', endpoint: '?endpoint=lots&project_id=UUID', desc: 'Lotes de un proyecto con disponibilidad', params: 'project_id' },
                  { method: 'GET', endpoint: '?endpoint=stats', desc: 'Estadísticas globales de la plataforma', params: '' },
                ].map((ep, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Badge variant="secondary" className="shrink-0 mt-0.5">{ep.method}</Badge>
                    <div className="flex-1 min-w-0">
                      <code className="text-xs font-mono break-all">{ep.endpoint}</code>
                      <p className="text-xs text-muted-foreground mt-1">{ep.desc}</p>
                      {ep.params && <p className="text-xs text-muted-foreground">Params: {ep.params}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Nota:</strong> La API pública expone solo datos de listings y proyectos con status "active". 
                  No se requiere autenticación para lectura.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Webhooks</h2>
            <Dialog open={webhookOpen} onOpenChange={setWebhookOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Nuevo Webhook</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Webhook</DialogTitle>
                  <DialogDescription>Recibe notificaciones HTTP cuando ocurran eventos en tu cuenta</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>URL del endpoint</Label>
                    <Input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://tu-servidor.com/webhook" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Eventos</Label>
                    <div className="space-y-2">
                      {WEBHOOK_EVENTS.map(ev => (
                        <div key={ev.value} className="flex items-center gap-2">
                          <Checkbox
                            checked={webhookEvents.includes(ev.value)}
                            onCheckedChange={(checked) => {
                              setWebhookEvents(prev =>
                                checked ? [...prev, ev.value] : prev.filter(e => e !== ev.value)
                              );
                            }}
                          />
                          <span className="text-sm">{ev.label}</span>
                          <code className="text-xs text-muted-foreground ml-auto">{ev.value}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreateWebhook} disabled={createWebhook.isPending} className="w-full">
                    {createWebhook.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Webhook
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {webhooksLoading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Cargando...</CardContent></Card>
          ) : (webhooks).length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Sin webhooks configurados</h3>
              <p className="text-sm text-muted-foreground">Los webhooks te notifican automáticamente cuando ocurren eventos como reservas o pagos</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {(webhooks).map((wh) => (
                <Card key={wh.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <code className="text-xs break-all">{wh.url}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={wh.is_active ? 'default' : 'destructive'}>
                          {wh.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWebhook.mutate(wh.id, {
                            onSuccess: () => toast.success('Webhook eliminado'),
                          })}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(wh.events || []).map((ev: string) => (
                        <Badge key={ev} variant="outline" className="text-xs">{ev}</Badge>
                      ))}
                    </div>
                    {wh.failure_count > 0 && (
                      <p className="text-xs text-destructive mt-2">Fallos consecutivos: {wh.failure_count}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnterpriseSettings;
