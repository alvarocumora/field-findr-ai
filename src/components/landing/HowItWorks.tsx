import { Badge } from '@/components/ui/badge';
import { Upload, Grid3X3, CreditCard, CheckCircle2, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Sube tu proyecto',
    description: 'Carga tu master plan, KMZ y datos del loteo en minutos.',
  },
  {
    icon: Grid3X3,
    title: 'Configura tus lotes',
    description: 'Define parcelas, precios y disponibilidad con herramientas visuales.',
  },
  {
    icon: CreditCard,
    title: 'Recibe reservas',
    description: 'Tus compradores reservan y pagan la seña online de forma segura.',
  },
  {
    icon: CheckCircle2,
    title: 'Cierra ventas',
    description: 'Gestiona contratos, pagos y documentos desde un solo lugar.',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container relative z-10 px-4">
        <div className="text-center mb-14">
          <Badge variant="outline" className="border-primary/30 text-primary mb-4">
            <Sparkles className="h-3 w-3 mr-1.5" />
            Cómo Funciona
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            De proyecto a ventas en{' '}
            <span className="gradient-text">4 pasos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Automatiza la comercialización de tu loteo con herramientas diseñadas para desarrolladores inmobiliarios
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="group relative glass rounded-2xl p-6 text-center card-hover border border-border/50"
            >
              {/* Step number */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-md">
                {index + 1}
              </div>

              {/* Connector line (desktop only) */}
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 w-6 border-t-2 border-dashed border-primary/30" />
              )}

              <div className="mt-2 mb-4 inline-flex p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <step.icon className="h-6 w-6 text-primary" />
              </div>

              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
