import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DollarSign, Download, Pencil, Ban, Percent, Network, CheckCircle2 } from 'lucide-react';
import {
  useAllCommissions, useAdminUpdateCommission, useAdminVoidSale,
  useCommissionRules, useUpsertCommissionRule, useAllNetworkOverrides,
  useAdminUpdateNetworkOverride, type AdminCommissionRow,
} from '@/hooks/useAdminCommissions';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    .format(n || 0);

const STATUSES = ['potential', 'reserved', 'earned', 'approved', 'paid', 'cancelled'];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    potential: { label: 'Potencial', variant: 'outline' },
    reserved: { label: 'Reservada', variant: 'secondary' },
    earned: { label: 'Devengada', variant: 'secondary' },
    approved: { label: 'Aprobada', variant: 'outline' },
    paid: { label: 'Pagada', variant: 'default' },
    cancelled: { label: 'Anulada', variant: 'destructive' },
  };
  const cfg = map[status] ?? { label: status, variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const CommissionsAdmin = () => {
  const { data: rows = [] } = useAllCommissions();
  const { data: rules = [] } = useCommissionRules();
  const { data: overrides = [] } = useAllNetworkOverrides();
  const update = useAdminUpdateCommission();
  const updateOverride = useAdminUpdateNetworkOverride();
  const voidSale = useAdminVoidSale();
  const upsertRule = useUpsertCommissionRule();

  const [filter, setFilter] = useState('all');
  const [overrideFilter, setOverrideFilter] = useState('pending');
  const [editing, setEditing] = useState<AdminCommissionRow | null>(null);
  const [voiding, setVoiding] = useState<AdminCommissionRow | null>(null);
  const [form, setForm] = useState({ rate: '', amount: '', status: 'pending', notes: '' });
  const [reason, setReason] = useState('');

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  const filteredOverrides = useMemo(
    () => (overrideFilter === 'all'
      ? overrides
      : overrides.filter((o) => o.status === overrideFilter)),
    [overrides, overrideFilter],
  );

  const overrideTotals = useMemo(() => ({
    pending: overrides
      .filter((o) => o.status === 'pending')
      .reduce((sum, o) => sum + (o.override_amount || 0), 0),
    paid: overrides
      .filter((o) => o.status === 'paid')
      .reduce((sum, o) => sum + (o.override_amount || 0), 0),
  }), [overrides]);

  const totals = useMemo(() => {
    const active = rows.filter((r) => r.status !== 'cancelled');
    return {
      volume: active.reduce((s, r) => s + (r.sale_amount || 0), 0),
      pending: active.filter((r) => r.status !== 'paid')
        .reduce((s, r) => s + (r.commission_amount || 0), 0),
      paid: active.filter((r) => r.status === 'paid')
        .reduce((s, r) => s + (r.commission_amount || 0), 0),
      count: active.length,
    };
  }, [rows]);

  const openEdit = (r: AdminCommissionRow) => {
    setEditing(r);
    setForm({
      rate: String(r.commission_rate ?? ''),
      amount: String(r.commission_amount ?? ''),
      status: r.status,
      notes: r.notes ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await update.mutateAsync({
      id: editing.id,
      commission_rate: form.rate ? Number(form.rate) : undefined,
      commission_amount: form.amount ? Number(form.amount) : undefined,
      status: form.status,
      notes: form.notes || undefined,
    });
    setEditing(null);
  };

  const exportCsv = () => {
    const header = ['id', 'agente', 'referidor', 'venta', 'tasa', 'comision', 'estado', 'fecha'];
    const lines = filtered.map((r) => [
      r.id, r.agent_id, r.referring_agent_id ?? '', r.sale_amount, r.commission_rate,
      r.commission_amount, r.status, r.created_at,
    ].join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comisiones-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comisiones</h1>
          <p className="text-muted-foreground">
            Control total de comisiones de la plataforma. Cada cambio queda auditado.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Volumen de ventas', value: fmt(totals.volume) },
          { label: 'Comisiones por pagar', value: fmt(totals.pending) },
          { label: 'Comisiones pagadas', value: fmt(totals.paid) },
          { label: 'Operaciones', value: String(totals.count) },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Comisiones</TabsTrigger>
          <TabsTrigger value="overrides">Overrides de red</TabsTrigger>
          <TabsTrigger value="rules">Reglas comerciales</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Todas las comisiones
              </CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venta</TableHead>
                    <TableHead>Tasa</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Referido</TableHead>
                    <TableHead>Origen / cierre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{fmt(r.sale_amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString('es-CL')}
                        </div>
                      </TableCell>
                      <TableCell>{r.commission_rate}%</TableCell>
                      <TableCell className="font-medium">{fmt(r.commission_amount)}</TableCell>
                      <TableCell className="text-sm">
                        {r.referring_agent_id
                          ? `${fmt(r.referral_amount ?? 0)} (${r.referral_status})`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span title={r.originator_agent_id || ''}>Origen: {r.originator_agent_id?.slice(0, 8) || '—'}</span>
                        <br />
                        <span title={r.closing_agent_id || ''}>Cierre: {r.closing_agent_id?.slice(0, 8) || '—'}</span>
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {r.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" onClick={() => { setVoiding(r); setReason(''); }}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No hay comisiones con este filtro.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="overrides">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Overrides pendientes</p>
                  <p className="text-lg font-bold">{fmt(overrideTotals.pending)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Overrides pagados</p>
                  <p className="text-lg font-bold">{fmt(overrideTotals.paid)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-4 w-4" /> Ledger de overrides
                </CardTitle>
                <Select value={overrideFilter} onValueChange={setOverrideFilter}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                    <SelectItem value="cancelled">Anulados</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Broker origen</TableHead>
                      <TableHead>Beneficiario</TableHead>
                      <TableHead>Nivel</TableHead>
                      <TableHead>Tasa</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOverrides.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-sm">
                          {new Date(o.created_at).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell className="font-mono text-xs" title={o.source_broker_id}>
                          {o.source_broker_id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-mono text-xs" title={o.beneficiary_broker_id}>
                          {o.beneficiary_broker_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{o.depth}</TableCell>
                        <TableCell>{o.override_rate}%</TableCell>
                        <TableCell className="font-medium">{fmt(o.override_amount)}</TableCell>
                        <TableCell><StatusBadge status={o.status} /></TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          {o.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updateOverride.isPending}
                                onClick={() => updateOverride.mutate({ id: o.id, status: 'paid' })}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Pagar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updateOverride.isPending}
                                onClick={() => updateOverride.mutate({ id: o.id, status: 'cancelled' })}
                              >
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Anular
                              </Button>
                            </>
                          )}
                          {o.status !== 'pending' && (
                            <span className="text-xs text-muted-foreground">
                              {o.paid_at ? new Date(o.paid_at).toLocaleDateString('es-CL') : '—'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOverrides.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                          No hay overrides con este filtro.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-4 w-4" /> Comisión por defecto, por plan y por proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alcance</TableHead>
                    <TableHead>Plan / Proyecto</TableHead>
                    <TableHead>Comisión %</TableHead>
                    <TableHead>Override red %</TableHead>
                    <TableHead>Activa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.scope}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rule.plan_type ?? rule.project_id ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.1" className="w-24"
                          defaultValue={rule.commission_rate}
                          onBlur={(e) => upsertRule.mutate({
                            id: rule.id, commission_rate: Number(e.target.value),
                          })} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.1" className="w-24"
                          defaultValue={rule.referral_override_rate}
                          onBlur={(e) => upsertRule.mutate({
                            id: rule.id, referral_override_rate: Number(e.target.value),
                          })} />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant={rule.is_active ? 'default' : 'outline'}
                          onClick={() => upsertRule.mutate({ id: rule.id, is_active: !rule.is_active })}>
                          {rule.is_active ? 'Activa' : 'Inactiva'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar comisión</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Tasa (%)</Label>
                <Input id="rate" type="number" step="0.1" value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input id="amount" type="number" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" value={form.notes} rows={3}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={update.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!voiding} onOpenChange={(o) => !o && setVoiding(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Anular venta</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo de la anulación</Label>
            <Textarea id="reason" value={reason} rows={3}
              onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiding(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 3 || voidSale.isPending}
              onClick={async () => {
                if (!voiding) return;
                await voidSale.mutateAsync({ id: voiding.id, reason: reason.trim() });
                setVoiding(null);
              }}
            >
              Anular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommissionsAdmin;
