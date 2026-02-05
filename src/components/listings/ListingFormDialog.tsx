import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const listingSchema = z.object({
  title: z.string().trim().min(1, 'El título es requerido').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['parcela', 'terreno', 'campo', 'sitio', 'loteo']),
  location: z.string().trim().min(1, 'La ubicación es requerida').max(200),
  region: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  price: z.number().min(1, 'El precio es requerido'),
  currency: z.enum(['CLP', 'UF', 'USD']),
  area_m2: z.number().min(1, 'El área es requerida').optional().nullable(),
  area_ha: z.number().min(0).optional().nullable(),
  status: z.enum(['active', 'reserved', 'sold', 'inactive']),
});

type ListingFormData = z.infer<typeof listingSchema>;

interface ListingFormDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ListingFormDialog({ trigger, onSuccess }: ListingFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'parcela',
      location: '',
      region: '',
      city: '',
      price: 0,
      currency: 'CLP',
      area_m2: null,
      area_ha: null,
      status: 'active',
    },
  });

  const onSubmit = async (data: ListingFormData) => {
    if (!user) {
      toast.error('Debes iniciar sesión');
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
        price: data.price,
        currency: data.currency,
        area_m2: data.area_m2,
        area_ha: data.area_ha,
        status: data.status,
      });

      if (error) throw error;

      toast.success('Propiedad creada exitosamente');
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['agent-stats'] });
      queryClient.invalidateQueries({ queryKey: ['agency-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-listings'] });
      onSuccess?.();
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Error al crear la propiedad');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-calculate hectares from m2
  const watchAreaM2 = form.watch('area_m2');
  const handleAreaM2Change = (value: number | null) => {
    form.setValue('area_m2', value);
    if (value && value > 0) {
      form.setValue('area_ha', Number((value / 10000).toFixed(2)));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl gap-2">
            <Building2 className="h-4 w-4" />
            Nueva Propiedad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Propiedad</DialogTitle>
          <DialogDescription>
            Publica una nueva propiedad en el marketplace
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Parcela con vista al mar en Valparaíso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe las características principales de la propiedad..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de propiedad *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="parcela">Parcela</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                        <SelectItem value="campo">Campo</SelectItem>
                        <SelectItem value="sitio">Sitio</SelectItem>
                        <SelectItem value="loteo">Loteo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="reserved">Reservada</SelectItem>
                        <SelectItem value="sold">Vendida</SelectItem>
                        <SelectItem value="inactive">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación *</FormLabel>
                  <FormControl>
                    <Input placeholder="Valparaíso, Chile" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Región</FormLabel>
                    <FormControl>
                      <Input placeholder="Valparaíso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad/Comuna</FormLabel>
                    <FormControl>
                      <Input placeholder="Viña del Mar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="150000000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CLP">CLP</SelectItem>
                        <SelectItem value="UF">UF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area_m2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={field.value ?? ''}
                        onChange={(e) => handleAreaM2Change(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear Propiedad
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
