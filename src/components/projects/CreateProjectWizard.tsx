import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText, MapPin, Grid3X3, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, ArrowRight,
  FileArchive, Upload, Layers, AlertCircle, SkipForward, ImageIcon, Banknote
} from 'lucide-react';
import ImageUploader from '@/components/publish/ImageUploader';
import { cn } from '@/lib/utils';
import { LATAM_COUNTRIES } from '@/lib/latam';
import LocationPicker from '@/components/publish/LocationPicker';
import { UseMutationResult } from '@tanstack/react-query';
import { Project, ProjectInsert, ProjectUpdate } from '@/hooks/useProjects';
import { parseKMZFile, parseKMLFile } from '@/lib/kmz';
import type { ParsedKMZ } from '@/lib/kmz/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CommercialConditionsForm, type CommercialConditions, DEFAULT_CONDITIONS } from './CommercialConditionsForm';

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
  reservation_deposit: number | null;
  images: string[];
  plan_images: string[];
  commercial_conditions: CommercialConditions;
}

const STEPS = [
  { id: 0, label: 'Datos Básicos', icon: FileText },
  { id: 1, label: 'Ubicación', icon: MapPin },
  { id: 2, label: 'Lotes', icon: Grid3X3 },
  { id: 3, label: 'Condiciones', icon: Banknote },
  { id: 4, label: 'Importar KMZ', icon: FileArchive },
  { id: 5, label: 'Imágenes', icon: ImageIcon },
  { id: 6, label: 'Planos', icon: Layers },
  { id: 7, label: 'Resumen', icon: CheckCircle2 },
];

const CHILE_REGIONS = LATAM_COUNTRIES.find(c => c.code === 'CL')?.regions || [];

const projectToWizardData = (project: Project): WizardData => ({
  name: project.name,
  description: project.description || '',
  status: project.status || 'active',
  rol_number: project.rol_number || '',
  latitude: project.latitude ? Number(project.latitude) : null,
  longitude: project.longitude ? Number(project.longitude) : null,
  region: project.region || '',
  city: project.city || '',
  address: project.address || '',
  total_lots: project.total_lots || 0,
  total_area: project.total_area ? Number(project.total_area) : null,
  price_base: null,
  reservation_deposit: project.reservation_deposit ? Number(project.reservation_deposit) : 500000,
  images: (project as any).images || [],
  plan_images: (project as any).plan_images || [],
  commercial_conditions: ((project as any).commercial_conditions as CommercialConditions) || { ...DEFAULT_CONDITIONS },
});

interface CreateProjectWizardProps {
  createProject: UseMutationResult<any, Error, Omit<ProjectInsert, 'user_id'>, unknown>;
  updateProject?: UseMutationResult<any, Error, ProjectUpdate & { id: string }, unknown>;
  editingProject?: Project | null;
  onComplete: () => void;
  onCancel: () => void;
}

