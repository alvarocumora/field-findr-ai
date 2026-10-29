import { WorkspaceLoadError } from '@/components/dashboard/WorkspaceLoadError';
import { Link } from 'react-router-dom';
import { CAPTACION_NEXT_STEP } from '@/lib/captaciones/experience';
import { useState } from 'react';
import { MapPin, Plus, Handshake, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMyLandReferrals, useCreateLandReferral, type LandReferralInput } from '@/hooks/useLandReferrals';
import { CAPTACION_STATUS_META } from '@/lib/captaciones/status';

const MyCaptaciones = () => {
  const { data: captaciones = [], isLoading, error, refetch } = useMyLandReferrals();
  const createReferral = useCreateLandReferral();
  const [open, setOpen] = useState(false);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Captaciones</h1>
          <p className="text-muted-foreground mt-1">
            Ofrece terrenos de terceros: la gerencia de Oferta Terrenos negocia con el dueño y,
            si se publica y vende, tú cobras tu comisión de captación.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ofrecer terreno
        </Button>
      </div>

      {/* Cómo funciona */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: MapPin, title: '1. Ofrece el terreno', text: 'Datos del terreno y del dueño. No se publica todavía.' },
          { icon: Handshake, title: '2. Gerencia negocia', text: 'OT revisa, contacta al dueño y cierra el acuerdo.' },
          { icon: Building2, title: '3. Publicación y venta', text: 'La comisión depende de la venta y de las condiciones acordadas.' },
        ].map((s) => (
          <Card key={s.title} className="border-border/60 bg-card/50">
            <CardContent className="p-4 flex items-start gap-3">
              <s.icon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista */}
      {error ? (
        <WorkspaceLoadError title="No pudimos cargar tus captaciones" onRetry={refetch} />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : captaciones.length === 0 ? (
        <Card className="border-border/60 p-10 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg">Aún no tienes captaciones</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Conoces un terreno con potencial? Ofrécelo y deja que OT haga la negociación.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {captaciones.map((c) => {
            const meta = CAPTACION_STATUS_META[c.status] ?? CAPTACION_STATUS_META.nueva;
            return (
              <Card key={c.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {[c.comuna, c.region].filter(Boolean).join(', ') || 'Sin ubicación'}
                        {c.size_m2 ? ` · ${Number(c.size_m2).toLocaleString('es-CL')} m²` : ''}
                        {c.expected_price ? ` · $${Number(c.expected_price).toLocaleString('es-CL')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mt-3"><span className="font-medium">Siguiente paso: </span>{CAPTACION_NEXT_STEP[c.status] ?? 'Consulta el estado con gerencia.'}</p>
                  {c.status === 'publicada' && c.listing_id && (
                    <Button asChild variant="link" className="px-0"><Link to={`/explorar?listing=${encodeURIComponent(c.listing_id)}`}>Ver publicación</Link></Button>
                  )}
                  {c.admin_notes && c.status !== 'nueva' && (
                    <p className="text-xs text-muted-foreground mt-2 border-t border-border/40 pt-2">
                      <span className="font-medium text-foreground">Gerencia:</span> {c.admin_notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <OfferLandDialog
        open={open}
        onOpenChange={setOpen}
        pending={createReferral.isPending}
        onSubmit={(input) =>
          createReferral.mutate(input, {
            onSuccess: () => {
              toast({ title: 'Captación enviada', description: 'Gerencia la revisará y podrás revisar el estado en Mis captaciones.' });
              setOpen(false);
            },
            onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
          })
        }
      />
    </div>
  );
};

const OfferLandDialog = ({
  open, onOpenChange, onSubmit, pending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (input: LandReferralInput) => void;
  pending: boolean;
}) => {
  const [form, setForm] = useState<LandReferralInput>({ title: '', owner_name: '' });
  const set = (k: keyof LandReferralInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const reset = () => setForm({ title: '', owner_name: '' });
  const canSubmit = form.title.trim().length > 2 && form.owner_name.trim().length > 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Ofrecer un terreno
          </DialogTitle>
          <DialogDescription>
            Comparte los datos del dueño solo con su autorización. Se usarán para gestionar esta captación.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="cap-title">Nombre del terreno *</Label>
            <Input id="cap-title" value={form.title} onChange={set('title')} placeholder="Parcela 5.000 m² orilla de lago" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cap-region">Región</Label>
              <Input id="cap-region" value={form.region ?? ''} onChange={set('region')} placeholder="Los Ríos" />
            </div>
            <div>
              <Label htmlFor="cap-comuna">Comuna</Label>
              <Input id="cap-comuna" value={form.comuna ?? ''} onChange={set('comuna')} placeholder="Lago Ranco" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cap-size">Superficie (m²)</Label>
              <Input id="cap-size" type="number" value={form.size_m2 ?? ''} onChange={(e) => setForm((f) => ({ ...f, size_m2: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <Label htmlFor="cap-price">Precio esperado (CLP)</Label>
              <Input id="cap-price" type="number" value={form.expected_price ?? ''} onChange={(e) => setForm((f) => ({ ...f, expected_price: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
          </div>
          <div>
            <Label htmlFor="cap-address">Dirección / referencia</Label>
            <Input id="cap-address" value={form.address ?? ''} onChange={set('address')} />
          </div>
          <div className="border-t border-border/40 pt-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Datos del dueño (confidencial)</p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="cap-owner">Nombre del dueño *</Label>
                <Input id="cap-owner" value={form.owner_name} onChange={set('owner_name')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cap-phone">Teléfono</Label>
                  <Input id="cap-phone" value={form.owner_phone ?? ''} onChange={set('owner_phone')} placeholder="+56 9 …" />
                </div>
                <div>
                  <Label htmlFor="cap-email">Email</Label>
                  <Input id="cap-email" type="email" value={form.owner_email ?? ''} onChange={set('owner_email')} />
                </div>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="cap-desc">Descripción / antecedentes</Label>
            <Textarea id="cap-desc" value={form.description ?? ''} onChange={set('description')} rows={3} placeholder="Acceso, rol, factibilidad de agua/luz, disposición del dueño a vender…" />
          </div>
          <div>
            <Label htmlFor="cap-links">Links de fotos o documentos</Label>
            <Input id="cap-links" value={form.links ?? ''} onChange={set('links')} placeholder="Drive, Dropbox, etc." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!canSubmit || pending} onClick={() => onSubmit(form)}>
            {pending ? 'Enviando…' : 'Enviar a gerencia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MyCaptaciones;
