import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Plus, ScanLine, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateEvent, useEventActions, useEventFunnel, useEventRegistrations, useMyEvents } from '@/hooks/useEvents';

const EventsManager = () => {
  const { data: events = [] } = useMyEvents();
  const createEvent = useCreateEvent();
  const actions = useEventActions();
  const [selectedId, setSelectedId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [checkinCode, setCheckinCode] = useState('');
  const [form, setForm] = useState({ title: '', slug: '', description: '', starts_at: '', venue: '', address: '', capacity: '40' });
  const { data: registrations = [] } = useEventRegistrations(selectedId);
  const { data: funnel } = useEventFunnel(selectedId);

  useEffect(() => { if (!selectedId && events[0]) setSelectedId(events[0].id); }, [events, selectedId]);
  const selected = events.find((event) => event.id === selectedId);

  const submit = async () => {
    const created = await createEvent.mutateAsync({
      title: form.title.trim(), slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      description: form.description || null, starts_at: new Date(form.starts_at).toISOString(),
      venue: form.venue || null, address: form.address || null, capacity: Number(form.capacity) || null, status: 'published',
    });
    setSelectedId(created.id); setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><Badge variant="outline">Eventos 1:N</Badge><h1 className="mt-2 text-2xl font-bold">Open Land y eventos</h1><p className="text-sm text-muted-foreground">Publica, registra asistencia y convierte participantes en leads.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Crear evento</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo evento</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} /></div>
              <div className="sm:col-span-2"><Label>Slug público</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Fecha y hora</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><Label>Cupos</Label><Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
              <div><Label>Lugar</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
              <div><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button disabled={!form.title || !form.slug || !form.starts_at || createEvent.isPending} onClick={submit}>Publicar evento</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card><CardHeader><CardTitle className="text-base">Mis eventos</CardTitle></CardHeader><CardContent className="space-y-2">
          {events.map((event) => <button type="button" key={event.id} onClick={() => setSelectedId(event.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === event.id ? 'border-primary bg-primary/5' : ''}`}><p className="font-medium">{event.title}</p><p className="text-xs text-muted-foreground">{new Date(event.starts_at).toLocaleString('es-CL')}</p></button>)}
          {events.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay eventos.</p>}
        </CardContent></Card>

        <div className="space-y-4">
          {selected && <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[['Inscritos', funnel?.registered || 0], ['Asistentes', funnel?.attended || 0], ['Leads', funnel?.leads || 0], ['Reservas', funnel?.reservations || 0]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></CardContent></Card>)}
            </div>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ScanLine className="h-4 w-4" />Check-in</CardTitle></CardHeader><CardContent className="flex gap-2"><Input placeholder="Código de asistencia" value={checkinCode} onChange={(e) => setCheckinCode(e.target.value.toUpperCase())} /><Button disabled={!checkinCode || actions.checkin.isPending} onClick={async () => { await actions.checkin.mutateAsync(checkinCode); setCheckinCode(''); }}>Registrar</Button></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" />Asistentes</CardTitle></CardHeader><CardContent className="space-y-2">
              {registrations.map((registration) => <div key={registration.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{registration.attendee_name}</p><p className="text-xs text-muted-foreground">{registration.attendee_email} · {registration.checkin_code}</p></div><div className="flex items-center gap-2"><Badge variant={registration.status === 'attended' ? 'default' : 'secondary'}>{registration.status === 'attended' ? <><CheckCircle2 className="mr-1 h-3 w-3" />Asistió</> : registration.status}</Badge><Button size="sm" variant="outline" disabled={!!registration.lead_id || actions.convert.isPending} onClick={() => actions.convert.mutate(registration.id)}><UserPlus className="mr-1 h-4 w-4" />{registration.lead_id ? 'Lead creado' : 'Crear lead'}</Button></div></div>)}
              {registrations.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Sin inscritos todavía.</p>}
            </CardContent></Card>
          </>}
        </div>
      </div>
    </div>
  );
};
export default EventsManager;