const CreateProjectWizard = ({ createProject, updateProject, editingProject, onComplete, onCancel }: CreateProjectWizardProps) => {
  const { user } = useAuth();
  const isEditing = !!editingProject;
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(() =>
    editingProject ? projectToWizardData(editingProject) : {
      name: '', description: '', status: 'pending_review', rol_number: '',
      latitude: null, longitude: null, region: '', city: '', address: '',
      total_lots: 0, total_area: null, price_base: null, reservation_deposit: 500000, images: [], plan_images: [],
      commercial_conditions: { ...DEFAULT_CONDITIONS },
    }
  );

  // KMZ state
  const [parsedKMZ, setParsedKMZ] = useState<ParsedKMZ | null>(null);
  const [kmzError, setKmzError] = useState<string | null>(null);
  const [kmzFileName, setKmzFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const update = (partial: Partial<WizardData>) => setData(prev => ({ ...prev, ...partial }));

  const canAdvance = () => {
    if (step === 0) return !!data.name.trim();
    return true;
  };

  const handleKMZUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKmzError(null);
    setKmzFileName(file.name);

    try {
      let result: ParsedKMZ;
      if (file.name.endsWith('.kmz')) {
        result = await parseKMZFile(file);
      } else if (file.name.endsWith('.kml')) {
        result = await parseKMLFile(file);
      } else {
        throw new Error('Formato no soportado. Use archivos KMZ o KML.');
      }
      if (result.placemarks.length === 0) {
        throw new Error('No se encontraron polígonos en el archivo.');
      }
      setParsedKMZ(result);
      // Auto-update total lots from KMZ
      if (!data.total_lots || data.total_lots === 0) {
        update({ total_lots: result.placemarks.length });
      }
    } catch (err: any) {
      setKmzError(err.message || 'Error al procesar el archivo');
      setParsedKMZ(null);
    }
  }, [data.total_lots]);

  const handleSubmit = async () => {
    setIsImporting(true);
    try {
      const payload = {
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
        total_area: data.total_area,
        reservation_deposit: data.reservation_deposit || 500000,
        images: data.images.length > 0 ? data.images : null,
         plan_images: data.plan_images.length > 0 ? data.plan_images : null,
         commercial_conditions: data.commercial_conditions as any,
       };

      let projectId: string;

      if (isEditing && updateProject && editingProject) {
        const result = await updateProject.mutateAsync({ id: editingProject.id, ...payload });
        projectId = editingProject.id;
      } else {
        const result = await createProject.mutateAsync({
          ...payload,
          available_lots: data.total_lots || 0,
          reserved_lots: 0,
          sold_lots: 0,
        });
        projectId = result.id;
      }

      // Import KMZ lots if parsed
      if (parsedKMZ && user?.id && !isEditing) {
        const basePrice = data.price_base || 15000000;
        const pricePerSqm = data.total_area && data.price_base && data.total_lots
          ? Math.round((data.price_base * data.total_lots) / data.total_area)
          : 3000;

        for (const placemark of parsedKMZ.placemarks) {
          const area = placemark.area || 5000;
          const lotNumber = placemark.name.match(/\d+/)?.[0] || String(parsedKMZ.placemarks.indexOf(placemark) + 1);
          const centroid = placemark.coordinates.reduce(
            (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
            { lat: 0, lng: 0 }
          );
          const n = placemark.coordinates.length;

          await supabase.from('lots').insert({
            project_id: projectId,
            user_id: user.id,
            lot_number: lotNumber,
            name: placemark.name,
            description: placemark.description,
            area,
            price: Math.round(basePrice + (area * pricePerSqm / 1000)),
            price_per_sqm: pricePerSqm,
            status: 'available',
            latitude: centroid.lat / n,
            longitude: centroid.lng / n,
            polygon: { type: 'Polygon', coordinates: [placemark.coordinates] },
          });
        }

        // Update project center from KMZ
        await supabase.from('projects').update({
          latitude: parsedKMZ.center.lat,
          longitude: parsedKMZ.center.lng,
        }).eq('id', projectId);

        toast.success(`${parsedKMZ.placemarks.length} lotes importados`);
      }

      onComplete();
    } catch (err: any) {
      toast.error('Error: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsImporting(false);
    }
  };

  const isPending = isImporting || (isEditing ? updateProject?.isPending : createProject.isPending);

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
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors shrink-0',
                isActive && 'border-primary bg-primary text-primary-foreground',
                isDone && 'border-primary bg-primary/10 text-primary',
                !isActive && !isDone && 'border-muted-foreground/30 text-muted-foreground'
              )}>
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span className={cn(
                'text-[10px] font-medium hidden lg:block',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>{s.label}</span>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 mx-0.5 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 0 && <StepBasicData data={data} update={update} />}
        {step === 1 && <StepLocation data={data} update={update} />}
        {step === 2 && <StepLots data={data} update={update} formatNumber={formatNumber} pricePerM2={pricePerM2} />}
        {step === 3 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Condiciones Comerciales</h3>
            <CommercialConditionsForm
              value={data.commercial_conditions}
              onChange={(commercial_conditions) => update({ commercial_conditions })}
            />
          </div>
        )}
        {step === 4 && (
          <StepKMZ
            isEditing={isEditing}
            parsedKMZ={parsedKMZ}
            kmzError={kmzError}
            kmzFileName={kmzFileName}
            onUpload={handleKMZUpload}
            onClear={() => { setParsedKMZ(null); setKmzFileName(null); setKmzError(null); }}
          />
        )}
        {step === 5 && (
          <StepImages
            images={data.images}
            onImagesChange={(images) => update({ images })}
            userId={user?.id}
          />
        )}
        {step === 6 && (
          <StepPlanImages
            images={data.plan_images}
            onImagesChange={(plan_images) => update({ plan_images })}
            userId={user?.id}
          />
        )}
        {step === 7 && (
          <StepSummary data={data} formatNumber={formatNumber} parsedKMZ={parsedKMZ} isEditing={isEditing} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t">
        <Button variant="outline" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          {step === 0 ? 'Cancelar' : <><ChevronLeft className="h-4 w-4 mr-1" />Atrás</>}
        </Button>
        {step < 7 ? (
          <div className="flex gap-2">
            {step === 4 && !parsedKMZ && (
              <Button variant="ghost" onClick={() => setStep(5)} className="gap-1 text-muted-foreground">
                <SkipForward className="h-4 w-4" /> Saltar
              </Button>
            )}
            {step === 5 && data.images.length === 0 && (
              <Button variant="ghost" onClick={() => setStep(6)} className="gap-1 text-muted-foreground">
                <SkipForward className="h-4 w-4" /> Saltar
              </Button>
            )}
            {step === 6 && data.plan_images.length === 0 && (
              <Button variant="ghost" onClick={() => setStep(7)} className="gap-1 text-muted-foreground">
                <SkipForward className="h-4 w-4" /> Saltar
              </Button>
            )}
            <Button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()}>
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleSubmit} disabled={!!isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Guardar Cambios' : parsedKMZ ? 'Crear Proyecto e Importar Lotes' : 'Crear Proyecto'}
          </Button>
        )}
      </div>
    </div>
  );
};

