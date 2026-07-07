import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, MapPin, DollarSign, Image as ImageIcon, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import LocationPicker from '@/components/publish/LocationPicker';
import ImageUploader from '@/components/publish/ImageUploader';
import { cn } from '@/lib/utils';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';

const PROPERTY_TYPES = [
  { value: 'parcela_rural', label: 'Parcela Rural' },
  { value: 'terreno_urbano', label: 'Terreno Urbano' },
  { value: 'campo_agricola', label: 'Campo Agrícola' },
  { value: 'sitio_industrial', label: 'Sitio Industrial' },
  { value: 'terreno_costero', label: 'Terreno Costero' },
  { value: 'terreno_montana', label: 'Terreno de Montaña' },
  { value: 'loteo', label: 'Loteo' },
];

const TAG_OPTIONS = [
  'agua', 'luz', 'camino', 'riego', 'bosque', 'vista', 'playa', 'lago', 'río', 'pozo', 'cerco', 'portón',
];

const listingSchema = z.object({
  title: z.string().trim().min(1, 'El título es requerido').max(200),
  description: z.string().max(2000).optional(),
  type: z.string().min(1, 'El tipo es requerido'),
  location: z.string().trim().min(1, 'La ubicación es requerida').max(200),
  region: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  address: z.string().max(300).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  price: z.number().min(1, 'El precio es requerido'),
  currency: z.enum(['CLP', 'UF', 'USD']),
  area_m2: z.number().min(1, 'El área es requerida').optional().nullable(),
  area_ha: z.number().min(0).optional().nullable(),
  status: z.enum(['active', 'reserved', 'sold', 'inactive']),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface ListingFormDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, label: 'Datos', icon: Building2 },
  { id: 2, label: 'Ubicación', icon: MapPin },
  { id: 3, label: 'Precio', icon: DollarSign },
  { id: 4, label: 'Imágenes', icon: ImageIcon },
];

