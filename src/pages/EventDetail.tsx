import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, MapPin } from 'lucide-react';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEventBySlug, useRegisterForEvent } from '@/hooks/useEvents';

const EventDetail = () => {
  const { slug } = useParams();
  const { data: event, isLoading } = useEventBySlug(slug);
  const register = useRegisterForEvent();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [code, setCode] = useState('');

  if (isLoading) return <PublicLayout><p className="py-24 text-center">Cargando…</p></PublicLayout>;
  if (!event) return <PublicLayout><p className="py-24 text-center">Evento no encontrado.</p></PublicLayout>;

  const submit = async () => {
    const result = await register.mutateAsync({ eventId: event.id, ...form });
    setCode(result.checkin_code);
  };

  return (
    <PublicLayout>
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 lg:grid-cols-[1fr_380px]">
        <section>
          <p className="text-sm font-medium text-primary">Open Land</p>
          <h1 className="mt-2 text-3xl font-bold">{event.title}</h1>
          <div className="mt-5 space-y-2 text-sm">
            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{new Date(event.starts_at).toLocaleString('es-CL')}</p>
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{event.venue || event.address || 'Por confirmar'}</p>
          </div>
          <p className="mt-6 whitespace-pre-line text-muted-foreground">{event.description}</p>
        </section>
        <Card>
          <CardHeader><CardTitle>{code ? 'Inscripción confirmada' : 'Reserva tu cupo'}</CardTitle></CardHeader>
          <CardContent>
            {code ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <p>Presenta este código al llegar:</p>
                <p className="rounded-lg bg-muted p-4 font-mono text-2xl font-bold tracking-widest">{code}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>WhatsApp</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <Button className="w-full" disabled={!form.name || !form.email || register.isPending} onClick={submit}>{register.isPending ? 'Inscribiendo…' : 'Inscribirme'}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </PublicLayout>
  );
};
export default EventDetail;
