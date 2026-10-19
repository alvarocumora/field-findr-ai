import { useEffect, useRef, useState } from 'react';
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
import { useCreateReservation } from '@/hooks/useReservations';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { saveReservationDraft, readReservationDraft, clearReservationDraft } from '@/lib/reservationDraft';
import { toast } from 'sonner';
import { Maximize2, DollarSign, Clock, Send, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const reservationSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50),
  email: z.string().email('Email inválido').max(100),
  phone: z.string().min(8, 'Teléfono inválido').max(20),
  rut: z.string().max(12).optional(),
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
  reservationAmount?: number;
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
  reservationAmount = 500000,
}: LotReservationDialogProps) => {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const createReservation = useCreateReservation();
  const { user } = useAuth();
  const prefilledFromDraft = useRef<string | null>(null);

  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      rut: '',
      message: '',
    },
  });

  // Si el visitante ya había llenado este formulario y volvió (p.ej. tras
  // iniciar sesión con Google en otra pestaña/redirección), recupera lo que
  // escribió en vez de dejarlo en blanco y obligarlo a repetir todo. El
  // diálogo puede reutilizarse para distintos lotes sin desmontarse, así que
  // la comprobación se repite por cada lot.id nuevo, no solo una vez.
  useEffect(() => {
    if (!lot || prefilledFromDraft.current === lot.id) return;
    prefilledFromDraft.current = lot.id;
    const draft = readReservationDraft(lot.id);
    if (draft) {
      form.reset({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        phone: draft.phone,
        rut: draft.rut ?? '',
        message: draft.message ?? '',
      });
    }
  }, [lot, form]);

  const submitReservation = async (data: ReservationFormData) => {
    if (!lot) return;

    let result;
    try {
      result = await createReservation.mutateAsync({
        lot_id: lot.id,
        buyer_name: `${data.firstName} ${data.lastName}`,
        buyer_email: data.email,
        buyer_phone: data.phone,
        buyer_rut: data.rut,
        reservation_amount: reservationAmount,
        notes: data.message,
      });
    } catch {
      // The hook already toasts the server error; keep the dialog open so the
      // buyer can retry.
      return;
    }

    clearReservationDraft();

    // If we got a payment URL, redirect to MercadoPago
    if (result.payment_url) {
      window.location.href = result.payment_url;
    } else {
      // No payment URL, just close the dialog
      form.reset();
      setStep('form');
      onOpenChange(false);
    }
  };

  const onSubmit = async (data: ReservationFormData) => {
    if (!lot) return;

    if (user) {
      await submitReservation(data);
      return;
    }

    // Visitante sin sesión: antes esto fallaba con "Debes iniciar sesión" y
    // perdía el lote elegido. Ahora guarda lo que ya escribió y pide Google
    // en el mismo diálogo; si el proveedor resuelve sin redirigir (caso
    // normal), sigue directo a la reserva sin que el visitante tenga que
    // volver a buscar la parcela.
    saveReservationDraft({
      lotId: lot.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      rut: data.rut,
      message: data.message,
    });
    setIsAuthenticating(true);
    try {
      const authResult = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.href,
      });
      if (authResult.error) {
        toast.error('No se pudo iniciar sesión con Google. Intenta de nuevo.');
        return;
      }
      if (authResult.redirected) {
        // La página está navegando a Google; el draft queda guardado para
        // cuando el visitante vuelva a este mismo lote.
        return;
      }
      await submitReservation(data);
    } catch {
      toast.error('No se pudo iniciar sesión con Google. Intenta de nuevo.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClose = () => {
    if (!createReservation.isPending && !isAuthenticating) {
      form.reset();
      setStep('form');
      onOpenChange(false);
    }
  };

  if (!lot) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">
              Lote {lot.lot_number}
            </Badge>
            Reservar con Depósito
          </DialogTitle>
          <DialogDescription>
            Reserva este lote en {projectName} con un depósito de {formatPrice(reservationAmount)}
          </DialogDescription>
        </DialogHeader>

        {/* Lot Summary */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 mb-4">
          <div className="flex items-center gap-2">
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Superficie</p>
              <p className="font-semibold text-sm">{lot.area.toLocaleString()} m²</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Precio Total</p>
              <p className="font-semibold text-sm text-primary">{formatPrice(lot.price)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Reserva válida</p>
              <p className="font-semibold text-sm">48 horas</p>
            </div>
          </div>
        </div>

        {/* Reservation Amount Highlight */}
        <Alert className="border-primary/50 bg-primary/5">
          <CreditCard className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Depósito de reserva: {formatPrice(reservationAmount)}</strong>
            <br />
            <span className="text-muted-foreground">
              Este monto se descontará del precio total al firmar la promesa de compraventa.
            </span>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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

            <div className="grid grid-cols-2 gap-3">
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
                name="rut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="12.345.678-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={createReservation.isPending || isAuthenticating}
                size="lg"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Conectando con Google...
                  </>
                ) : createReservation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pagar Depósito {formatPrice(reservationAmount)}
                  </>
                )}
              </Button>
              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Te pediremos confirmar con Google para proteger tu reserva — no perderás estos datos.
                </p>
              )}
              <p className="text-xs text-center text-muted-foreground">
                Serás redirigido a MercadoPago para completar el pago de forma segura
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
