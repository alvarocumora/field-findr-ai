import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DollarSign, Target, TrendingUp, Award, Plus, Loader2, CheckCircle, Clock,
} from 'lucide-react';
import {
  useAgentCommissions, useCommissionSummary, useAgentPerformanceGoals,
  useCreateGoal, useCreateCommission,
} from '@/hooks/useAgentPerformance';
import { useMarkCommissionPaid } from '@/hooks/useAgentCommissions';

const formatCurrency = (v: number) => {
  if (v >= 1000000000) return `$${(v / 1000000000).toFixed(1)}B`;
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  return `$${v.toLocaleString('es-CL')}`;
};

const statusBadge = (s: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendiente', variant: 'secondary' },
    paid: { label: 'Pagada', variant: 'default' },
    cancelled: { label: 'Cancelada', variant: 'destructive' },
  };
  const cfg = map[s] || map.pending;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

// ── Goal Form Dialog ──
const GoalFormDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sales_target: 0, units_target: 0, leads_target: 0, commission_target: 0 });
  const createGoal = useCreateGoal();

  const handleSubmit = () => {
    createGoal.mutate(form, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Target className="h-4 w-4" />Definir Metas</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Metas del Mes</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Meta Ventas ($)</Label><Input type="number" value={form.sales_target} onChange={e => setForm(f => ({ ...f, sales_target: +e.target.value }))} /></div>
            <div><Label>Meta Unidades</Label><Input type="number" value={form.units_target} onChange={e => setForm(f => ({ ...f, units_target: +e.target.value }))} /></div>
            <div><Label>Meta Leads</Label><Input type="number" value={form.leads_target} onChange={e => setForm(f => ({ ...f, leads_target: +e.target.value }))} /></div>
            <div><Label>Meta Comisiones ($)</Label><Input type="number" value={form.commission_target} onChange={e => setForm(f => ({ ...f, commission_target: +e.target.value }))} /></div>
          </div>
          <Button onClick={handleSubmit} disabled={createGoal.isPending} className="w-full">
            {createGoal.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Guardar Metas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Commission Form Dialog ──
const CommissionFormDialog = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sale_amount: 0, commission_rate: 3, notes: '' });
  const createCommission = useCreateCommission();

  const handleSubmit = () => {
    createCommission.mutate(form, { onSuccess: () => { setOpen(false); setForm({ sale_amount: 0, commission_rate: 3, notes: '' }); } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />Registrar Comisión</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva Comisión</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Monto de Venta ($)</Label><Input type="number" value={form.sale_amount} onChange={e => setForm(f => ({ ...f, sale_amount: +e.target.value }))} /></div>
          <div><Label>Tasa de Comisión (%)</Label><Input type="number" step="0.1" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: +e.target.value }))} /></div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Comisión calculada</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency((form.sale_amount * form.commission_rate) / 100)}</p>
          </div>
          <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <Button onClick={handleSubmit} disabled={createCommission.isPending} className="w-full">
            {createCommission.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Main Page ──
const AgentPerformance = () => {
  const { data: commissions, isLoading: commissionsLoading } = useAgentCommissions();
  const { data: summary, isLoading: summaryLoading } = useCommissionSummary();
  const { data: goals, isLoading: goalsLoading } = useAgentPerformanceGoals();
  const markPaid = useMarkCommissionPaid();

  const kpis = [
    { label: 'Comisiones Total', value: summary ? formatCurrency(summary.total) : '-', icon: DollarSign, color: 'text-emerald-500' },
    { label: 'Pendientes', value: summary ? formatCurrency(summary.pending) : '-', icon: Clock, color: 'text-amber-500' },
    { label: 'Pagadas', value: summary ? formatCurrency(summary.paid) : '-', icon: CheckCircle, color: 'text-primary' },
    { label: 'Este Mes', value: summary ? formatCurrency(summary.thisMonth) : '-', icon: TrendingUp, color: 'text-blue-500' },
  ];

  const goalMetrics = goals ? [
    { label: 'Ventas', current: Number(goals.sales_achieved), target: Number(goals.sales_target), format: formatCurrency },
    { label: 'Unidades', current: goals.units_achieved, target: goals.units_target, format: (v: number) => String(v) },
    { label: 'Leads', current: goals.leads_achieved, target: goals.leads_target, format: (v: number) => String(v) },
    { label: 'Comisiones', current: Number(goals.commission_achieved), target: Number(goals.commission_target), format: formatCurrency },
  ] : [];

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rendimiento & Comisiones</h1>
          <p className="text-muted-foreground mt-1">Seguimiento de metas, comisiones y rendimiento individual</p>
        </div>
        <div className="flex items-center gap-3">
          <GoalFormDialog />
          <CommissionFormDialog />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border/40 bg-card/50 backdrop-blur">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  {summaryLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold text-foreground">{kpi.value}</p>}
                </div>
                <div className={`h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Goals Progress */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-primary" />Metas del Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {goalsLoading ? (
              <>{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</>
            ) : goals ? (
              goalMetrics.map((m, i) => {
                const pct = m.target > 0 ? Math.min((m.current / m.target) * 100, 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium text-foreground">{m.format(m.current)} / {m.format(m.target)}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{pct.toFixed(0)}%</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <Target className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No tienes metas definidas para este mes</p>
                <GoalFormDialog />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commissions Table */}
        <Card className="lg:col-span-2 border-border/40">
          <CardHeader>
            <CardTitle className="text-lg">Historial de Comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            {commissionsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : commissions && commissions.length > 0 ? (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead className="text-right">Venta</TableHead>
                      <TableHead className="text-right">Tasa</TableHead>
                      <TableHead className="text-right">Comisión</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm">{new Date(c.created_at).toLocaleDateString('es-CL')}</TableCell>
                        <TableCell className="text-sm">{c.projects?.name || '—'}</TableCell>
                        <TableCell className="text-sm">{c.lots?.lot_number || '—'}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(Number(c.sale_amount))}</TableCell>
                        <TableCell className="text-right text-sm">{Number(c.commission_rate)}%</TableCell>
                        <TableCell className="text-right text-sm font-bold text-primary">{formatCurrency(Number(c.commission_amount))}</TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell className="text-right">
                          {c.status === 'pending' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              disabled={markPaid.isPending}
                              onClick={() => markPaid.mutate(c.id)}
                            >
                              {markPaid.isPending && markPaid.variables === c.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <CheckCircle className="h-3 w-3" />}
                              Marcar pagada
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium text-foreground">Sin comisiones registradas</p>
                <p className="text-sm text-muted-foreground mt-1">Registra tu primera comisión para comenzar el tracking</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentPerformance;
