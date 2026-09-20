import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminOrganization, useAdminSetOrgPlan } from '@/hooks/useAdminOrganizations';
import { PLAN_ORDER_ALL, type PlanType } from '@/hooks/useSubscription';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    .format(n || 0);

const OrganizationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading } = useAdminOrganization(id);
  const setPlan = useAdminSetOrgPlan();

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="container mx-auto p-6 text-center space-y-4">
        <p className="text-muted-foreground">No encontramos esta empresa.</p>
        <Button asChild variant="outline"><Link to="/admin/inmobiliarias">Volver al listado</Link></Button>
      </div>
    );
  }

  const changePlan = async (plan: PlanType) => {
    try {
      await setPlan.mutateAsync({ organizationId: org.id, ownerId: org.owner_id, plan });
      toast.success(`Plan actualizado a ${plan}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/inmobiliarias"><ArrowLeft className="h-4 w-4 mr-1" /> Inmobiliarias</Link>
      </Button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground">
            {org.ownerName}{org.ownerEmail ? ` · ${org.ownerEmail}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{org.planStatus}</Badge>
          <Select value={org.plan} onValueChange={(v) => changePlan(v as PlanType)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLAN_ORDER_ALL.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Ventas del mes', value: fmt(org.salesMonth) },
          { label: 'Comisiones del mes', value: fmt(org.commissionsMonth) },
          { label: 'Unidades vendidas', value: `${org.unitsSold}/${org.unitsTotal}` },
          { label: 'Clientes potenciales del mes', value: String(org.leadsMonth) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Equipo</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Plan propio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.members.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.email ?? '—'}</TableCell>
                  <TableCell><Badge variant="outline">{m.role}</Badge></TableCell>
                  <TableCell>{m.plan ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" /> Proyectos
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proyecto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><Badge variant="secondary">{p.status ?? '—'}</Badge></TableCell>
                  <TableCell>{p.sold_lots ?? 0}/{p.total_lots ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={p.slug ? `/p/${p.slug}` : `/proyecto/${p.id}`}>Ver página</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {org.projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Esta empresa aún no publica proyectos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationDetail;
