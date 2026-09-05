import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Send, Video } from 'lucide-react';
import { toast } from 'sonner';

import PublicLayout from '@/components/layouts/PublicLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateMeetingRequest } from '@/hooks/useMeetings';
import {
  MEETING_BLOCK_LABELS,
  MEETING_TYPE_LABELS,
  type MeetingBlock,
  type MeetingType,
} from '@/lib/meetings/status';

const minPreferredDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

const Agendar = () => {
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source') || 'web';
  const createMeeting = useCreateMeetingRequest();
  const [submitted, setSubmitted] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>('reunion_campo');
  const [preferredBlock, setPreferredBlock] = useState<MeetingBlock>('manana');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferredDate: '',
    context: '',
  });

  const set = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await createMeeting.mutateAsync({
        meetingType,
        requesterName: form.name,
        requesterPhone: form.phone,
        requesterEmail: form.email,
        context: form.context,
        preferredDate: form.preferredDate,
        preferredBlock,
        source,
      });

      setSubmitted(true);
      toast.success('Solicitud de reunión enviada');
    } catch (error) {
      console.error('Meeting request error:', error);
      toast.error('No se pudo enviar la solicitud. Intenta nuevamente.');
    }
  };

  return (
    <PublicLayout>
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">Agenda tu reunión</Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Conversemos por videollamada</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Elige el día y bloque que te acomode. Te confirmamos por WhatsApp con el link
              de la videollamada (Google Meet o Zoom).
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Cómo funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ol className="list-decimal space-y-2 pl-5">
                <li>Nos cuentas quién eres y qué día te acomoda.</li>
                <li>Te confirmamos el horario por WhatsApp con el link de la videollamada.</li>
                <li>Nos juntamos 30–45 minutos y revisamos tu caso con números sobre la mesa.</li>
              </ol>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-medium text-foreground">Si tienes un campo</p>
                <p className="mt-1">
                  Evaluamos sin costo su potencial de parcelación: superficie vendible, escenarios
                  de venta y cómo funcionaría la asociación. Desde 15 hectáreas.
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-medium text-foreground">Si buscas tu parcela</p>
                <p className="mt-1">
                  Revisamos juntos los proyectos disponibles, formas de pago y el paso a paso
                  de la reserva a la escritura.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{submitted ? 'Solicitud enviada' : 'Reserva tu horario'}</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" />
                  <p className="font-semibold text-foreground">Recibimos tu solicitud.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Te escribiremos por WhatsApp para confirmar el horario y enviarte el link
                    de la videollamada.
                  </p>
                  <Button asChild className="mt-6">
                    <Link to="/">Volver al inicio</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Motivo de la reunión</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(Object.keys(MEETING_TYPE_LABELS) as MeetingType[]).map((type) => (
                        <Button
                          key={type}
                          type="button"
                          variant={meetingType === type ? 'default' : 'outline'}
                          className="w-full"
                          onClick={() => setMeetingType(type)}
                        >
                          {MEETING_TYPE_LABELS[type]}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre *</Label>
                      <Input id="name" required value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="Nombre y apellido" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono / WhatsApp *</Label>
                      <Input id="phone" required value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+56 9..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="tu@correo.cl" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="preferredDate">Día que te acomoda</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        min={minPreferredDate()}
                        value={form.preferredDate}
                        onChange={(event) => set('preferredDate', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bloque</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(MEETING_BLOCK_LABELS) as MeetingBlock[]).map((block) => (
                          <Button
                            key={block}
                            type="button"
                            variant={preferredBlock === block ? 'default' : 'outline'}
                            className="w-full"
                            onClick={() => setPreferredBlock(block)}
                          >
                            {MEETING_BLOCK_LABELS[block]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">Cuéntanos de tu caso</Label>
                    <Textarea
                      id="context"
                      value={form.context}
                      onChange={(event) => set('context', event.target.value)}
                      placeholder={meetingType === 'reunion_campo'
                        ? 'Ej: tengo un campo de 20 hectáreas en la región del Maule...'
                        : 'Ej: busco una parcela de 5.000 m² cerca de...'}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createMeeting.isPending}>
                    {createMeeting.isPending ? 'Enviando...' : 'Solicitar reunión'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Confirmamos dentro del mismo día hábil.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Agendar;
