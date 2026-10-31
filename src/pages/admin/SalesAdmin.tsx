import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Receipt } from 'lucide-react';
import { useAllCommissions, useAdminRegisterManualSale } from '@/hooks/useAdminCommissions';
import { useAllBrokerProfiles } from '@/hooks/useBrokers';
import { useProjects } from '@/hooks/useProjects';
import { isFixedBrokerProject } from '@/lib/commissions/fixedProjectRule';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    .format(n || 0);

const SalesAdmin = () => {
  const { data: rows = [] } = useAllCommissions();
  const { data: brokers = [] } = useAllBrokerProfiles();
  const { projects = [] } = useProjects();
  const register = useAdminRegisterManualSale();

  const [form, setForm] = useState({
    agentId: '',
    saleAmount: '',
    commissionRate: '3',
    projectId: '',
    referringAgentId: '',
    referralRate: '0',
    notes: '',
  });

  const monthTotal = useMemo(() => {
    const now = new Date();
    return rows
      .filter((r) => r.status !== 'cancelled')
      .filter((r) => {
        const d = new Date(r.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, r) => s + (r.sale_amount || 0), 0);
  }, [rows]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For exact CLP projects, close from the paid reservation with a verified salesperson.
    if (isFixedBrokerProject(form.projectId)) return;
    await register.mutateAsync({
      agentId: form.agentId,
      saleAmount: Number(form.saleAmount),
      commissionRate: Number(form.commissionRate) || 3,
      projectId: form.projectId || null,
      referringAgentId: form.referringAgentId || null,
      referralRate: Number(form.referralRate) || 0,
      notes: form.notes || undefined,
    });
    setForm({ ...form, saleAmount: '', notes: '' });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
        <p className="text-muted-foreground">
          Registro manual, corrección y trazabilidad de las ventas de la red.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Ventas del mes</p>
            <p className="text-lg font-bold">{fmt(monthTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Operaciones totales</p>
            <p className="text-lg font-bold">{rows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Brokers con venta</p>
            <p className="text-lg font-bold">{new Set(rows.map((r) => r.agent_id)).size}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Registrar venta manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="agentId">Broker / agente *</Label>
              <Select value={form.agentId} onValueChange={(v) => setForm({ ...form, agentId: v })}>
                <SelectTrigger id="agentId"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.user_id} value={b.user_id}>{b.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleAmount">Monto de venta *</Label>
              <Input id="saleAmount" type="number" min={1} required value={form.saleAmount}
                onChange={(e) => setForm({ ...form, saleAmount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Comisión (%)</Label>
              <Input id="commissionRate" type="number" step="0.1" value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">Proyecto</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger id="projectId"><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: { id: string; name: string }) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referringAgentId">Broker referidor</Label>
              <Select value={form.referringAgentId}
                onValueChange={(v) => setForm({ ...form, referringAgentId: v })}>
                <SelectTrigger id="referringAgentId"><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.user_id} value={b.user_id}>{b.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralRate">Comisión referido (%)</Label>
              <Input id="referralRate" type="number" step="0.1" value={form.referralRate}
                onChange={(e) => setForm({ ...form, referralRate: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {isFixedBrokerProject(form.projectId) && (
              <p className="md:col-span-3 text-sm text-amber-700">
                Este proyecto tiene comisión fija por venta. Usa Reservas → Registrar venta
                para elegir un vendedor aprobado y verificar al captador. El registro manual
                con porcentajes está bloqueado para evitar comisiones incorrectas.
              </p>
            )}
            <div className="md:col-span-3">
              <Button type="submit" disabled={!form.agentId || !form.saleAmount || register.isPending || isFixedBrokerProject(form.projectId)}>
                Registrar venta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Últimas ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 50).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.created_at).toLocaleDateString('es-CL')}</TableCell>
                  <TableCell className="font-medium">{fmt(r.sale_amount)}</TableCell>
                  <TableCell>{fmt(r.commission_amount)} {r.commission_rate > 0 ? `· ${r.commission_rate}%` : '· monto fijo'}</TableCell>
                  <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {r.notes ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                    Aún no hay ventas registradas.
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

export default SalesAdmin;
