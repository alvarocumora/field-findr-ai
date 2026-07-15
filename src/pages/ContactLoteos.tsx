import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { toast } from 'sonner';

import PublicLayout from '@/components/layouts/PublicLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCommercialPlanLead } from '@/hooks/useCommercialPlanLead';

const planLabels: Record<string, string> = {
  'starter-loteo': 'Starter Loteo',
  'growth-inmobiliaria': 'Growth Inmobiliaria',
  'enterprise-loteos': 'Enterprise Loteos',
};

const ContactLoteos = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'growth-inmobiliaria';
  const source = searchParams.get('source') || 'planes-loteos';
  const createLead = useCreateCommercialPlanLead();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    message: '',
  });

  const planLabel = useMemo(() => planLabels[selectedPlan] ?? selectedPlan, [selectedPlan]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await createLead.mutateAsync({
        planSlug: selectedPlan,
        source,
        companyName: form.companyName,
        contactName: form.contactName,
        email: form.email,
        phone: form.phone,
        message: form.message,
        metadata: {
          page: 'contacto-loteos',
          plan_label: planLabel,
        },
      });

      setSubmitted(true);
      toast.success('Solicitud recibida');
    } catch (error) {
      console.error('Commercial lead submit error:', error);
      toast.error('No se pudo enviar la solicitud. Intenta nuevamente.');
    }
  };

  return (
    <PublicLayout>
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container py-12 md:py-16">
          <Button asChild variant="ghost" className="mb-6">
            <Link to="/planes-loteos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a planes
            </Link>
          </Button>

          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">Solicitud comercial</Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Agenda una demo para {planLabel}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Déjanos tus datos y prepararemos una propuesta para operar tus loteos con vitrina pública, leads, CRM, reservas y control comercial.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Resumen de solicitud</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Plan seleccionado</p>
                <p>{planLabel}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Origen</p>
                <p>{source}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="font-medium text-foreground">Qué revisaremos en la demo</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>cantidad de proyectos y lotes activos;</li>
                  <li>flujo actual de leads y reservas;</li>
                  <li>vitrina pública y equipo comercial;</li>
                  <li>próximos pasos para activación.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{submitted ? 'Solicitud enviada' : 'Datos de contacto'}</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" />
                  <p className="font-semibold text-foreground">Recibimos tu solicitud comercial.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    El equipo revisará los datos y podrá contactar a la inmobiliaria para coordinar la demo.
                  </p>
                  <Button asChild className="mt-6">
                    <Link to="/planes-loteos">Volver a planes</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Inmobiliaria / empresa</Label>
                      <Input id="companyName" value={form.companyName} onChange={(event) => set('companyName', event.target.value)} placeholder="Nombre de la empresa" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Nombre contacto</Label>
                      <Input id="contactName" value={form.contactName} onChange={(event) => set('contactName', event.target.value)} placeholder="Nombre y apellido" />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" required value={form.email} onChange={(event) => set('email', event.target.value)} placeholder="contacto@empresa.cl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                      <Input id="phone" value={form.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+56 9..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(event) => set('message', event.target.value)}
                      placeholder="Cuéntanos cuántos proyectos/lotes gestionas y qué necesitas resolver."
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createLead.isPending}>
                    {createLead.isPending ? 'Enviando...' : 'Solicitar demo'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
};

export default ContactLoteos;