// === Sub-components ===

const StepBasicData = ({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) => (
  <div className="grid gap-4">
    <div className="space-y-2">
      <Label>Nombre del Proyecto *</Label>
      <Input placeholder="ej: Valle del Sol" value={data.name} onChange={e => update({ name: e.target.value })} />
    </div>
    <div className="space-y-2">
      <Label>Descripción</Label>
      <Textarea placeholder="Descripción del proyecto..." value={data.description} onChange={e => update({ description: e.target.value })} rows={3} />
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
        <Input placeholder="ej: 1234-5678" value={data.rol_number} onChange={e => update({ rol_number: e.target.value })} />
      </div>
    </div>
  </div>
);

const StepLocation = ({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) => (
  <div className="grid gap-4">
    <LocationPicker
      lat={data.latitude}
      lng={data.longitude}
      onLocationSelect={(lat, lng, addr) => {
        update({
          latitude: lat, longitude: lng,
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
        <Input placeholder="ej: La Serena" value={data.city} onChange={e => update({ city: e.target.value })} />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Dirección</Label>
      <Input placeholder="Se autocompleta al seleccionar en el mapa" value={data.address} onChange={e => update({ address: e.target.value })} />
    </div>
    {data.latitude && data.longitude && (
      <p className="text-xs text-muted-foreground">📍 {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}</p>
    )}
  </div>
);

const StepLots = ({ data, update, formatNumber, pricePerM2 }: {
  data: WizardData; update: (p: Partial<WizardData>) => void;
  formatNumber: (n: number | null) => string; pricePerM2: number | null;
}) => (
  <div className="grid gap-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Total de Lotes</Label>
        <Input type="number" placeholder="50" value={data.total_lots || ''} onChange={e => update({ total_lots: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="space-y-2">
        <Label>Superficie Total (m²)</Label>
        <Input type="number" placeholder="50000" value={data.total_area || ''} onChange={e => update({ total_area: parseFloat(e.target.value) || null })} />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Precio Base por Lote (CLP)</Label>
        <Input type="number" placeholder="25000000" value={data.price_base || ''} onChange={e => update({ price_base: parseFloat(e.target.value) || null })} />
      </div>
      <div className="space-y-2">
        <Label>Precio por m² (calculado)</Label>
        <Input readOnly value={pricePerM2 ? `$${formatNumber(pricePerM2)}` : '—'} className="bg-muted" />
      </div>
    </div>
    <div className="space-y-2">
      <Label>Monto Depósito de Reserva (CLP)</Label>
      <Input 
        type="number" 
        placeholder="500000" 
        value={data.reservation_deposit || ''} 
        onChange={e => update({ reservation_deposit: parseFloat(e.target.value) || null })} 
      />
      <p className="text-xs text-muted-foreground">Monto que los compradores deben pagar para reservar un lote. Por defecto $500.000.</p>
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
);

const StepKMZ = ({ isEditing, parsedKMZ, kmzError, kmzFileName, onUpload, onClear }: {
  isEditing: boolean;
  parsedKMZ: ParsedKMZ | null;
  kmzError: string | null;
  kmzFileName: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) => {
  if (isEditing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileArchive className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Importar KMZ</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Para proyectos existentes, usa el botón "Importar KMZ" desde la tarjeta del proyecto para sincronizar lotes existentes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {kmzError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{kmzError}</AlertDescription>
        </Alert>
      )}

      {!parsedKMZ ? (
        <Card className="border-dashed border-2 hover:border-primary transition-colors">
          <CardContent className="p-8 text-center">
            <input type="file" accept=".kmz,.kml" onChange={onUpload} className="hidden" id="wizard-kmz-upload" />
            <label htmlFor="wizard-kmz-upload" className="cursor-pointer block">
              <FileArchive className="h-14 w-14 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">Cargar archivo KMZ/KML</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Importa los polígonos de tus lotes directamente. Este paso es opcional.
              </p>
              <Button type="button" variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Seleccionar archivo
              </Button>
            </label>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileArchive className="h-5 w-5 text-primary" />
              <span className="font-medium">{kmzFileName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onClear}>Cambiar archivo</Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Layers className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{parsedKMZ.placemarks.length}</p>
                <p className="text-sm text-muted-foreground">Lotes detectados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MapPin className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-medium">Centro</p>
                <p className="text-xs text-muted-foreground">
                  {parsedKMZ.center.lat.toFixed(4)}, {parsedKMZ.center.lng.toFixed(4)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Lotes detectados:</p>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {parsedKMZ.placemarks.slice(0, 15).map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {p.name} ({p.area?.toLocaleString() || '?'} m²)
                  </Badge>
                ))}
                {parsedKMZ.placemarks.length > 15 && (
                  <Badge variant="outline">+{parsedKMZ.placemarks.length - 15} más</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        💡 Puedes saltar este paso y importar lotes después desde la tarjeta del proyecto
      </p>
    </div>
  );
};

const StepImages = ({ images, onImagesChange, userId }: {
  images: string[];
  onImagesChange: (images: string[]) => void;
  userId?: string;
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold mb-1">Galería del Proyecto</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Sube fotos del proyecto, terreno, renders o planos. Este paso es opcional.
      </p>
    </div>
    <ImageUploader
      images={images}
      onImagesChange={onImagesChange}
      userId={userId}
      maxImages={15}
    />
  </div>
);

const StepPlanImages = ({ images, onImagesChange, userId }: {
  images: string[];
  onImagesChange: (images: string[]) => void;
  userId?: string;
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-semibold mb-1">Planos del Proyecto</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Sube las imágenes de los planos oficiales (Láminas A, B, etc.) para superponerlos en el mapa y validar los polígonos. Este paso es opcional.
      </p>
    </div>
    <ImageUploader
      images={images}
      onImagesChange={onImagesChange}
      userId={userId}
      maxImages={10}
    />
  </div>
);

const StepSummary = ({ data, formatNumber, parsedKMZ, isEditing }: {
  data: WizardData; formatNumber: (n: number | null) => string;
  parsedKMZ: ParsedKMZ | null; isEditing: boolean;
}) => (
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
    {data.images.length > 0 && (
      <div>
        <p className="text-xs text-muted-foreground mb-1">Imágenes</p>
        <div className="flex gap-2 overflow-x-auto">
          {data.images.slice(0, 5).map((img, i) => (
            <img key={i} src={img} alt={`Foto ${i + 1}`} className="h-16 w-16 rounded object-cover shrink-0" />
          ))}
          {data.images.length > 5 && (
            <span className="text-xs text-muted-foreground self-center">+{data.images.length - 5} más</span>
          )}
        </div>
      </div>
    )}
    {parsedKMZ && !isEditing ? (
      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        📦 Se importarán {parsedKMZ.placemarks.length} lotes desde KMZ
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        💡 Podrás importar un archivo KMZ con los lotes después de crear el proyecto
      </Badge>
    )}
  </div>
);

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export default CreateProjectWizard;
