import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileSignature, Plus, FileText, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useSalesClosings, CLOSING_STATUS, ClosingStatus } from '@/hooks/useSalesClosings';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';

const emptyForm = {
  buyer_name: '',
  buyer_email: '',
  buyer_phone: '',
  buyer_national_id: '',
  sale_amount: '',
  currency: 'CLP',
  commission_rate: '3',
  contract_url: '',
  lead_id: '',
  project_id: '',
  notes: '',
};

const money = (n: number, currency: string) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 })
    .format(n || 0);

const ClosingsManager = () => {
  const { closings, isLoading, createClosing, updateClosing } = useSalesClosings();
  const { leads } = useLeads();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const totals = useMemo(() => {
    const closed = closings.filter((c) => c.status === 'closed');
    return {
      count: closed.length,
      volume: closed.reduce((s, c) => s + Number(c.sale_amount || 0), 0),
      commission: closed.reduce((s, c) => s + Number(c.commission_amount || 0), 0),
      pipeline: closings.filter((c) => ['draft', 'contract_sent', 'signed'].includes(c.status)).length,
    };
  }, [closings]);

  const submit = async () => {
    if (!form.buyer_name.trim() || !form.sale_amount) return;
    await createClosing.mutateAsync({
      buyer_name: form.buyer_name.trim(),
      buyer_email: form.buyer_email || null,
      buyer_phone: form.buyer_phone || null,
      buyer_national_id: form.buyer_national_id || null,
      sale_amount: Number(form.sale_amount),
      currency: form.currency,
      commission_rate: Number(form.commission_rate) || 0,
      contract_url: form.contract_url || null,
      lead_id: form.lead_id || null,
      project_id: form.project_id || null,
      notes: form.notes || null,
      status: 'draft',
    });
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cierres de venta</h1>
          <p className="text-muted-foreground">
            Contrato, firma y comisión. Al marcar un cierre como cerrado se genera la comisión automáticamente.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo cierre</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Registrar cierre</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="c-buyer">Comprador *</Label>
                <Input id="c-buyer" value={form.buyer_name}
                  onChange={(e) => set('buyer_name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-email">Email</Label>
                <Input id="c-email" type="email" value={form.buyer_email}
                  onChange={(e) => set('buyer_email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-phone">Teléfono</Label>
                <Input id="c-phone" value={form.buyer_phone}
                  onChange={(e) => set('buyer_phone', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-rut">RUT / documento</Label>
                <Input id="c-rut" value={form.buyer_national_id}
                  onChange={(e) => set('buyer_national_id', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-amount">Monto de venta *</Label>
                <Input id="c-amount" type="number" min={0} value={form.sale_amount}
                  onChange={(e) => set('sale_amount', e.target.value)} />
              </div>
              <div>
                <Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                  <SelectTrigger aria-label="Moneda"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['CLP', 'UF', 'USD'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="c-rate">Comisión (%)</Label>
                <Input id="c-rate" type="number" step="0.1" min={0} value={form.commission_rate}
                  onChange={(e) => set('commission_rate', e.target.value)} />
              </div>
              <div>
                <Label>Lead</Label>
                <Select value={form.lead_id} onValueChange={(v) => set('lead_id', v)}>
                  <SelectTrigger aria-label="Lead"><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {leads.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.first_name} {l.last_name ?? ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proyecto</Label>
                <Select value={form.project_id} onValueChange={(v) => set('project_id', v)}>
                  <SelectTrigger aria-label="Proyecto"><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-contract">URL del contrato</Label>
                <Input id="c-contract" placeholder="https://…" value={form.contract_url}
                  onChange={(e) => set('contract_url', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="c-notes">Notas</Label>
                <Textarea id="c-notes" value={form.notes}
                  onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={createClosing.isPending}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Ventas cerradas', value: totals.count },
          { label: 'Volumen cerrado', value: money(totals.volume, 'CLP') },
          { label: 'Comisión generada', value: money(totals.commission, 'CLP') },
          { label: 'En proceso', value: totals.pipeline },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="h-4 w-4" aria-hidden="true" /> Operaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? <Skeleton className="h-24 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprador</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Actualizar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closings.map((c) => {
                  const st = CLOSING_STATUS[(c.status as ClosingStatus)] ?? CLOSING_STATUS.draft;
                  const project = projects.find((p) => p.id === c.project_id);
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.buyer_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.closed_at
                            ? `Cerrado ${format(new Date(c.closed_at), 'd MMM yyyy', { locale: es })}`
                            : format(new Date(c.created_at), 'd MMM yyyy', { locale: es })}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{project?.name ?? '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {money(Number(c.sale_amount), c.currency || 'CLP')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          {money(Number(c.commission_amount), c.currency || 'CLP')}
                          <span className="text-xs text-muted-foreground">({c.commission_rate}%)</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.contract_url ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={c.contract_url} target="_blank" rel="noreferrer">
                              <FileText className="h-3.5 w-3.5 mr-1" /> Ver
                            </a>
                          </Button>
                        ) : <span className="text-xs text-muted-foreground">Sin contrato</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border', st.className)}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={c.status}
                          onValueChange={(status) => updateClosing.mutate({
                            id: c.id,
                            status,
                            ...(status === 'signed' && !c.contract_signed_at
                              ? { contract_signed_at: new Date().toISOString() } : {}),
                          })}
                        >
                          <SelectTrigger className="w-[11rem] ml-auto"
                            aria-label={`Estado del cierre de ${c.buyer_name}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(CLOSING_STATUS).map(([k, cfg]) => (
                              <SelectItem key={k} value={k}>{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {closings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Aún no registras cierres de venta.
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

export default ClosingsManager;
