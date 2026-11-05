import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';
import { useSubmitBrokerApplication } from '@/hooks/useBrokers';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Ingresa tu nombre completo').max(120),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().max(40).optional(),
  country: z.string().min(2),
  region: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(160).optional(),
  taxId: z.string().trim().max(40).optional(),
  experienceYears: z.number().int().min(0).max(70).optional(),
  specialty: z.string().trim().max(120).optional(),
  socials: z.string().trim().max(500).optional(),
  motivation: z.string().trim().max(2000).optional(),
});

const COUNTRIES = [
  { code: 'CL', label: 'Chile' },
  { code: 'AR', label: 'Argentina' },
  { code: 'PE', label: 'Perú' },
  { code: 'CO', label: 'Colombia' },
  { code: 'MX', label: 'México' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'PY', label: 'Paraguay' },
];

const SPECIALTIES = [
  'Parcelas de agrado',
  'Loteos urbanos',
  'Terrenos agrícolas',
  'Terrenos industriales',
  'Inversión / desarrollo',
  'Otro',
];

const BrokerSignup = () => {
  const [params] = useSearchParams();
  const submit = useSubmitBrokerApplication();
  const [done, setDone] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { user } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'CL',
    region: '',
    city: '',
    companyName: '',
    taxId: '',
    experienceYears: '',
    specialty: '',
    socials: '',
    motivation: '',
  });

  useSEO({
    title: 'Inscripción de brokers | Oferta Terrenos',
    description:
      'Postula a la comunidad de brokers de Oferta Terrenos y empieza a vender loteos y parcelas con comisión trazable.',
    canonicalUrl: '/brokers/inscripcion',
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      phone: form.phone || undefined,
      region: form.region || undefined,
      city: form.city || undefined,
      companyName: form.companyName || undefined,
      taxId: form.taxId || undefined,
      specialty: form.specialty || undefined,
      socials: form.socials || undefined,
      motivation: form.motivation || undefined,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa los datos');
      return;
    }
    const d = parsed.data;
    await submit.mutateAsync({
      fullName: d.fullName,
      email: d.email,
      phone: d.phone,
      country: d.country,
      region: d.region,
      city: d.city,
      companyName: d.companyName,
      taxId: d.taxId,
      experienceYears: d.experienceYears,
      specialty: d.specialty,
      socials: d.socials,
      motivation: d.motivation,
      source: params.get('source') ?? 'brokers-landing',
      invitedByCode: params.get('ref') ?? undefined,
    });
    setSubmittedEmail(d.email);
    setDone(true);
  };

  if (done) {
    return (
      <PublicLayout>
        <div className="container px-4 py-24 max-w-lg text-center">
          <CheckCircle2 className="h-14 w-14 mx-auto mb-4 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold mb-2">Postulación recibida</h1>
          <p className="text-muted-foreground mb-6">
            Revisamos tu perfil y te contactamos en menos de 48 horas hábiles con el acceso
            a la plataforma y al catálogo de proyectos.
          </p>
          {user ? (
            <p className="mb-8 rounded-lg border bg-muted/40 p-4 text-sm">
              Tu postulación quedó ligada a tu cuenta. Cuando la aprobemos verás tu panel en
              <strong> Mi negocio broker</strong> y te llegará un aviso.
            </p>
          ) : (
            <div className="mb-8 rounded-lg border bg-muted/40 p-4 text-left text-sm space-y-3">
              <p>
                <strong>Siguiente paso:</strong> crea tu cuenta con el mismo correo
                {submittedEmail ? <> (<strong>{submittedEmail}</strong>)</> : null}, o entra con Google usando ese
                correo. Así activamos tu acceso apenas aprobemos tu postulación.
              </p>
              <Button asChild className="w-full">
                <Link to={`/auth?redirect=${encodeURIComponent('/asesor/mi-negocio')}`}>Crear mi cuenta</Link>
              </Button>
            </div>
          )}
          <Button asChild variant="outline"><Link to="/brokers/ranking">Conocer la comunidad</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Inscríbete como broker</CardTitle>
            <CardDescription>
              Cuéntanos quién eres y dónde trabajas. Al aprobar tu perfil recibirás acceso al
              catálogo de loteos, tu link personal y el kit de venta.
              {params.get('ref') && (
                <span className="block mt-2 text-primary">
                  Invitación de {params.get('ref')} aplicada.
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo *</Label>
                  <Input id="fullName" value={form.fullName} maxLength={120}
                    onChange={(e) => set('fullName')(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.email} maxLength={255}
                    onChange={(e) => set('email')(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                  <Input id="phone" value={form.phone} maxLength={40}
                    onChange={(e) => set('phone')(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">País *</Label>
                  <Select value={form.country} onValueChange={set('country')}>
                    <SelectTrigger id="country"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Región</Label>
                  <Input id="region" value={form.region} maxLength={120}
                    onChange={(e) => set('region')(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad / comuna</Label>
                  <Input id="city" value={form.city} maxLength={120}
                    onChange={(e) => set('city')(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Empresa / corredora</Label>
                  <Input id="companyName" value={form.companyName} maxLength={160}
                    onChange={(e) => set('companyName')(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">RUT / ID tributario</Label>
                  <Input id="taxId" value={form.taxId} maxLength={40}
                    onChange={(e) => set('taxId')(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Años de experiencia</Label>
                  <Input id="experienceYears" type="number" min={0} max={70}
                    value={form.experienceYears}
                    onChange={(e) => set('experienceYears')(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidad</Label>
                  <Select value={form.specialty} onValueChange={set('specialty')}>
                    <SelectTrigger id="specialty"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {SPECIALTIES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="socials">Sitio web o redes</Label>
                <Input id="socials" value={form.socials} maxLength={500}
                  placeholder="instagram.com/tucuenta, linkedin.com/in/…"
                  onChange={(e) => set('socials')(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation">¿Qué proyectos te interesa vender?</Label>
                <Textarea id="motivation" value={form.motivation} maxLength={2000} rows={4}
                  onChange={(e) => set('motivation')(e.target.value)} />
              </div>

              <Button type="submit" className="w-full" disabled={submit.isPending}>
                {submit.isPending ? 'Enviando…' : 'Enviar postulación'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default BrokerSignup;
