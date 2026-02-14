import { Badge } from '@/components/ui/badge';
import { Search, BarChart3, CreditCard, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

const STEPS = [
  { icon: Search, title: 'Explora el mapa', description: 'Busca terrenos por ubicación, precio y tipo con nuestro mapa interactivo.' },
  { icon: BarChart3, title: 'Compara opciones', description: 'Analiza precio por m², conectividad y datos verificados.' },
  { icon: CreditCard, title: 'Reserva online', description: 'Asegura tu terreno con una seña digital al instante.' },
  { icon: CheckCircle2, title: 'Cierra tu compra', description: 'Contratos, pagos y escritura en un solo lugar.' },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
} as const;

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' as const } },
} as const;

const HowItWorks = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container relative z-10 px-4">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Cómo Funciona
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tu terreno ideal en{' '}
            <span className="gradient-text">4 pasos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Desde la búsqueda hasta la escritura, todo digital y seguro
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={prefersReducedMotion ? {} : container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                variants={prefersReducedMotion ? {} : item}
                className="group relative text-center"
              >
                <motion.div
                  className="relative z-10 w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <step.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                    {index + 1}
                  </span>
                </motion.div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-muted-foreground">
            ¿Eres desarrollador inmobiliario?{' '}
            <Link to="/pricing" className="text-primary hover:underline font-medium">
              Conoce nuestros planes →
            </Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
