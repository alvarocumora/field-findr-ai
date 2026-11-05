import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Lot, LotInsert, LotFeatures } from '@/hooks/useLots';
import { Project } from '@/hooks/useProjects';
import { LotImageUploader } from './LotImageUploader';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Loader2 } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

const lotSchema = z.object({
  lot_number: z.string().min(1, 'El número de lote es requerido').max(50),
  name: z.string().max(100).optional(),
  project_id: z.string().uuid('Selecciona un proyecto válido'),
  area: z.number().min(1, 'El área debe ser mayor a 0').max(1000000),
  price: z.number().min(0).optional(),
  status: z.enum(['available', 'reserved', 'sold']),
  description: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  hasWater: z.boolean(),
  hasElectricity: z.boolean(),
  hasRoad: z.boolean(),
  additionalFeatures: z.string().optional(),
  buyer_name: z.string().max(100).optional(),
  buyer_email: z.string().email('Email inválido').optional().or(z.literal('')),
  buyer_phone: z.string().max(20).optional(),
});

type LotFormData = z.infer<typeof lotSchema>;

interface LotFormProps {
  projects: Project[];
  initialData?: Lot;
  onSubmit: (data: Omit<LotInsert, 'user_id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const LotForm = ({ projects, initialData, onSubmit, onCancel, isLoading }: LotFormProps) => {
  const features = initialData?.features as LotFeatures | null;
  const [lotImages, setLotImages] = useState<string[]>(
    ((initialData)?.images as string[]) || []
  );
  const [generatingDesc, setGeneratingDesc] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LotFormData>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      lot_number: initialData?.lot_number || '',
      name: initialData?.name || '',
      project_id: initialData?.project_id || '',
      area: initialData?.area ? Number(initialData.area) : 0,
      price: initialData?.price ? Number(initialData.price) : undefined,
      status: (initialData?.status as 'available' | 'reserved' | 'sold') || 'available',
      description: initialData?.description || '',
      latitude: initialData?.latitude ? Number(initialData.latitude) : undefined,
      longitude: initialData?.longitude ? Number(initialData.longitude) : undefined,
      hasWater: features?.hasWater || false,
      hasElectricity: features?.hasElectricity || false,
      hasRoad: features?.hasRoad || false,
      additionalFeatures: features?.additionalFeatures?.join(', ') || '',
      buyer_name: initialData?.buyer_name || '',
      buyer_email: initialData?.buyer_email || '',
      buyer_phone: initialData?.buyer_phone || '',
    },
  });

  const status = watch('status');
  const hasWater = watch('hasWater');
  const hasElectricity = watch('hasElectricity');
  const hasRoad = watch('hasRoad');

  const handleFormSubmit = (data: LotFormData) => {
    const lotData: Omit<LotInsert, 'user_id'> = {
      lot_number: data.lot_number.trim(),
      name: data.name?.trim() || null,
      project_id: data.project_id,
      area: data.area,
      price: data.price || null,
      price_per_sqm: data.price && data.area ? data.price / data.area : null,
      status: data.status,
      description: data.description?.trim() || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      features: {
        // Conserva claves que este formulario no edita (p. ej. rolSii y
        // rolCertificate del certificado SII) para que guardar no las borre.
        ...(initialData?.features && typeof initialData.features === 'object' && !Array.isArray(initialData.features)
          ? (initialData.features as Record<string, Json>)
          : {}),
        hasWater: data.hasWater,
        hasElectricity: data.hasElectricity,
        hasRoad: data.hasRoad,
        additionalFeatures: data.additionalFeatures
          ? data.additionalFeatures.split(',').map(f => f.trim()).filter(Boolean)
          : [],
      },
      buyer_name: data.buyer_name?.trim() || null,
      buyer_email: data.buyer_email?.trim() || null,
      buyer_phone: data.buyer_phone?.trim() || null,
      images: lotImages,
    };
    onSubmit(lotData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Selection */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="project_id">Proyecto *</Label>
          <Select
            value={watch('project_id')}
            onValueChange={(value) => setValue('project_id', value)}
            disabled={!!initialData}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.project_id && (
            <p className="text-sm text-destructive">{errors.project_id.message}</p>
          )}
        </div>

        {/* Lot Number */}
        <div className="space-y-2">
          <Label htmlFor="lot_number">Número de Lote *</Label>
          <Input
            id="lot_number"
            placeholder="ej: A-001"
            {...register('lot_number')}
          />
          {errors.lot_number && (
            <p className="text-sm text-destructive">{errors.lot_number.message}</p>
          )}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre (opcional)</Label>
          <Input
            id="name"
            placeholder="ej: Lote Vista al Mar"
            {...register('name')}
          />
        </div>

        {/* Area */}
        <div className="space-y-2">
          <Label htmlFor="area">Superficie (m²) *</Label>
          <Input
            id="area"
            type="number"
            step="0.01"
            placeholder="500"
            {...register('area', { valueAsNumber: true })}
          />
          {errors.area && (
            <p className="text-sm text-destructive">{errors.area.message}</p>
          )}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Precio (CLP)</Label>
          <Input
            id="price"
            type="number"
            placeholder="25000000"
            {...register('price', { valueAsNumber: true })}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Estado *</Label>
          <Select
            value={status}
            onValueChange={(value: 'available' | 'reserved' | 'sold') => setValue('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="reserved">Reservado</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Descripción</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={generatingDesc}
              onClick={async () => {
                setGeneratingDesc(true);
                try {
                  const area = watch('area');
                  const name = watch('name');
                  const hasW = watch('hasWater');
                  const hasE = watch('hasElectricity');
                  const hasR = watch('hasRoad');
                  const extra = watch('additionalFeatures');
                  
                  const { data, error } = await supabase.functions.invoke('ai-assistant', {
                    body: {
                      messages: [{
                        role: 'user',
                        content: `Genera una descripción de venta atractiva y profesional (máximo 3 líneas) para un lote con estas características:
- Superficie: ${area} m²
${name ? `- Nombre: ${name}` : ''}
- Servicios: ${[hasW && 'agua', hasE && 'electricidad', hasR && 'acceso pavimentado'].filter(Boolean).join(', ') || 'sin servicios'}
${extra ? `- Extras: ${extra}` : ''}
Responde SOLO con la descripción, sin comillas ni explicaciones.`
                      }]
                    }
                  });
                  if (data) {
                    const text = typeof data === 'string' ? data : data?.text || data?.choices?.[0]?.message?.content || '';
                    if (text) setValue('description', text.trim());
                  }
                } catch {
                  toast.error('No se pudo generar la descripción');
                } finally {
                  setGeneratingDesc(false);
                }
              }}
            >
              {generatingDesc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {generatingDesc ? 'Generando...' : 'Generar con IA'}
            </Button>
          </div>
          <Textarea
            id="description"
            placeholder="Descripción del lote..."
            {...register('description')}
          />
        </div>

        {/* Coordinates */}
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitud</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="-33.4489"
            {...register('latitude', { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitud</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="-70.6693"
            {...register('longitude', { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <Label>Servicios</Label>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasWater"
              checked={hasWater}
              onCheckedChange={(checked) => setValue('hasWater', !!checked)}
            />
            <Label htmlFor="hasWater" className="font-normal">Agua potable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasElectricity"
              checked={hasElectricity}
              onCheckedChange={(checked) => setValue('hasElectricity', !!checked)}
            />
            <Label htmlFor="hasElectricity" className="font-normal">Electricidad</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasRoad"
              checked={hasRoad}
              onCheckedChange={(checked) => setValue('hasRoad', !!checked)}
            />
            <Label htmlFor="hasRoad" className="font-normal">Acceso pavimentado</Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalFeatures">Características adicionales</Label>
          <Input
            id="additionalFeatures"
            placeholder="Vista al mar, esquina, plano (separar con comas)"
            {...register('additionalFeatures')}
          />
        </div>
      </div>

      {/* Buyer Info (shown when reserved/sold) */}

      {/* Lot Images */}
      <LotImageUploader images={lotImages} onChange={setLotImages} />

      {/* Buyer Info (shown when reserved/sold) */}
      {(status === 'reserved' || status === 'sold') && (
        <div className="space-y-4 border-t pt-4">
          <Label className="text-base font-semibold">Información del Comprador</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyer_name">Nombre</Label>
              <Input
                id="buyer_name"
                placeholder="Juan Pérez"
                {...register('buyer_name')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer_email">Email</Label>
              <Input
                id="buyer_email"
                type="email"
                placeholder="juan@email.com"
                {...register('buyer_email')}
              />
              {errors.buyer_email && (
                <p className="text-sm text-destructive">{errors.buyer_email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer_phone">Teléfono</Label>
              <Input
                id="buyer_phone"
                placeholder="+56 9 1234 5678"
                {...register('buyer_phone')}
              />
            </div>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Lote'}
        </Button>
      </DialogFooter>
    </form>
  );
};
