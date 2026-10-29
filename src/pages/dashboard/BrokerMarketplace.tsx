import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MapPin, Percent, Search, Store, Send, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useProjectAssignments, useRequestProjectAssignment, useDecideAssignment,
  useMyBrokerProfile,
} from '@/hooks/useBrokers';
import { useCommissionRules } from '@/hooks/useAdminCommissions';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';
import { whatsappShareUrl } from '@/lib/brokerProgram';

interface MarketProject {
  id: string;
  name: string;
  location: string | null;
  region: string | null;
  city: string | null;
  country: string | null;
  total_lots: number | null;
  available_lots: number | null;
  images: string[] | null;
  user_id: string;
  slug: string | null;
}

const useMarketProjects = () =>
  useQuery({
    queryKey: ['market-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,location,region,city,country,total_lots,available_lots,images,user_id,slug')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as MarketProject[];
    },
  });

const BrokerMarketplace = () => {
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useMarketProjects();
  const { data: assignments = [] } = useProjectAssignments();
  const { data: rules = [] } = useCommissionRules();
  const { data: brokerProfile } = useMyBrokerProfile();
  const request = useRequestProjectAssignment();
  const decide = useDecideAssignment();
  const [q, setQ] = useState('');

  const defaultRate = rules.find((r) => r.scope === 'default')?.commission_rate ?? 3;
  const rateFor = (projectId: string) =>
    rules.find((r) => r.scope === 'project' && r.project_id === projectId)?.commission_rate
    ?? defaultRate;

  const mine = assignments.filter((a) => a.broker_id === user?.id);
  const incoming = assignments.filter((a) => a.owner_id === user?.id && a.status === 'pending');
  const shareLink = (p: { id: string; name: string; slug: string | null }) => {
    const ref = brokerProfile?.invite_code ? `?ref=${brokerProfile.invite_code}` : '';
    const url = getCanonicalUrl(`${p.slug ? `/p/${p.slug}` : `/proyecto/${p.id}`}${ref}`);
    const share = (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share;
    if (share) {
      share({ title: p.name, text: `Parcelas en venta: ${p.name}`, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard.writeText(url);
    toast.success('Link de venta copiado');
  };

  const statusFor = (projectId: string) =>
    mine.find((a) => a.project_id === projectId)?.status;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects
      .filter((p) => p.user_id !== user?.id)
      .filter((p) => !term || [p.name, p.location, p.region, p.city]
        .some((v) => v?.toLowerCase().includes(term)));
  }, [projects, q, user?.id]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mercado de proyectos</h1>
        <p className="text-muted-foreground">
          Loteos y parcelaciones disponibles para vender. Solicita el proyecto, acuerda tu
          comisión y recibe tus leads atribuidos.
        </p>
      </div>

      {brokerProfile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Tu link de invitación de brokers</p>
              <p className="text-xs text-muted-foreground font-mono">
                {getShareUrl('/brokers/inscripcion', { ref: brokerProfile.invite_code })}
              </p>
            </div>
            <Button
              size="sm" variant="outline"
              onClick={() => navigator.clipboard.writeText(
                getShareUrl('/brokers/inscripcion', { ref: brokerProfile.invite_code }),
              )}
            >
              Copiar link
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="mine">Mis proyectos ({mine.length})</TabsTrigger>
          <TabsTrigger value="incoming">Solicitudes recibidas ({incoming.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="Buscar proyecto, comuna o región"
              value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar proyecto" />
          </div>

          {isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-52 w-full" />)}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const st = statusFor(p.id);
              return (
                <Card key={p.id} className="overflow-hidden flex flex-col">
                  {p.images?.[0] && (
                    <img src={p.images[0]} alt={`Proyecto ${p.name}`} loading="lazy"
                      className="h-32 w-full object-cover" />
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold leading-tight">{p.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {[p.city, p.region, p.country].filter(Boolean).join(', ') || p.location}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary" className="gap-1">
                          <Percent className="h-3 w-3" aria-hidden="true" />
                          {rateFor(p.id)}% · mín. $500.000/lote
                        </Badge>
                        <Badge variant="outline">
                          {p.available_lots ?? 0}/{p.total_lots ?? 0} disponibles
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {st === 'approved' ? (
                        <Badge className="w-full justify-center py-2">Asignado</Badge>
                      ) : st === 'pending' ? (
                        <Badge variant="secondary" className="w-full justify-center py-2">
                          Solicitud enviada
                        </Badge>
                      ) : (
                        <Button size="sm" className="flex-1"
                          disabled={request.isPending}
                          onClick={() => request.mutate({ projectId: p.id })}>
                          <Send className="h-3.5 w-3.5 mr-2" /> Quiero venderlo
                        </Button>
                      )}
                      <Button size="sm" variant="outline"
                        onClick={() => shareLink(p)}
                        aria-label={`Compartir ${p.name}`}>
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={p.slug ? `/p/${p.slug}` : `/proyecto/${p.id}`} aria-label={`Ver ${p.name}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!isLoading && filtered.length === 0 && (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                <Store className="h-8 w-8 mx-auto mb-3" aria-hidden="true" />
                Aún no hay proyectos disponibles para venta externa.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mine">
          <Card>
            <CardHeader><CardTitle>Proyectos que puedo vender</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Kit de venta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mine.map((a) => {
                    const p = projects.find((x) => x.id === a.project_id);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{p?.name ?? a.project_id}</TableCell>
                        <TableCell>{a.commission_rate}%</TableCell>
                        <TableCell><Badge variant="secondary">{a.status}</Badge></TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          <Button size="sm" variant="outline"
                            onClick={() => p && shareLink(p)}
                            disabled={!p}>
                            <Share2 className="h-3.5 w-3.5 mr-1" /> Compartir
                          </Button>
                          {p && (
                            <Button size="sm" variant="outline" asChild>
                              <a target="_blank" rel="noopener noreferrer"
                                href={whatsappShareUrl(`Parcelas en venta: ${p.name}`,
                                  getCanonicalUrl(`${p.slug ? `/p/${p.slug}` : `/proyecto/${p.id}`}${brokerProfile?.invite_code ? `?ref=${brokerProfile.invite_code}` : ''}`))}>
                                WhatsApp
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link to={p?.slug ? `/p/${p.slug}` : `/proyecto/${a.project_id}`}>
                              Ver material
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {mine.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                        Todavía no tienes proyectos asignados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming">
          <Card>
            <CardHeader><CardTitle>Brokers que quieren vender tus proyectos</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Comisión propuesta</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incoming.map((a) => {
                    const p = projects.find((x) => x.id === a.project_id);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{p?.name ?? a.project_id}</TableCell>
                        <TableCell>{a.commission_rate}%</TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {a.message || '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          <Button size="sm"
                            onClick={() => decide.mutate({ id: a.id, status: 'approved' })}>
                            Aprobar
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => decide.mutate({ id: a.id, status: 'rejected' })}>
                            Rechazar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {incoming.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                        No tienes solicitudes pendientes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerMarketplace;
