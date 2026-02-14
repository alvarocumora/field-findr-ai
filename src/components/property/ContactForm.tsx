import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  Phone, 
  Calendar,
  MessageSquare,
  User,
  Mail,
  CheckCircle
} from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Ingresa un email válido'),
  phone: z.string().min(8, 'Ingresa un teléfono válido').max(15).optional().or(z.literal('')),
  message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres').max(1000),
});

interface ContactFormProps {
  listingId: string;
  listingTitle: string;
  listingOwnerId?: string | null;
  onSuccess?: () => void;
}

const ContactForm = ({ listingId, listingTitle, listingOwnerId, onSuccess }: ContactFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    message: `Hola, me interesa la propiedad "${listingTitle}". Me gustaría recibir más información.`,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = contactSchema.parse(formData);
      setIsSubmitting(true);

      // Generate a thread_id for this conversation
      const threadId = crypto.randomUUID();
      
      const { error } = await supabase.from('messages').insert({
        thread_id: threadId,
        listing_id: listingId,
        sender_id: user?.id || '00000000-0000-0000-0000-000000000000',
        recipient_id: listingOwnerId || '00000000-0000-0000-0000-000000000000',
        content: `[${validated.name} - ${validated.email}${validated.phone ? ` - ${validated.phone}` : ''}]\n\n${validated.message}`,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'Mensaje enviado',
        description: 'El propietario recibirá tu consulta pronto.',
      });
      onSuccess?.();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="glass border-white/10">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            ¡Mensaje enviado!
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Te contactaremos pronto con más información sobre esta propiedad.
          </p>
          <Button 
            variant="outline" 
            className="glass border-white/10"
            onClick={() => setIsSubmitted(false)}
          >
            Enviar otro mensaje
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Contactar al vendedor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-foreground">
              Nombre *
            </Label>
            <div className="relative mt-1.5">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`pl-10 glass border-white/10 ${errors.name ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="text-foreground">
              Email *
            </Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`pl-10 glass border-white/10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone" className="text-foreground">
              Teléfono
            </Label>
            <div className="relative mt-1.5">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`pl-10 glass border-white/10 ${errors.phone ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="message" className="text-foreground">
              Mensaje *
            </Label>
            <Textarea
              id="message"
              placeholder="Escribe tu consulta..."
              rows={4}
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              className={`mt-1.5 glass border-white/10 ${errors.message ? 'border-red-500' : ''}`}
            />
            {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full btn-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Enviando...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar mensaje
                </>
              )}
            </Button>

            <Button 
              type="button"
              variant="outline" 
              className="w-full glass border-white/10"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Agendar visita
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Al enviar aceptas nuestra política de privacidad
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default ContactForm;
