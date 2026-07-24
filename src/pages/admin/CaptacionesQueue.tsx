import { useMemo, useState } from 'react';
import { MapPin, Phone, Mail, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAdminLandReferrals, useUpdateLandReferral, type LandReferral } from '@/hooks/useLandReferrals';
import {
  CAPTACION_STATUS_META,
  CAPTACION_TRANSITIONS,
  type CaptacionStatus,
} from '@/lib/captaciones/status';

const TABS: Array<{ value: string; label: string }> = [
  { value: 'activas', label: 'Activas' },
  { value: 'nueva', label: 'Nuevas' },
  { value: 'en_negociacion', label: 'En negociación' },
  { value: 'publicada', label: 'Publicadas' },
  { value: 'rechazada', label: 'Rechazadas' },
];

const CaptacionesQueue = () => {
  const { data: captaciones = [], isLoading } = useAdminLandReferrals();
  const [tab, setTab] = useState('activas');

  const filtered = useMemo(() => {
    if (tab === 'activas') {
      return captaciones.filter((c) => !['publicada', 'rechazada'].includes(c.status));
    }
    return captaciones.filter((c) => c.status === tab);
  }, [captaciones, tab]);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Captaciones — Gerencia</h1>
        <p className="text-muted-foreground mt-1">
          Terrenos ofrecidos por corredores asociados. Revisa, negocia con el dueño y publica.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="rounded-lg">
              {t.label}
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                {t.value === 'activas'
                  ? captaciones.filter((c) => !['publicada', 'rechazada'].includes(c.status)).length
                  : captaciones.filter((c) => c.status === t.value).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60 p-10 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay captaciones en esta vista.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => <CaptacionCard key={c.id} captacion={c} />)}
        </div>
      )}
    </div>
  );
};

const CaptacionCard = ({ captacion: c }: { captacion: LandReferral }) => {
  const update = useUpdateLandReferral();
  const [notes, setNotes] = useState(c.admin_notes ?? '');
  const meta = CAPTACION_STATUS_META[c.status] ?? CAPTACION_STATUS_META.nueva;
  const nextStates = CAPTACION_TRANSITIONS[c.status] ?? [];

  const applyStatus = (status: CaptacionStatus) =>
    update.mutate(
      { id: c.id, status, admin_notes: notes || undefined },
      {
        onSuccess: () => toast({ title: `Captación → ${CAPTACION_STATUS_META[status].label}`, description: 'El corredor fue notificado.' }),
        onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
      },
    );

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{c.title}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {[c.address, c.comuna, c.region].filter(Boolean).join(', ') || 'Sin ubicación'}
              {c.size_m2 ? ` · ${Number(c.size_m2).toLocaleString('es-CL')} m²` : ''}
              {c.expected_price ? ` · pide $${Number(c.expected_price).toLocaleString('es-CL')}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: es })}
            </span>
          </div>
        </div>

        {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}

        <div className="flex flex-wrap items-center gap-4 text-sm border-t border-border/40 pt-3">
          <span className="font-medium text-foreground">Dueño: {c.owner_name}</span>
          {c.owner_phone && (
            <a href={`tel:${c.owner_phone}`} className="flex items-center gap-1 text-primary hover:underline">
              <Phone className="h-3.5 w-3.5" />{c.owner_phone}
            </a>
          )}
          {c.owner_email && (
            <a href={`mailto:${c.owner_email}`} className="flex items-center gap-1 text-primary hover:underline">
              <Mail className="h-3.5 w-3.5" />{c.owner_email}
            </a>
          )}
          {c.links && (
            <a href={c.links} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" />Fotos / documentos
            </a>
          )}
        </div>

        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end border-t border-border/40 pt-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notas de gerencia (visibles para el corredor)</p>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Estado de la negociación, condiciones, próximos pasos…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={update.isPending || notes === (c.admin_notes ?? '')}
              onClick={() =>
                update.mutate(
                  { id: c.id, admin_notes: notes },
                  { onSuccess: () => toast({ title: 'Notas guardadas' }) },
                )
              }
            >
              Guardar notas
            </Button>
            {nextStates.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === 'rechazada' ? 'destructive' : 'default'}
                disabled={update.isPending}
                onClick={() => applyStatus(s)}
              >
                {CAPTACION_STATUS_META[s].label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CaptacionesQueue;
