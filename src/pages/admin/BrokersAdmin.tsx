import { WorkspaceLoadError } from '@/components/dashboard/WorkspaceLoadError';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Users, UserCheck, Clock, Ban } from 'lucide-react';
import {
  useBrokerApplications, useApproveBrokerApplication, useUpdateBrokerApplication,
  useAllBrokerProfiles, useAdminUpdateBrokerProfile, type BrokerApplication,
} from '@/hooks/useBrokers';
import { supabase } from '@/integrations/supabase/client';

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const BrokersAdmin = () => {
  const applicationsQuery = useBrokerApplications();
  const { data: applications = [] } = applicationsQuery;
  const profilesQuery = useAllBrokerProfiles();
  const { data: profiles = [] } = profilesQuery;
  const approve = useApproveBrokerApplication();
  const updateApp = useUpdateBrokerApplication();
  const updateProfile = useAdminUpdateBrokerProfile();

  const [selected, setSelected] = useState<BrokerApplication | null>(null);
  const [userId, setUserId] = useState('');
  const [level, setLevel] = useState('starter');
  const [rate, setRate] = useState('3');

  const pending = applications.filter((a) => a.status === 'pending');
  const approved = applications.filter((a) => a.status === 'approved');
  const [lookup, setLookup] = useState<'idle' | 'searching' | 'found' | 'missing'>('idle');

  const openApprove = async (a: BrokerApplication) => {
    setSelected(a);
    setUserId(a.user_id ?? '');
    if (a.user_id) { setLookup('found'); return; }
    setLookup('searching');
    const { data } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('email', a.email.trim())
      .maybeSingle();
    if (data?.user_id) { setUserId(data.user_id); setLookup('found'); }
    else setLookup('missing');
  };

  const onApprove = async () => {
    if (!selected || !userId.trim()) return;
    await approve.mutateAsync({
      applicationId: selected.id,
      userId: userId.trim(),
      level,
      baseCommissionRate: Number(rate) || 3,
    });
    setSelected(null);
    setUserId('');
  };

  if (applicationsQuery.error || profilesQuery.error) return <WorkspaceLoadError title="No pudimos cargar postulaciones y brokers" onRetry={() => Promise.all([applicationsQuery.refetch(), profilesQuery.refetch()])} />;
  if (applicationsQuery.isLoading || profilesQuery.isLoading) return <div role="status" aria-label="Cargando administración de brokers"><Skeleton className="h-56 w-full" /></div>;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comunidad de brokers</h1>
        <p className="text-muted-foreground">
          Postulaciones, aprobación y gestión de la fuerza de venta.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="h-4 w-4" />} label="Postulaciones pendientes" value={pending.length} />
        <StatCard icon={<UserCheck className="h-4 w-4" />} label="Aprobadas" value={approved.length} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Brokers activos" value={profiles.filter(p => p.is_active).length} />
        <StatCard icon={<Ban className="h-4 w-4" />} label="Suspendidos" value={profiles.filter(p => !p.is_active).length} />
      </div>

      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Postulaciones</TabsTrigger>
          <TabsTrigger value="brokers">Brokers</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader><CardTitle>Postulaciones</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Experiencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.full_name}</div>
                        <div className="text-xs text-muted-foreground">{a.company_name ?? '—'}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{a.email}</div>
                        <div className="text-muted-foreground">{a.phone ?? '—'}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {[a.city, a.region, a.country].filter(Boolean).join(', ')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.experience_years ?? '—'} años
                        <div className="text-xs text-muted-foreground">{a.specialty ?? '—'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'approved' ? 'default' : 'secondary'}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        {a.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => openApprove(a)}>Aprobar</Button>
                            <Button size="sm" variant="outline"
                              onClick={() => updateApp.mutate({ id: a.id, status: 'rejected' })}>
                              Rechazar
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {applications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        Aún no hay postulaciones.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brokers">
          <Card>
            <CardHeader><CardTitle>Brokers registrados</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Comisión base</TableHead>
                    <TableHead>Override red</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">{p.display_name}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={p.level}
                          onValueChange={(v) => updateProfile.mutate({ id: p.id, level: v })}
                        >
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['starter', 'pro', 'elite', 'partner'].map((l) => (
                              <SelectItem key={l} value={l}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number" step="0.1" className="w-24"
                          defaultValue={p.base_commission_rate}
                          onBlur={(e) => updateProfile.mutate({
                            id: p.id, base_commission_rate: Number(e.target.value),
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number" step="0.1" className="w-24"
                          defaultValue={p.network_override_rate}
                          onBlur={(e) => updateProfile.mutate({
                            id: p.id, network_override_rate: Number(e.target.value),
                          })}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{p.invite_code}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={p.is_active ? 'outline' : 'default'}
                          onClick={() => updateProfile.mutate({ id: p.id, is_active: !p.is_active })}
                        >
                          {p.is_active ? 'Suspender' : 'Reactivar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {profiles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                        Aún no hay brokers activos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar broker</DialogTitle>
            <DialogDescription>
              {selected?.full_name} · {selected?.email}. Se le otorga el rol de asesor y se crea su perfil público.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {lookup === 'searching' && <p className="text-sm text-muted-foreground">Buscando su cuenta por correo…</p>}
            {lookup === 'found' && <p className="text-sm text-primary">Cuenta encontrada con este correo. Lista para aprobar.</p>}
            {lookup === 'missing' && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">
                  Aún no existe una cuenta con {selected?.email}. Pídele que se registre con ese correo y vuelve a aprobar,
                  o pega el ID de su cuenta (está en Usuarios → Info).
                </p>
                <Label htmlFor="userId">ID de usuario</Label>
                <Input id="userId" value={userId} placeholder="ID de la cuenta"
                  onChange={(e) => setUserId(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="level"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['starter', 'pro', 'elite', 'partner'].map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Comisión base (%)</Label>
                <Input id="rate" type="number" step="0.1" value={rate}
                  onChange={(e) => setRate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={onApprove} disabled={!userId.trim() || approve.isPending}>
              Aprobar y activar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrokersAdmin;
