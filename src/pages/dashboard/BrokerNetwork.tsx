import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronRight, Network, Target, TrendingUp, Users } from 'lucide-react';
import {
  useBrokerReferralTree, useBrokerMetrics, useBrokerProjectAttribution,
  buildBrokerTree, type BrokerTreeBranch,
} from '@/hooks/useBrokerAnalytics';

const clp = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    .format(n || 0);

const LEVEL_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  partner: 'default',
  elite: 'default',
  pro: 'secondary',
  starter: 'outline',
};

const TreeNode = ({ node, depth = 0 }: { node: BrokerTreeBranch; depth?: number }) => {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="flex flex-wrap items-center gap-2 py-2 border-b border-border/40"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Contraer red de ${node.display_name}` : `Expandir red de ${node.display_name}`}
            className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4" aria-hidden="true" />
        )}
        <span className="font-medium text-sm truncate max-w-[180px]">{node.display_name}</span>
        <Badge variant={LEVEL_VARIANT[node.level] ?? 'outline'} className="text-[10px]">
          {node.level}
        </Badge>
        <span className="text-xs text-muted-foreground">nivel {node.depth}</span>
        {!node.is_active && <Badge variant="destructive" className="text-[10px]">inactivo</Badge>}
        <span className="ml-auto text-xs text-muted-foreground">
          {node.sales_count} ventas · {clp(node.sales_volume)}
        </span>
        {node.override_generated > 0 && (
          <span className="text-xs text-primary">override {clp(node.override_generated)}</span>
        )}
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map((c) => (
            <TreeNode key={c.user_id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const BrokerNetwork = () => {
  const [params, setParams] = useSearchParams();
  const brokerParam = params.get('broker') ?? undefined;

  const { data: tree = [], isLoading: treeLoading } = useBrokerReferralTree(brokerParam);
  const { data: metrics, isLoading: metricsLoading } = useBrokerMetrics(brokerParam);
  const { data: attribution = [], isLoading: attrLoading } = useBrokerProjectAttribution(brokerParam);

  const branches = useMemo(() => buildBrokerTree(tree), [tree]);
  const conversion = metrics && metrics.leads_total > 0
    ? Math.round((metrics.leads_won / metrics.leads_total) * 100)
    : 0;

  const cards = [
    { label: 'Red total', value: metrics ? String(metrics.network_total) : '—', sub: `${metrics?.network_direct ?? 0} directos`, icon: Network },
    { label: 'Leads atribuidos', value: metrics ? String(metrics.leads_total) : '—', sub: `${conversion}% conversión`, icon: Target },
    { label: 'Ventas', value: metrics ? String(metrics.sales_count) : '—', sub: clp(metrics?.sales_volume ?? 0), icon: TrendingUp },
    { label: 'Override de red', value: clp(metrics?.override_earned ?? 0), sub: `${clp(metrics?.override_pending ?? 0)} pendiente`, icon: Users },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Red y atribución</h1>
          <p className="text-muted-foreground">
            Árbol de referidos, proyectos atribuidos y métricas de tu operación como broker.
          </p>
        </div>
        {brokerParam && (
          <Button variant="outline" onClick={() => { params.delete('broker'); setParams(params); }}>
            Ver mi propia red
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <c.icon className="h-4 w-4 text-primary mb-2" aria-hidden="true" />
              {metricsLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-bold leading-none">{c.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
              <p className="text-[11px] text-muted-foreground/80">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree">Árbol de referidos</TabsTrigger>
          <TabsTrigger value="projects">Atribución por proyecto</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tu red ({tree.length} brokers hasta 5 niveles)</CardTitle>
            </CardHeader>
            <CardContent>
              {treeLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : branches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Todavía no hay brokers en tu red. Comparte tu link de invitación desde
                  “Mi negocio” para empezar a construirla.
                </p>
              ) : (
                <ul>
                  {branches.map((b) => (
                    <TreeNode key={b.user_id} node={b} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Proyectos atribuidos</CardTitle></CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0 overflow-x-auto">
              {attrLoading ? (
                <div className="p-6"><Skeleton className="h-32 w-full" /></div>
              ) : attribution.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Aún no registras leads ni ventas asociados a un proyecto.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Ventas</TableHead>
                      <TableHead className="text-right">Volumen</TableHead>
                      <TableHead className="text-right">Comisión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attribution.map((a) => (
                      <TableRow key={a.project_id}>
                        <TableCell className="font-medium">{a.project_name}</TableCell>
                        <TableCell>
                          <Badge variant={a.assignment_status === 'approved' ? 'default' : 'outline'}>
                            {a.assignment_status ?? 'sin asignación'}
                          </Badge>
                          {a.commission_rate > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {a.commission_rate}% (asignación legacy; verificar condiciones por proyecto)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {a.leads_count}
                          <span className="text-xs text-muted-foreground"> ({a.leads_won} ganados)</span>
                        </TableCell>
                        <TableCell className="text-right">{a.sales_count}</TableCell>
                        <TableCell className="text-right">{clp(a.sales_volume)}</TableCell>
                        <TableCell className="text-right">
                          {clp(a.commission_total)}
                          <span className="block text-xs text-muted-foreground">
                            {clp(a.commission_paid)} pagada
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerNetwork;
