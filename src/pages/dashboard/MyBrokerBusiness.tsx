import CommercialTasks from '@/components/dashboard/CommercialTasks';
import { WorkspaceLoadError } from '@/components/dashboard/WorkspaceLoadError';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Briefcase, Copy, Trophy, Share2, FileText, MessageSquare, Users, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAgentCommissions } from '@/hooks/useAgentCommissions';
import { useReferralCommissionsEarned } from '@/hooks/useReferrals.commissions';
import {
  useMyBrokerProfile, useUpdateMyBrokerProfile, useMarkBrokerLinkShared, useProjectAssignments, useBrokerRanking,
} from '@/hooks/useBrokers';
import { getCanonicalUrl, getShareUrl } from '@/lib/publicUrls';
import { BROKER_GUIDE_URL, brokerCommissionSummary } from '@/lib/brokerProgram';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    .format(n || 0);

const RESOURCES = [
  {
    icon: FileText,
    title: 'Guía de venta de parcelas DL 3.516',
    text: 'Qué revisar antes de ofrecer: dominio vigente, subdivisión, servidumbres y factibilidades.',
  },
  {
    icon: MessageSquare,
    title: 'Scripts de WhatsApp',
    text: 'Primer contacto, seguimiento a 48 h, envío de ficha y cierre de visita.',
  },
  {
    icon: Users,
    title: 'Cómo construir tu red',
    text: 'Invita brokers con tu link y participa del override configurado por la plataforma.',
  },
];