export function ListingFormDialog({ trigger, onSuccess }: ListingFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { canCreateListing, listings, planDetails } = usePlanLimits();

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '', description: '', type: 'parcela_rural', location: '',
      region: '', city: '', country: 'CL', address: '',
      lat: null, lng: null, price: 0, currency: 'CLP',
      area_m2: null, area_ha: null, status: 'active',
      tags: [], images: [],
    },
  });

  const handleLocationSelect = useCallback((lat: number, lng: number, addr?: { address: string; city?: string; region?: string; country?: string }) => {
    form.setValue('lat', lat);
    form.setValue('lng', lng);
    if (addr) {
      if (addr.address && !form.getValues('location')) form.setValue('location', addr.address);
      if (addr.city) form.setValue('city', addr.city);
      if (addr.region) form.setValue('region', addr.region);
      if (addr.country) form.setValue('country', addr.country);
    }
  }, [form]);

  const handleAreaM2Change = (value: number | null) => {
    form.setValue('area_m2', value);
    if (value && value > 0) form.setValue('area_ha', Number((value / 10000).toFixed(2)));
  };

  const canAdvance = () => {
    const values = form.getValues();
    if (step === 1) return !!values.title && !!values.type;
    if (step === 2) return !!values.location;
    if (step === 3) return values.price > 0;
    return true;
  };

  const onSubmit = async (data: ListingFormData) => {
    if (!user) { toast.error('Debes iniciar sesión'); return; }
    if (!canCreateListing) {
      toast.error(
        `Alcanzaste el límite de ${listings.limit} publicaciones del plan ${planDetails.name}. Mejora tu plan para publicar más.`,
        { action: { label: 'Ver planes', onClick: () => navigate('/pricing') } }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('listings').insert({
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        type: data.type,
        location: data.location,
        region: data.region || null,
        city: data.city || null,
        country: data.country || null,
        address: data.address || null,
        lat: data.lat, lng: data.lng,
        price: data.price,
        currency: data.currency,
        area_m2: data.area_m2, area_ha: data.area_ha,
        status: data.status,
        tags: data.tags || [],
        images: data.images || [],
      });

      if (error) throw error;

      toast.success('Propiedad creada exitosamente');
      form.reset();
      setStep(1);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['agent-stats'] });
      queryClient.invalidateQueries({ queryKey: ['agency-properties'] });
      onSuccess?.();
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Error al crear la propiedad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tags = form.watch('tags') || [];
  const images = form.watch('images') || [];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(1); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl gap-2">
            <Building2 className="h-4 w-4" />
            Nueva Propiedad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Propiedad</DialogTitle>
          <DialogDescription>Paso {step} de 4 — {STEPS[step - 1].label}</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors w-full',
                  step === s.id ? 'bg-primary text-primary-foreground' :
                  step > s.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s.id ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Step 1: Basic Data */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl><Input placeholder="Parcela con vista al mar en Valparaíso" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl><Textarea placeholder="Describe las características..." className="resize-none" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de propiedad *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="active">Activa</SelectItem>
                          <SelectItem value="reserved">Reservada</SelectItem>
                          <SelectItem value="sold">Vendida</SelectItem>
                          <SelectItem value="inactive">Inactiva</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación *</FormLabel>
                    <FormControl><Input placeholder="Valparaíso, Chile" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="region" render={({ field }) => (
                    <FormItem><FormLabel>Región</FormLabel><FormControl><Input placeholder="Valparaíso" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input placeholder="Viña del Mar" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>País</FormLabel><FormControl><Input placeholder="CL" {...field} /></FormControl></FormItem>
                  )} />
                </div>

                <div>
                  <FormLabel>Seleccionar en mapa</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">Haz clic o arrastra el marcador</p>
                  <LocationPicker
                    lat={form.watch('lat') ?? null}
                    lng={form.watch('lng') ?? null}
                    onLocationSelect={handleLocationSelect}
                  />
                  {form.watch('lat') && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {form.watch('lat')?.toFixed(5)}, {form.watch('lng')?.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Price, Area, Tags */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio *</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="150000000" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="CLP">CLP</SelectItem>
                          <SelectItem value="UF">UF</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="area_m2" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" value={field.value ?? ''} onChange={e => handleAreaM2Change(e.target.value ? Number(e.target.value) : null)} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                {form.watch('area_ha') ? (
                  <p className="text-sm text-muted-foreground">≈ {form.watch('area_ha')} hectáreas</p>
                ) : null}

                {/* Tags */}
                <div>
                  <FormLabel>Servicios y características</FormLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TAG_OPTIONS.map(tag => {
                      const selected = tags.includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={selected ? 'default' : 'outline'}
                          className="cursor-pointer capitalize"
                          onClick={() => {
                            const next = selected ? tags.filter(t => t !== tag) : [...tags, tag];
                            form.setValue('tags', next);
                          }}
                        >
                          {selected && <Check className="h-3 w-3 mr-1" />}
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="space-y-4">
                <ImageUploader
                  images={images}
                  onImagesChange={(imgs) => form.setValue('images', imgs)}
                  userId={user?.id}
                  maxImages={10}
                />

                {/* Preview Summary */}
                <div className="rounded-xl border border-border p-4 space-y-2 bg-muted/30">
                  <h4 className="text-sm font-semibold">Resumen</h4>
                  <p className="text-sm"><strong>Título:</strong> {form.watch('title') || '—'}</p>
                  <p className="text-sm"><strong>Tipo:</strong> {PROPERTY_TYPES.find(t => t.value === form.watch('type'))?.label || '—'}</p>
                  <p className="text-sm"><strong>Ubicación:</strong> {form.watch('location') || '—'}</p>
                  <p className="text-sm"><strong>Precio:</strong> {form.watch('price')?.toLocaleString()} {form.watch('currency')}</p>
                  <p className="text-sm"><strong>Área:</strong> {form.watch('area_m2')?.toLocaleString() ?? '—'} m²</p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.map(t => <Badge key={t} variant="secondary" className="text-xs capitalize">{t}</Badge>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(step - 1) : setOpen(false)}>
                {step > 1 ? <><ChevronLeft className="h-4 w-4 mr-1" /> Anterior</> : 'Cancelar'}
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Propiedad
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
