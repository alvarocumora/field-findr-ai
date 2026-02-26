import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Carolina M.',
    role: 'Inversionista',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
    text: 'Encontré mi parcela ideal en Los Lagos en menos de una semana. La IA me sugirió opciones que ni había considerado.',
    stars: 5,
  },
  {
    name: 'Rodrigo P.',
    role: 'Desarrollador Inmobiliario',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
    text: 'La gestión de lotes y reservas online nos ahorró meses de trabajo. Nuestro proyecto se vendió un 40% más rápido.',
    stars: 5,
  },
  {
    name: 'María José L.',
    role: 'Compradora',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
    text: 'Reservé mi terreno desde el celular en 5 minutos. Todo el proceso fue transparente y seguro.',
    stars: 5,
  },
  {
    name: 'Andrés F.',
    role: 'Asesor Inmobiliario',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
    text: 'El CRM integrado y el scoring de leads me permiten cerrar más ventas con menos esfuerzo.',
    stars: 5,
  },
  {
    name: 'Valentina R.',
    role: 'Inversionista',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face',
    text: 'Los análisis predictivos de valorización me dieron la confianza para invertir. Ya obtuve un 25% de plusvalía.',
    stars: 4,
  },
  {
    name: 'Felipe C.',
    role: 'Comprador',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
    text: 'La mejor plataforma para comprar terrenos en Chile. Datos verificados y proceso 100% digital.',
    stars: 5,
  },
];

const TestimonialCard = ({ testimonial }: { testimonial: typeof TESTIMONIALS[0] }) => (
  <div className="flex-shrink-0 w-[320px] md:w-[380px] p-5 rounded-2xl glass border border-border/50 hover:border-primary/20 transition-colors">
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < testimonial.stars ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
    <p className="text-sm text-foreground/90 leading-relaxed mb-4 line-clamp-3">
      "{testimonial.text}"
    </p>
    <div className="flex items-center gap-3">
      <img
        src={testimonial.avatar}
        alt={testimonial.name}
        className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
        loading="lazy"
      />
      <div>
        <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
      </div>
    </div>
  </div>
);

const TestimonialMarquee = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-16 md:py-20 overflow-hidden">
      <div className="container px-4 mb-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-sm uppercase tracking-widest text-primary font-semibold mb-3">
            Testimonios
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Lo que dicen nuestros{' '}
            <span className="gradient-text">usuarios</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Miles de compradores e inversionistas confían en nuestra plataforma
          </p>
        </motion.div>
      </div>

      {/* Marquee Row 1 */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

        <motion.div
          className="flex gap-4"
          animate={prefersReducedMotion ? {} : { x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <TestimonialCard key={`${t.name}-${i}`} testimonial={t} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialMarquee;