const MyBrokerBusiness = () => {
  const profileQuery = useMyBrokerProfile();
  const { data: profile } = profileQuery;
  const updateProfile = useUpdateMyBrokerProfile();
  const markLinkShared = useMarkBrokerLinkShared();
  const commissionsQuery = useAgentCommissions();
  const { data: commissions = [] } = commissionsQuery;
  const earnedQuery = useReferralCommissionsEarned();
  const { data: earned = [] } = earnedQuery;
  const assignmentsQuery = useProjectAssignments();
  const { data: assignments = [] } = assignmentsQuery;
  const rankingQuery = useBrokerRanking(10);
  const { data: ranking = [] } = rankingQuery;

  const [bio, setBio] = useState<string | null>(null);
  const [zones, setZones] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string | null>(null);

  const totals = useMemo(() => {
    const active = commissions.filter((c) => c.status !== 'cancelled');
    return {
      paid: active.filter((c) => c.status === 'paid')
        .reduce((s, c) => s + (c.commission_amount || 0), 0),
      pending: active.filter((c) => c.status !== 'paid')
        .reduce((s, c) => s + (c.commission_amount || 0), 0),
      sales: active.filter((c) => ['earned', 'approved', 'paid'].includes(c.status)).length,
      network: earned.reduce((s, c) => s + (c.referral_amount || 0), 0),
    };
  }, [commissions, earned]);

  const approvedProjects = assignments.filter((a) => a.status === 'approved').length;

  const inviteUrl = profile
    ? getShareUrl('/brokers/inscripcion', { ref: profile.invite_code })
    : '';
  const showcaseUrl = profile ? getCanonicalUrl(`/b/${profile.slug}`) : '';

  const steps = [
    { label: 'Completa tu perfil público', done: !!profile?.bio },
    { label: 'Define tus zonas de trabajo', done: (profile?.zones?.length ?? 0) > 0 },
    { label: 'Agrega tus especialidades', done: (profile?.specialties?.length ?? 0) > 0 },
    { label: 'Solicita tu primer proyecto', done: assignments.length > 0 },
    { label: 'Comparte tu link personal', done: (profile?.onboarding_step ?? 0) >= 4 },
    { label: 'Obtén tu primera comisión ganada', done: totals.sales > 0 },
  ];
  const progress = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copiado');
      if ((profile?.onboarding_step ?? 0) < 4) markLinkShared.mutate();
    } catch {
      toast.error('No se pudo copiar. Selecciona el enlace y cópialo manualmente.');
    }
  };

  const queries = [profileQuery, commissionsQuery, earnedQuery, assignmentsQuery, rankingQuery];
  if (queries.some((query) => query.error)) return (
    <div className="container p-4 md:p-6">
      <WorkspaceLoadError title="No pudimos cargar tu negocio" onRetry={() => Promise.all(queries.map((query) => query.refetch()))} />
    </div>
  );
  if (queries.some((query) => query.isLoading)) return (
    <div className="container p-4 md:p-6 space-y-4" role="status" aria-label="Cargando tu negocio">
      <Skeleton className="h-12 w-1/2" /><Skeleton className="h-48 w-full" />
    </div>
  );

  if (!profile) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <Briefcase className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
            <h1 className="text-xl font-semibold">Aún no eres parte de la comunidad de brokers</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Postula para acceder al catálogo de loteos, tu link personal, el kit de venta y el
              ranking de la comunidad.
            </p>
            <Button asChild><Link to="/brokers/inscripcion">Postular como broker</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi negocio</h1>
          <p className="text-muted-foreground">
            {profile.display_name} · nivel {profile.level} · comisión base {profile.base_commission_rate}%
          </p>
        </div>
        <Badge variant={profile.is_active ? 'default' : 'outline'}>
          {profile.is_active ? 'Broker activo' : 'Suspendido'}
        </Badge>
      </div>

      <CommercialTasks />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Comisiones cobradas', value: fmt(totals.paid), icon: DollarSign },
          { label: 'Comisiones no pagadas (incluye potenciales)', value: fmt(totals.pending), icon: DollarSign },
          { label: 'Comisiones ganadas o pagadas', value: String(totals.sales), icon: Trophy },
          { label: 'Proyectos asignados', value: String(approvedProjects), icon: Briefcase },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <s.icon className="h-4 w-4 text-primary mb-2" aria-hidden="true" />
              <p className="text-lg font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Onboarding de broker</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} aria-label={`Onboarding ${progress}% completado`} />
            <ul className="space-y-2">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${s.done ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  <span className={s.done ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mis links</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Vitrina personal</p>
              <div className="flex gap-2">
                <Input readOnly value={showcaseUrl} className="font-mono text-xs" />
                <Button variant="outline" size="icon" aria-label="Copiar vitrina"
                  onClick={() => copy(showcaseUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Invitar brokers a mi red</p>
              <div className="flex gap-2">
                <Input readOnly value={inviteUrl} className="font-mono text-xs" />
                <Button variant="outline" size="icon" aria-label="Copiar invitación"
                  onClick={() => copy(inviteUrl)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Override de red: {profile.network_override_rate}% · ganado {fmt(totals.network)}
              </p>
              <Button variant="link" className="px-0" asChild>
                <Link to="/asesor/red">Ver árbol de referidos y atribución →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mi perfil público</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Presentación</Label>
              <Textarea id="bio" rows={4} maxLength={800}
                value={bio ?? profile.bio ?? ''}
                onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zones">Zonas de trabajo (separadas por coma)</Label>
              <Input id="zones" value={zones ?? (profile.zones ?? []).join(', ')}
                onChange={(e) => setZones(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Especialidades (separadas por coma)</Label>
              <Input id="specialties"
                value={specialties ?? (profile.specialties ?? []).join(', ')}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="Parcelas, agrícola, industrial" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="isPublic">Aparecer en el directorio público</Label>
                <p className="text-xs text-muted-foreground">Publica tu nombre, bio, zonas y especialidades.</p>
              </div>
              <Switch id="isPublic" checked={profile.is_public}
                onCheckedChange={(v) => updateProfile.mutate({ is_public: v })} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="publicContact">Mostrar teléfono y email públicamente</Label>
                <p className="text-xs text-muted-foreground">Requiere consentimiento independiente del perfil público.</p>
              </div>
              <Switch id="publicContact" checked={profile.public_contact_opt_in}
                onCheckedChange={(v) => updateProfile.mutate({ public_contact_opt_in: v })} />
            </div>
            <Button
              disabled={updateProfile.isPending}
              onClick={() => updateProfile.mutate({
                bio: bio ?? profile.bio,
                zones: (zones ?? (profile.zones ?? []).join(', '))
                  .split(',').map((z) => z.trim()).filter(Boolean),
                specialties: (specialties ?? (profile.specialties ?? []).join(', '))
                  .split(',').map((value) => value.trim()).filter(Boolean),
              })}
            >
              Guardar perfil
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ranking de la comunidad</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {ranking.map((b, i) => (
                <li key={b.slug} className="flex items-center justify-between text-sm">
                  <span className="truncate">
                    <span className="text-muted-foreground mr-2">{i + 1}.</span>
                    {b.display_name}
                  </span>
                  <span className="text-muted-foreground shrink-0">{b.sales_count} ventas</span>
                </li>
              ))}
              {ranking.length === 0 && (
                <li className="text-sm text-muted-foreground">La comunidad recién comienza.</li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Centro de recursos</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3 rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-sm">Guía oficial de la red de vendedores (PDF)</h3>
              <p className="text-xs text-muted-foreground">
                Comisión fija por proyecto. {brokerCommissionSummary()}.
              </p>
            </div>
            <Button size="sm" asChild>
              <a href={BROKER_GUIDE_URL} download="guia-red-vendedores.pdf">Descargar guía</a>
            </Button>
          </div>
          {RESOURCES.map((r) => (
            <div key={r.title} className="rounded-lg border border-border/60 p-4">
              <r.icon className="h-5 w-5 text-primary mb-2" aria-hidden="true" />
              <h3 className="font-medium text-sm mb-1">{r.title}</h3>
              <p className="text-xs text-muted-foreground">{r.text}</p>
            </div>
          ))}
          <div className="md:col-span-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild><Link to="/asesor/proyectos-en-venta">Proyectos y material</Link></Button>
            <Button size="sm" variant="outline" asChild><Link to="/asesor/leads">Mis clientes</Link></Button>
            <Button size="sm" variant="outline" asChild><Link to="/asesor/comisiones">Mis comisiones</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBrokerBusiness;
