import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Maximize2, DollarSign, MapPin, Send, Loader2 } from 'lucide-react';

const reservationSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  email: z.string().email('Email inválido').max(100),
  phone: z.string().min(8, 'Teléfono inválido').max(20),
  message: z.string().max(500).optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

interface LotData {
  id: string;
  lot_number: string;
  area: number;
  price: number | null;
  status: string | null;
  project_id: string;
}

interface LotReservationDialogProps {
  lot: LotData | null;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);
};

export const LotReservationDialog = ({
  lot,
  projectName,
  open,
  onOpenChange,
}: LotReservationDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (data: ReservationFormData) => {
    if (!lot) return;
    
    setIsSubmitting(true);
    try {
      // Create a lead for this reservation request
      const { error } = await supabase.from('leads').insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        notes: `Solicitud de reserva para Lote ${lot.lot_number} en ${projectName}. ${data.message || ''}`,
        project_id: lot.project_id,
        lot_id: lot.id,
        source: 'web_reservation',
        status: 'new',
        budget_min: lot.price ? lot.price * 0.9 : null,
        budget_max: lot.price ? lot.price * 1.1 : null,
        user_id: (await supabase.auth.getUser()).data.user?.id || '',
      });

      if (error) throw error;

      toast.success('¡Solicitud enviada!', {
        description: 'Nos pondremos en contacto contigo pronto.',
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting reservation:', error);
      toast.error('Error al enviar', {
        description: 'Por favor intenta de nuevo más tarde.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              Lote {lot.lot_number}
            </Badge>
            Solicitar Reserva
          </DialogTitle>
          <DialogDescription>
            Completa tus datos para reservar este lote en {projectName}
          </DialogDescription>
        </DialogHeader>

        {/* Lot Summary */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 mb-4">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Superficie</p>
              <p className="font-semibold">{lot.area.toLocaleString()} m²</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Precio</p>
              <p className="font-semibold text-primary">{formatPrice(lot.price)}</p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="juan@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+56 9 1234 5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="¿Alguna consulta adicional?"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? 'Enviando...' : 'Solicitar Reserva'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
