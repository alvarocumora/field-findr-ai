import { useMemo, useState } from 'react';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock, Plus, MapPin, User } from 'lucide-react';
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
import { useVisits, VISIT_STATUS, VISIT_MODES, VisitStatus, Visit } from '@/hooks/useVisits';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
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
  notes: '',
};

const VisitsManager = () => {
  const { visits, isLoading, createVisit, updateVisit } = useVisits();
  const { leads } = useLeads();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = (k: keyof typeof emptyForm, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    return {
      upcoming: visits.filter((v) => isAfter(new Date(v.scheduled_at), now)),
      past: visits.filter((v) => !isAfter(new Date(v.scheduled_at), now)).reverse(),
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
      notes: form.notes || null,
    });
    setForm(emptyForm);
    setOpen(false);
  };

  const VisitRow = ({ v }: { v: Visit }) => {
    const st = VISIT_STATUS[(v.status as VisitStatus) ?? 'scheduled'] ?? VISIT_STATUS.scheduled;
    const project = projects.find((p) => p.id === v.project_id);
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <div className="min-w-[9rem]">
          <p className="font-medium">
            {format(new Date(v.scheduled_at), "d MMM yyyy", { locale: es })}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(v.scheduled_at), 'HH:mm')} · {v.duration_minutes} min
          </p>
        </div>
        <div className="flex-1 min-w-[12rem]">
          <p className="font-medium flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {v.visitor_name}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {project?.name ?? 'Sin proyecto'} · {v.mode}
          </p>
        </div>
        <Badge variant="outline" className={cn('border', st.className)}>{st.label}</Badge>
        <Select
          value={v.status}
          onValueChange={(status) => updateVisit.mutate({ id: v.id, status })}
        >
          <SelectTrigger className="w-[10.5rem]" aria-label={`Estado de la visita de ${v.visitor_name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(VISIT_STATUS).map(([k, cfg]) => (
              <SelectItem key={k} value={k}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visitas</h1>
          <p className="text-muted-foreground">
            Agenda con fecha y hora, seguimiento de estado y resultado de cada visita.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Agendar visita</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nueva visita</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="v-name">Visitante *</Label>
                <Input id="v-name" value={form.visitor_name}
                  onChange={(e) => set('visitor_name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="v-email">Email</Label>
                <Input id="v-email" type="email" value={form.visitor_email}
                  onChange={(e) => set('visitor_email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="v-phone">Teléfono</Label>
                <Input id="v-phone" value={form.visitor_phone}
                  onChange={(e) => set('visitor_phone', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="v-date">Fecha *</Label>
                <Input id="v-date" type="date" value={form.date}
                  onChange={(e) => set('date', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="v-time">Hora *</Label>
                <Input id="v-time" type="time" value={form.time}
                  onChange={(e) => set('time', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="v-dur">Duración (min)</Label>
                <Input id="v-dur" type="number" min={15} step={15} value={form.duration_minutes}
                  onChange={(e) => set('duration_minutes', Number(e.target.value))} />
              </div>
              <div>
                <Label>Modalidad</Label>
                <Select value={form.mode} onValueChange={(v) => set('mode', v)}>
                  <SelectTrigger aria-label="Modalidad"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIT_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead</Label>
                <Select value={form.lead_id} onValueChange={(v) => set('lead_id', v)}>
                  <SelectTrigger aria-label="Lead asociado"><SelectValue placeholder="Opcional" /></SelectTrigger>
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
                <Label htmlFor="v-notes">Notas</Label>
                <Textarea id="v-notes" value={form.notes}
                  onChange={(e) => set('notes', e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={createVisit.isPending}>Agendar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Próximas ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Historial ({past.length})</TabsTrigger>
        </TabsList>
        {(['upcoming', 'past'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  {tab === 'upcoming' ? 'Agenda' : 'Visitas pasadas'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading && <Skeleton className="h-20 w-full" />}
                {(tab === 'upcoming' ? upcoming : past).map((v) => <VisitRow key={v.id} v={v} />)}
                {!isLoading && (tab === 'upcoming' ? upcoming : past).length === 0 && (
                  <p className="text-center text-muted-foreground py-10">
                    No hay visitas registradas.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default VisitsManager;
