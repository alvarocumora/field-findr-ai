import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Building2, Search, Users, FolderKanban, TrendingUp } from 'lucide-react';
import { useAdminOrganizations } from '@/hooks/useAdminOrganizations';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    .format(n || 0);

const OrganizationsAdmin = () => {
  const { data: orgs = [], isLoading } = useAdminOrganizations();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term
      ? orgs.filter((o) =>
          [o.name, o.slug, o.ownerName, o.ownerEmail ?? ''].some((v) =>
            v.toLowerCase().includes(term),
          ),
        )
      : orgs;
    return [...filtered].sort((a, b) => b.salesMonth - a.salesMonth);
  }, [orgs, q]);

  const totals = useMemo(
    () => ({
      empresas: orgs.length,
      asesores: orgs.reduce((s, o) => s + o.members.length, 0),
      proyectos: orgs.reduce((s, o) => s + o.projects.length, 0),
      ventas: orgs.reduce((s, o) => s + o.salesMonth, 0),
    }),
    [orgs],
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inmobiliarias</h1>
        <p className="text-muted-foreground">
          Todas las empresas que usan la plataforma, con su plan, equipo y resultados del mes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Empresas', value: totals.empresas.toLocaleString('es-CL'), icon: Building2 },
          { label: 'Personas en equipos', value: totals.asesores.toLocaleString('es-CL'), icon: Users },
          { label: 'Proyectos', value: totals.proyectos.toLocaleString('es-CL'), icon: FolderKanban },
          { label: 'Ventas del mes', value: fmt(totals.ventas), icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
              <s.icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Buscar por empresa, dueño o correo"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Proyectos</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Ventas del mes</TableHead>
                  <TableHead>Comisiones</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.ownerName}{o.ownerEmail ? ` · ${o.ownerEmail}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.plan}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">{o.planStatus}</div>
                    </TableCell>
                    <TableCell>{o.members.length}</TableCell>
                    <TableCell>{o.projects.length}</TableCell>
                    <TableCell>{o.unitsSold}/{o.unitsTotal}</TableCell>
                    <TableCell className="font-medium">{fmt(o.salesMonth)}</TableCell>
                    <TableCell>{fmt(o.commissionsMonth)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/admin/inmobiliarias/${o.id}`}>Ver ficha</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No hay empresas que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationsAdmin;
