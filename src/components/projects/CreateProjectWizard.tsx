import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText, MapPin, Grid3X3, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LATAM_COUNTRIES } from '@/lib/latam';
import LocationPicker from '@/components/publish/LocationPicker';
import { UseMutationResult } from '@tanstack/react-query';
import { ProjectInsert } from '@/hooks/useProjects';

interface WizardData {
  name: string;
  description: string;
  status: string;
  rol_number: string;
  latitude: number | null;
  longitude: number | null;
  region: string;
  city: string;
  address: string;
  total_lots: number;
  total_area: number | null;
  price_base: number | null;
}

const STEPS = [
  { id: 0, label: 'Datos Básicos', icon: FileText },
  { id: 1, label: 'Ubicación', icon: MapPin },
  { id: 2, label: 'Lotes', icon: Grid3X3 },
  { id: 3, label: 'Resumen', icon: CheckCircle2 },
];

const CHILE_REGIONS = LATAM_COUNTRIES.find(c => c.code === 'CL')?.regions || [];

interface CreateProjectWizardProps {
  createProject: UseMutationResult<any, Error, Omit<ProjectInsert, 'user_id'>, unknown>;
  onComplete: () => void;
  onCancel: () => void;
}

const CreateProjectWizard = ({ createProject, onComplete, onCancel }: CreateProjectWizardProps) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    name: '',
    description: '',
    status: 'active',
    rol_number: '',
    latitude: null,
    longitude: null,
    region: '',
    city: '',
    address: '',
    total_lots: 0,
    total_area: null,
    price_base: null,
  });

  const update = (partial: Partial<WizardData>) => setData(prev => ({ ...prev, ...partial }));

  const canAdvance = () => {
    if (step === 0) return !!data.name.trim();
    return true;
  };

  const handleCreate = async () => {
    await createProject.mutateAsync({
      name: data.name,
      description: data.description || null,
      status: data.status,
      rol_number: data.rol_number || null,
      latitude: data.latitude,
      longitude: data.longitude,
      region: data.region || null,
      city: data.city || null,
      address: data.address || null,
      location: data.address || data.city || data.region || null,
      total_lots: data.total_lots || 0,
      available_lots: data.total_lots || 0,
      reserved_lots: 0,
      sold_lots: 0,
      total_area: data.total_area,
    });
    onComplete();
  };

  const formatNumber = (n: number | null) => {
    if (!n) return '—';
    return new Intl.NumberFormat('es-CL').format(n);
  };

  const pricePerM2 = data.total_area && data.price_base && data.total_lots
    ? Math.round((data.price_base * data.total_lots) / data.total_area)
    : null;

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = step === i;
          const isDone = step > i;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors shrink-0',
                isActive && 'border-primary bg-primary text-primary-foreground',
                isDone && 'border-primary bg-primary/10 text-primary',
                !isActive && !isDone && 'border-muted-foreground/30 text-muted-foreground'
              )}>
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                'text-xs font-medium hidden sm:block',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 mx-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 0 && (
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nombre del Proyecto *</Label>
              <Input
                placeholder="ej: Valle del Sol"
                value={data.name}
                onChange={e => update({ name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción del proyecto..."
                value={data.description}
                onChange={e => update({ description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado Inicial</Label>
                <Select value={data.status} onValueChange={v => update({ status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">En Planificación</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ROL SII</Label>
                <Input
                  placeholder="ej: 1234-5678"
                  value={data.rol_number}
                  onChange={e => update({ rol_number: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <LocationPicker
              lat={data.latitude}
              lng={data.longitude}
              onLocationSelect={(lat, lng, addr) => {
                update({
                  latitude: lat,
                  longitude: lng,
                  address: addr?.address || data.address,
                  city: addr?.city || data.city,
                  region: addr?.region || data.region,
                });
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Región</Label>
                <Select value={data.region} onValueChange={v => update({ region: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar región" /></SelectTrigger>
                  <SelectContent>
                    {CHILE_REGIONS.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ciudad / Comuna</Label>
                <Input
                  placeholder="ej: La Serena"
                  value={data.city}
                  onChange={e => update({ city: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                placeholder="Se autocompleta al seleccionar en el mapa"
                value={data.address}
                onChange={e => update({ address: e.target.value })}
              />
            </div>
            {data.latitude && data.longitude && (
              <p className="text-xs text-muted-foreground">
                📍 {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total de Lotes</Label>
                <Input
                  type="number"
                  placeholder="50"
                  value={data.total_lots || ''}
                  onChange={e => update({ total_lots: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Superficie Total (m²)</Label>
                <Input
                  type="number"
                  placeholder="50000"
                  value={data.total_area || ''}
                  onChange={e => update({ total_area: parseFloat(e.target.value) || null })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio Base por Lote (CLP)</Label>
                <Input
                  type="number"
                  placeholder="25000000"
                  value={data.price_base || ''}
                  onChange={e => update({ price_base: parseFloat(e.target.value) || null })}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio por m² (calculado)</Label>
                <Input
                  readOnly
                  value={pricePerM2 ? `$${formatNumber(pricePerM2)}` : '—'}
                  className="bg-muted"
                />
              </div>
            </div>
            {data.total_lots > 0 && data.total_area && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 text-sm text-muted-foreground space-y-1">
                  <p>Superficie promedio por lote: <span className="font-medium text-foreground">{formatNumber(Math.round(data.total_area / data.total_lots))} m²</span></p>
                  {data.price_base && (
                    <p>Ingreso estimado total: <span className="font-medium text-foreground">${formatNumber(data.price_base * data.total_lots)} CLP</span></p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <SummaryItem label="Nombre" value={data.name} />
              <SummaryItem label="Estado" value={data.status === 'active' ? 'Activo' : 'En Planificación'} />
              <SummaryItem label="Región" value={data.region || '—'} />
              <SummaryItem label="Ciudad" value={data.city || '—'} />
              <SummaryItem label="Dirección" value={data.address || '—'} />
              <SummaryItem label="ROL SII" value={data.rol_number || '—'} />
              <SummaryItem label="Total Lotes" value={String(data.total_lots || '—')} />
              <SummaryItem label="Superficie" value={data.total_area ? `${formatNumber(data.total_area)} m²` : '—'} />
            </div>
            {data.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                <p className="text-sm">{data.description}</p>
              </div>
            )}
            <Badge variant="outline" className="text-xs">
              💡 Podrás importar un archivo KMZ con los lotes después de crear el proyecto
            </Badge>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t">
        <Button variant="outline" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          {step === 0 ? 'Cancelar' : <><ChevronLeft className="h-4 w-4 mr-1" />Atrás</>}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={createProject.isPending}>
            {createProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Proyecto
          </Button>
        )}
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export default CreateProjectWizard;
