import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, MapPin, MessageCircle, Plus, Sparkles, Target, UserRound } from 'lucide-react';
import {
  type BuyerRequirementInput,
  useBuyerMatches,
  useBuyerRequirements,
  useCreateBuyerRequirement,
} from '@/hooks/useBuyerRequirements';

const emptyForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  region: '',
  commune: '',
  budget_max: '',
  area_min: '',
  purpose: '',
  urgency: 'normal',
  notes: '',
};

const money = (value: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);

const criterionLabels: Record<string, string> = {
  region: 'región',
  commune: 'comuna',
  budget_max: 'presupuesto',
  budget_min: 'piso de inversión',
  area_min: 'superficie mínima',
  area_max: 'superficie máxima',
};

const BuyerRequirements = () => {
  const { data: requirements = [], isLoading } = useBuyerRequirements();
  const createRequirement = useCreateBuyerRequirement();
  const [selectedId, setSelectedId] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const { data: matches = [], isLoading: matchesLoading } = useBuyerMatches(selectedId);

  useEffect(() => {
    if (!selectedId && requirements[0]) setSelectedId(requirements[0].id);
  }, [requirements, selectedId]);

  const selected = useMemo(
    () => requirements.find((requirement) => requirement.id === selectedId),
    [requirements, selectedId],
  );

  const submit = async () => {
    if (!form.customer_name.trim()) return;

    const numberOrNull = (value: string) => value ? Number(value) : null;
    const input: BuyerRequirementInput = {
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim() || null,
      customer_phone: form.customer_phone.trim() || null,
      region: form.region.trim() || null,
      commune: form.commune.trim() || null,
      budget_max: numberOrNull(form.budget_max),
      area_min: numberOrNull(form.area_min),
      purpose: form.purpose || null,
      urgency: form.urgency,
      notes: form.notes.trim() || null,
    };

    const created = await createRequirement.mutateAsync(input);
    setSelectedId(created.id);
    setDialogOpen(false);
    setForm(emptyForm);
  };

  const shareMatch = (match: (typeof matches)[number]) => {
    if (!selected?.customer_phone) return;
    const phone = selected.customer_phone.replace(/\D/g, '');
    const lot = match.lot_name || `Lote ${match.lot_number || ''}`;
    const message = [
      `Hola ${selected.customer_name}, encontré una parcela con ${match.score}% de ajuste a tu búsqueda:`,
      `${lot} · ${match.project_name}`,
      `${match.area.toLocaleString('es-CL')} m² · ${money(match.price)}`,
      `${match.commune || ''}${match.region ? `, ${match.region}` : ''}`,
      '¿Te gustaría coordinar una visita?',
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="outline" className="mb-2">Buyer Demand</Badge>
          <h1 className="text-2xl font-bold">Tengo comprador</h1>
          <p className="text-sm text-muted-foreground">Registra la necesidad y encuentra parcelas disponibles con criterios explicables.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nueva búsqueda</Button></DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Necesidad del comprador</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Cliente *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input placeholder="569…" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Email</Label><Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
              <div><Label>Región</Label><Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
              <div><Label>Comuna</Label><Input value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} /></div>
              <div><Label>Presupuesto máximo</Label><Input type="number" min="0" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></div>
              <div><Label>Superficie mínima (m²)</Label><Input type="number" min="0" value={form.area_min} onChange={(e) => setForm({ ...form, area_min: e.target.value })} /></div>
              <div>
                <Label>Objetivo</Label>
                <Select value={form.purpose} onValueChange={(purpose) => setForm({ ...form, purpose })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivienda">Vivienda</SelectItem>
                    <SelectItem value="inversion">Inversión</SelectItem>
                    <SelectItem value="agricola">Uso agrícola</SelectItem>
                    <SelectItem value="turismo">Turismo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Urgencia</Label>
                <Select value={form.urgency} onValueChange={(urgency) => setForm({ ...form, urgency })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Inmediata</SelectItem>
                    <SelectItem value="30_days">30 días</SelectItem>
                    <SelectItem value="90_days">90 días</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="exploring">Explorando</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Notas</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={submit} disabled={!form.customer_name.trim() || createRequirement.isPending}>{createRequirement.isPending ? 'Guardando…' : 'Guardar y buscar'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4" />Compradores</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {!isLoading && requirements.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Registra el primer comprador para iniciar el matching.</p>}
            {requirements.map((requirement) => (
              <button
                key={requirement.id}
                type="button"
                onClick={() => setSelectedId(requirement.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedId === requirement.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'}`}
              >
                <div className="flex items-center justify-between gap-2"><span className="font-medium">{requirement.customer_name}</span><Badge variant="secondary">{requirement.status}</Badge></div>
                <p className="mt-1 text-xs text-muted-foreground">{[requirement.commune, requirement.region].filter(Boolean).join(', ') || 'Todas las zonas'}</p>
                <p className="text-xs text-muted-foreground">{requirement.budget_max ? `Hasta ${money(requirement.budget_max)}` : 'Presupuesto abierto'}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Matches {selected ? `para ${selected.customer_name}` : ''}</CardTitle>
            <p className="text-sm text-muted-foreground">Puntaje determinístico: ubicación, presupuesto y superficie. Cada coincidencia muestra por qué calza.</p>
          </CardHeader>
          <CardContent>
            {!selected && <p className="py-12 text-center text-sm text-muted-foreground">Selecciona o registra un comprador.</p>}
            {selected && matchesLoading && <p className="py-12 text-center text-sm text-muted-foreground">Buscando parcelas disponibles…</p>}
            {selected && !matchesLoading && matches.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No hay parcelas disponibles con precio y superficie informados.</p>}
            <div className="space-y-3">
              {matches.map((match) => {
                const positiveCriteria = Object.entries(match.criteria || {}).filter(([, ok]) => ok).map(([key]) => criterionLabels[key] || key);
                return (
                  <div key={match.lot_id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <p className="font-semibold">{match.lot_name || `Lote ${match.lot_number || ''}`}</p>
                          <Badge className={match.score >= 80 ? 'bg-emerald-600' : match.score >= 60 ? 'bg-amber-600' : ''}><Target className="mr-1 h-3 w-3" />{match.score}% match</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{match.project_name}</p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                          <span>{match.area.toLocaleString('es-CL')} m²</span>
                          <span className="font-semibold">{money(match.price)}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{[match.commune, match.region].filter(Boolean).join(', ') || 'Sin ubicación'}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Coincide en: {positiveCriteria.join(', ') || 'criterios parciales'}.</p>
                      </div>
                      <Button size="sm" variant="outline" disabled={!selected.customer_phone} onClick={() => shareMatch(match)}>
                        <MessageCircle className="mr-2 h-4 w-4" />WhatsApp
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuyerRequirements;
