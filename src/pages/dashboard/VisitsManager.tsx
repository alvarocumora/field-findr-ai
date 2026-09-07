import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, FileText, MapPin, Plus, ShoppingCart, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useVisits,
  VISIT_STATUS,
  VISIT_MODES,
  VISIT_OUTCOMES,
  VISIT_NEXT_ACTIONS,
  VisitStatus,
  Visit,
  VisitOutcome,
  VisitNextAction,
} from '@/hooks/useVisits';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { useLots } from '@/hooks/useLots';
import { cn } from '@/lib/utils';

const emptyForm = {
  visitor_name: '',
  visitor_email: '',
  visitor_phone: '',
  date: '',
  time: '',
  duration_minutes: 60,
  mode: 'presencial',
  lead_id: '',
  project_id: '',
  lot_id: '',
  notes: '',
};

const emptyResult = {
  outcome: '' as VisitOutcome | '',
  result_notes: '',
  next_action: '' as VisitNextAction | '',
  follow_up_at: '',
};

const VisitsManager = () => {
  const { visits, isLoading, createVisit, updateVisit } = useVisits();
  const { leads } = useLeads();
  const { projects } = useProjects();
  const { lots } = useLots();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [resultVisit, setResultVisit] = useState<Visit | null>(null);
  const [result, setResult] = useState(emptyResult);

  useEffect(() => {
    const projectId = searchParams.get('project') || '';
    const lotId = searchParams.get('lot') || '';
    if (!projectId && !lotId) return;

    const lot = lotId ? lots.find((item) => item.id === lotId) : undefined;
    setForm((current) => ({
      ...current,
      project_id: projectId || lot?.project_id || current.project_id,
      lot_id: lotId || current.lot_id,
    }));
    setOpen(true);
    setSearchParams({}, { replace: true });
  }, [lots, searchParams, setSearchParams]);

  const set = (k: keyof typeof emptyForm, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const projectLots = useMemo(
    () => lots.filter((lot) => !form.project_id || lot.project_id === form.project_id),
    [lots, form.project_id],
  );

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    return {
      upcoming: visits.filter((v) => isAfter(new Date(v.scheduled_at), now) && v.status !== 'done'),
      past: visits.filter((v) => !isAfter(new Date(v.scheduled_at), now) || v.status === 'done').reverse(),
    };
  }, [visits]);

  const submit = async () => {
    if (!form.visitor_name.trim() || !form.date || !form.time) return;
    await createVisit.mutateAsync({
      visitor_name: form.visitor_name.trim(),
      visitor_email: form.visitor_email || null,
      visitor_phone: form.visitor_phone || null,
      scheduled_at: new Date(`${form.date}T${form.time}`).toISOString(),
      duration_minutes: Number(form.duration_minutes) || 60,
      mode: form.mode,
      status: 'scheduled',
      lead_id: form.lead_id || null,
      project_id: form.project_id || null,
      lot_id: form.lot_id || null,
      notes: form.notes || null,
    });
    setForm(emptyForm);
    setOpen(false);
  };

  const openResult = (visit: Visit) => {
    setResultVisit(visit);
    setResult({
      outcome: visit.outcome ?? '',
      result_notes: visit.result_notes ?? '',
      next_action: visit.next_action ?? '',
      follow_up_at: visit.follow_up_at ? visit.follow_up_at.slice(0, 16) : '',
    });
  };

  const saveResult = async () => {
    if (!resultVisit || !result.outcome) return;
    await updateVisit.mutateAsync({
      id: resultVisit.id,
      status: 'done',
      outcome: result.outcome,
      result_notes: result.result_notes.trim() || null,
      next_action: result.next_action || null,
      follow_up_at: result.follow_up_at ? new Date(result.follow_up_at).toISOString() : null,
      completed_at: new Date().toISOString(),
    });
    setResultVisit(null);
    setResult(emptyResult);
  };

  const VisitRow = ({ v }: { v: Visit }) => {
    const st = VISIT_STATUS[(v.status as VisitStatus) ?? 'scheduled'] ?? VISIT_STATUS.scheduled;
    const project = projects.find((p) => p.id === v.project_id);
    const lot = lots.find((item) => item.id === v.lot_id);
    const nextActionLabel = VISIT_NEXT_ACTIONS.find((item) => item.value === v.next_action)?.label;
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <div className="min-w-[9rem]">
          <p className="font-medium">{format(new Date(v.scheduled_at), 'd MMM yyyy', { locale: es })}</p>
          <p className="text-sm text-muted-foreground">{format(new Date(v.scheduled_at), 'HH:mm')} · {v.duration_minutes} min</p>
        </div>
        <div className="min-w-[12rem] flex-1">
          <p className="flex items-center gap-1.5 font-medium"><User className="h-3.5 w-3.5 text-muted-foreground" />{v.visitor_name}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />{project?.name ?? 'Sin proyecto'}{lot ? ` · ${lot.name || `Lote ${lot.lot_number}`}` : ''} · {v.mode}
          </p>
          {v.outcome && (
            <p className="mt-1 text-xs text-muted-foreground">
              Resultado: {VISIT_OUTCOMES.find((item) => item.value === v.outcome)?.label ?? v.outcome}
              {nextActionLabel ? ` · Próxima acción: ${nextActionLabel}` : ''}
            </p>
          )}
        </div>
        <Badge variant="outline" className={cn('border', st.className)}>{st.label}</Badge>
        <div className="flex flex-wrap gap-2">
          {v.status !== 'done' && <Button size="sm" variant="outline" onClick={() => openResult(v)}>Registrar resultado</Button>}
          {v.lot_id && v.next_action === 'quote' && (
            <Button size="sm" variant="outline" asChild><Link to={`/asesor/executive?lot=${encodeURIComponent(v.lot_id)}&action=quote`}><FileText className="mr-1.5 h-4 w-4" />Cotizar</Link></Button>
          )}
          {v.lot_id && v.next_action === 'reserve' && (
            <Button size="sm" asChild><Link to={`/asesor/executive?lot=${encodeURIComponent(v.lot_id)}&action=reserve`}><ShoppingCart className="mr-1.5 h-4 w-4" />Reservar</Link></Button>
          )}
          <Select value={v.status} onValueChange={(status) => updateVisit.mutate({ id: v.id, status })}>
            <SelectTrigger className="w-[10.5rem]" aria-label={`Estado de la visita de ${v.visitor_name}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(VISIT_STATUS).map(([k, cfg]) => <SelectItem key={k} value={k}>{cfg.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visitas</h1>
          <p className="text-muted-foreground">Agenda, parcela visitada, resultado comercial y siguiente acción en un solo flujo.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Agendar visita</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nueva visita</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="v-name">Visitante *</Label><Input id="v-name" value={form.visitor_name} onChange={(e) => set('visitor_name', e.target.value)} /></div>
              <div><Label htmlFor="v-email">Email</Label><Input id="v-email" type="email" value={form.visitor_email} onChange={(e) => set('visitor_email', e.target.value)} /></div>
              <div><Label htmlFor="v-phone">Teléfono</Label><Input id="v-phone" value={form.visitor_phone} onChange={(e) => set('visitor_phone', e.target.value)} /></div>
              <div><Label htmlFor="v-date">Fecha *</Label><Input id="v-date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
              <div><Label htmlFor="v-time">Hora *</Label><Input id="v-time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} /></div>
              <div><Label htmlFor="v-dur">Duración (min)</Label><Input id="v-dur" type="number" min={15} step={15} value={form.duration_minutes} onChange={(e) => set('duration_minutes', Number(e.target.value))} /></div>
              <div>
                <Label>Modalidad</Label>
                <Select value={form.mode} onValueChange={(v) => set('mode', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VISIT_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div>
                <Label>Lead</Label>
                <Select value={form.lead_id} onValueChange={(v) => set('lead_id', v)}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.first_name} {l.last_name ?? ''}</SelectItem>)}</SelectContent></Select>
              </div>
              <div>
                <Label>Proyecto</Label>
                <Select value={form.project_id} onValueChange={(v) => { set('project_id', v); set('lot_id', ''); }}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Parcela</Label>
                <Select value={form.lot_id} onValueChange={(v) => set('lot_id', v)}><SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger><SelectContent>{projectLots.map((lot) => <SelectItem key={lot.id} value={lot.id}>{lot.name || `Lote ${lot.lot_number}`}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="sm:col-span-2"><Label htmlFor="v-notes">Notas previas</Label><Textarea id="v-notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={createVisit.isPending}>Agendar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList><TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger><TabsTrigger value="past">Historial ({past.length})</TabsTrigger></TabsList>
        {(['upcoming', 'past'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4" />{tab === 'upcoming' ? 'Agenda' : 'Visitas pasadas'}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isLoading && <Skeleton className="h-20 w-full" />}
                {(tab === 'upcoming' ? upcoming : past).map((v) => <VisitRow key={v.id} v={v} />)}
                {!isLoading && (tab === 'upcoming' ? upcoming : past).length === 0 && <p className="py-10 text-center text-muted-foreground">No hay visitas registradas.</p>}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!resultVisit} onOpenChange={(value) => !value && setResultVisit(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Resultado de visita</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Resultado *</Label><Select value={result.outcome} onValueChange={(value) => setResult((current) => ({ ...current, outcome: value as VisitOutcome }))}><SelectTrigger><SelectValue placeholder="Seleccionar resultado" /></SelectTrigger><SelectContent>{VISIT_OUTCOMES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Observaciones</Label><Textarea value={result.result_notes} onChange={(e) => setResult((current) => ({ ...current, result_notes: e.target.value }))} placeholder="Qué le gustó, objeciones, condiciones, decisión…" /></div>
            <div><Label>Siguiente acción</Label><Select value={result.next_action} onValueChange={(value) => setResult((current) => ({ ...current, next_action: value as VisitNextAction }))}><SelectTrigger><SelectValue placeholder="Definir siguiente acción" /></SelectTrigger><SelectContent>{VISIT_NEXT_ACTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
            {(result.next_action === 'follow_up' || result.next_action === 'reschedule') && <div><Label>Fecha de seguimiento</Label><Input type="datetime-local" value={result.follow_up_at} onChange={(e) => setResult((current) => ({ ...current, follow_up_at: e.target.value }))} /></div>}
          </div>
          <DialogFooter><Button onClick={saveResult} disabled={!result.outcome || updateVisit.isPending}>{updateVisit.isPending ? 'Guardando…' : 'Guardar resultado'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VisitsManager;
