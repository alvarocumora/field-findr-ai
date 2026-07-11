import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Store, ExternalLink } from 'lucide-react';
import { useAgencyProfile, type AgencyProfileForm } from '@/hooks/useAgencyShowcase';
import { slugifyAgency, isValidSlug } from '@/lib/agency/slug';

const EMPTY: AgencyProfileForm = { company_name: '', public_slug: '', logo_url: '', bio: '', is_public: false };

/** Owner card to configure the public agency showcase (/inmobiliaria/:slug). */
export const AgencyShowcaseSettings = () => {
  const { profile, isLoading, save } = useAgencyProfile();
  const [form, setForm] = useState<AgencyProfileForm>(EMPTY);

  useEffect(() => {
    if (profile) setForm({ ...EMPTY, ...profile });
  }, [profile]);

  const slug = form.public_slug ?? '';
  const slugError = slug.length > 0 && !isValidSlug(slug);
  const publicUrl = slug ? `${window.location.origin}/inmobiliaria/${slug}` : null;
  const canSave = !slugError && (!form.is_public || (!!form.company_name && !!slug));

  const set = <K extends keyof AgencyProfileForm>(k: K, v: AgencyProfileForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" /> Vitrina pública
        </CardTitle>
        <CardDescription>Una página pública con tu marca y todos tus proyectos activos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nombre de la inmobiliaria</Label>
            <Input
              value={form.company_name ?? ''}
              placeholder="Inmobiliaria Sur"
              onChange={(e) => {
                const name = e.target.value;
                set('company_name', name);
                if (!profile?.public_slug && !form.public_slug) set('public_slug', slugifyAgency(name));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Enlace (slug)</Label>
            <Input
              value={slug}
              placeholder="inmobiliaria-sur"
              onChange={(e) => set('public_slug', slugifyAgency(e.target.value))}
            />
            {slugError && <p className="text-[11px] text-destructive">Usa 2–40 caracteres: letras, números y guiones.</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Logo (URL)</Label>
          <Input value={form.logo_url ?? ''} placeholder="https://…/logo.png" onChange={(e) => set('logo_url', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Descripción</Label>
          <Textarea rows={3} value={form.bio ?? ''} placeholder="Loteos y parcelas en el Maule…" onChange={(e) => set('bio', e.target.value)} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
          <div>
            <p className="text-sm font-medium">Vitrina pública</p>
            <p className="text-xs text-muted-foreground">Actívala para que cualquiera pueda ver tu página.</p>
          </div>
          <Switch checked={form.is_public} onCheckedChange={(v) => set('is_public', v)} />
        </div>

        {publicUrl && (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
            {publicUrl} <ExternalLink className="h-3 w-3" />
          </a>
        )}

        <Button disabled={isLoading || save.isPending || !canSave} onClick={() => save.mutate(form)}>
          {save.isPending ? 'Guardando…' : 'Guardar vitrina'}
        </Button>
      </CardContent>
    </Card>
  );
};
