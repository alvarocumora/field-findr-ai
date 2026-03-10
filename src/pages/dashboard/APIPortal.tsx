import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Globe, Key, Code, Copy, Check, ExternalLink, ArrowRight,
  Webhook, FileJson, Shield, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const APIPortal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState<string | null>(null);
  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

  // API Keys
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const createKey = useMutation({
    mutationFn: async (name: string) => {
      const rawKey = `ot_${crypto.randomUUID().replace(/-/g, '')}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawKey));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from('api_keys').insert({
        user_id: user!.id,
        name,
        key_hash: keyHash,
        key_prefix: rawKey.substring(0, 8),
        scopes: ['read'],
      });
      if (error) throw error;
      return rawKey;
    },
    onSuccess: (key) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      navigator.clipboard.writeText(key);
      toast.success('API Key creada y copiada al portapapeles', {
        description: 'Guárdala en un lugar seguro, no se mostrará de nuevo.',
      });
    },
  });

  const toggleKey = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      method: 'GET',
      path: '?endpoint=listings',
      desc: 'Listar propiedades activas',
      params: ['type', 'country', 'region', 'city', 'min_price', 'max_price', 'min_area', 'max_area', 'limit', 'offset'],
      response: '{ "data": [{ "id", "title", "price", "location", "area_m2", ... }], "count": 42 }',
    },
    {
      method: 'GET',
      path: '?endpoint=projects',
      desc: 'Listar proyectos de loteo activos',
      params: ['limit'],
      response: '{ "data": [{ "id", "name", "city", "total_lots", "available_lots", ... }] }',
    },
    {
      method: 'GET',
      path: '?endpoint=lots&project_id=UUID',
      desc: 'Lotes de un proyecto específico',
      params: ['project_id (required)'],
      response: '{ "data": [{ "id", "lot_number", "area", "price", "status", ... }] }',
    },
    {
      method: 'GET',
      path: '?endpoint=stats',
      desc: 'Estadísticas generales de la plataforma',
      params: [],
      response: '{ "total_listings", "total_projects", "total_lots", "countries": [...] }',
    },
  ];

  const webhookEvents = [
    { event: 'reservation.created', desc: 'Se crea una nueva reserva' },
    { event: 'reservation.paid', desc: 'Un pago de reserva es confirmado' },
    { event: 'lead.created', desc: 'Un nuevo lead se registra' },
    { event: 'lot.status_changed', desc: 'Un lote cambia de estado (disponible → reservado → vendido)' },
    { event: 'credit.payment_received', desc: 'Se recibe un pago de cuota de crédito' },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          Portal de API
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Documentación, claves y webhooks para integrar con portales externos
        </p>
      </div>

      <Tabs defaultValue="docs">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="docs" className="gap-2"><Code className="h-4 w-4" />Documentación</TabsTrigger>
          <TabsTrigger value="keys" className="gap-2"><Key className="h-4 w-4" />API Keys</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2"><Webhook className="h-4 w-4" />Webhooks</TabsTrigger>
        </TabsList>

        {/* Documentation */}
        <TabsContent value="docs" className="space-y-4 mt-4">
          {/* Base URL */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Base URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <code className="flex-1 text-sm break-all font-mono">{apiBaseUrl}</code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(apiBaseUrl, 'base')}>
                  {copied === 'base' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />Sin auth para lectura</Badge>
                <Badge variant="outline" className="gap-1"><FileJson className="h-3 w-3" />JSON</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints */}
          {endpoints.map((ep, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">{ep.method}</Badge>
                  <code className="text-sm font-mono break-all">{ep.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{ep.desc}</p>
                {ep.params.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Parámetros:</p>
                    <div className="flex flex-wrap gap-1">
                      {ep.params.map(p => (
                        <Badge key={p} variant="secondary" className="text-xs font-mono">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Respuesta:</p>
                  <code className="text-xs break-all font-mono text-foreground">{ep.response}</code>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Quick example */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ejemplo rápido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4">
                <code className="text-xs font-mono whitespace-pre-wrap text-foreground">{`// Fetch listings from your app
const res = await fetch(
  '${apiBaseUrl}?endpoint=listings&country=Chile&limit=10'
);
const { data } = await res.json();
console.log(data); // Array of active listings`}</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="keys" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mis API Keys</h2>
            <Button
              className="gap-2"
              onClick={() => createKey.mutate(`Key ${apiKeys.length + 1}`)}
              disabled={createKey.isPending}
            >
              <Key className="h-4 w-4" />
              Generar API Key
            </Button>
          </div>

          {apiKeys.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Key className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold mb-2">Sin API Keys</h3>
                <p className="text-sm text-muted-foreground">
                  Genera una API Key para autenticar solicitudes a los endpoints protegidos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(apiKeys as any[]).map((key: any) => (
                <Card key={key.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{key.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-muted-foreground">{key.key_prefix}...****</code>
                        <Badge variant="outline" className="text-[10px]">
                          {key.scopes?.join(', ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={key.is_active ? 'default' : 'destructive'}>
                        {key.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleKey.mutate({ id: key.id, active: !key.is_active })}
                      >
                        {key.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Webhooks Reference */}
        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                Eventos Disponibles
              </CardTitle>
              <CardDescription>
                Configura webhooks en Enterprise → Webhooks para recibir notificaciones HTTP automáticas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {webhookEvents.map(ev => (
                <div key={ev.event} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <code className="text-sm font-mono font-medium text-foreground">{ev.event}</code>
                    <p className="text-xs text-muted-foreground mt-0.5">{ev.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Formato del Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4">
                <code className="text-xs font-mono whitespace-pre-wrap text-foreground">{`{
  "event": "reservation.created",
  "timestamp": "2026-03-10T12:00:00Z",
  "data": {
    "reservation_id": "uuid",
    "lot_id": "uuid",
    "buyer_name": "Juan Pérez",
    "amount": 500000,
    "currency": "CLP"
  }
}`}</code>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Cada webhook incluye un header <code className="font-mono">X-Webhook-Secret</code> con tu secret para validación HMAC.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIPortal;
