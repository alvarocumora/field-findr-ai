import { useState } from 'react';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { createContactMailto } from '@/lib/contactMailto';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().trim().email('Ingresa un email válido').max(255),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  subject: z.string().trim().min(3, 'El asunto debe tener al menos 3 caracteres').max(200),
  message: z.string().trim().min(10, 'El mensaje debe tener al menos 10 caracteres').max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const CONTACT_INFO = [
  {
    icon: Phone,
    label: 'Teléfono',
    value: '+56 9 8382 3005',
    href: 'tel:+56983823005',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'ventas@ofertaterrenos.com',
    href: 'mailto:ventas@ofertaterrenos.com',
  },
  {
    icon: MapPin,
    label: 'Dirección',
    value: 'Cerro El Plomo 5420, Las Condes, Santiago, Chile',
    href: 'https://maps.google.com/?q=Cerro+El+Plomo+5420+Las+Condes+Santiago+Chile',
  },
  {
    icon: Clock,
    label: 'Horario',
    value: 'Lun - Vie: 9:00 - 18:00',
  },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const Contact = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [preparedMailto, setPreparedMailto] = useState<string | null>(null);

  useSEO({
    title: 'Contacto',
    description: 'Contáctanos para consultas sobre terrenos, proyectos de loteo e inversión inmobiliaria en Latinoamérica. Estamos en Cerro El Plomo 5420, Las Condes.',
    url: 'https://ofertaterrenos.com/contacto',
    canonicalUrl: 'https://ofertaterrenos.com/contacto',
  });

  const handleChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactForm, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof ContactForm;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // No backend for this global contact form: hand off to the email client,
    // explicitly without claiming a successful submission.
    const mailto = createContactMailto({
      // Zod validated these required fields above; explicitly normalize for
      // the project's non-strict inference of optional parsed properties.
      name: result.data.name ?? '',
      email: result.data.email ?? '',
      phone: result.data.phone || undefined,
      subject: result.data.subject ?? '',
      message: result.data.message ?? '',
    });
    setPreparedMailto(mailto);
    window.location.href = mailto;
  };

  return (
    <PublicLayout>
      <div className="theme-rural bg-background text-foreground">
      {/* Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative container px-4 text-center">
          <motion.h1
            className="font-editorial text-4xl md:text-5xl font-medium text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            Contáctanos
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            ¿Tienes preguntas sobre terrenos o proyectos? Escríbenos y te responderemos a la brevedad.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-16 md:pb-24">
        <div className="container px-4">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact info + Map */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              variants={stagger} initial="hidden" animate="visible"
            >
              {CONTACT_INFO.map((item) => (
                <motion.div key={item.label} variants={fadeUp}>
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-foreground">{item.value}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Embedded Google Map */}
              <motion.div variants={fadeUp} className="rounded-xl overflow-hidden border border-border/50 aspect-[4/3]">
                <iframe
                  title="Ubicación Ofertaterrenos"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.9!2d-70.4107!3d-33.4103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662cf1b0c7b9e1f%3A0x0!2sCerro+El+Plomo+5420%2C+Las+Condes%2C+Santiago!5e0!3m2!1ses!2scl!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </motion.div>
            </motion.div>

            {/* Form */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8">
                  {preparedMailto ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                      <h3 className="font-editorial text-2xl font-medium text-foreground mb-2">Tu consulta está preparada</h3>
                      <p className="text-muted-foreground mb-6">Se intentó abrir tu aplicación de correo. El mensaje todavía no está enviado: confirma el envío desde tu correo. Si no se abrió, pulsa el botón siguiente.</p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button asChild><a href={preparedMailto}><Mail className="mr-2 h-4 w-4" />Abrir aplicación de correo</a></Button>
                        <Button variant="outline" onClick={() => { setPreparedMailto(null); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); }}>
                          Preparar otra consulta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <h2 className="text-xl font-bold text-foreground mb-1">Envíanos un mensaje</h2>
                      <p className="text-sm text-muted-foreground mb-4">Completa el formulario y te contactaremos.</p>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Nombre *</Label>
                          <Input id="name" placeholder="Tu nombre" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={errors.name ? 'border-destructive' : ''} />
                          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" placeholder="tu@email.com" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={errors.email ? 'border-destructive' : ''} />
                          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Teléfono</Label>
                          <Input id="phone" type="tel" placeholder="+56 9 1234 5678" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="subject">Asunto *</Label>
                          <Input id="subject" placeholder="¿Sobre qué nos escribes?" value={formData.subject} onChange={e => handleChange('subject', e.target.value)} className={errors.subject ? 'border-destructive' : ''} />
                          {errors.subject && <p className="text-xs text-destructive mt-1">{errors.subject}</p>}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="message">Mensaje *</Label>
                        <Textarea id="message" rows={5} placeholder="Cuéntanos en qué podemos ayudarte..." value={formData.message} onChange={e => handleChange('message', e.target.value)} className={errors.message ? 'border-destructive' : ''} />
                        {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                      </div>

                      <p className="text-xs leading-relaxed text-muted-foreground">Al continuar, se abrirá tu aplicación de correo. Revisa el mensaje y confirma su envío allí; todavía no contamos con envío directo desde este formulario.</p>
                      <Button type="submit" className="w-full" size="lg">
                        <Send className="h-4 w-4 mr-2" /> Preparar correo
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
      </div>
    </PublicLayout>
  );
};

export default Contact;
