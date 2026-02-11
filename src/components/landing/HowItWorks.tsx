import { Badge } from '@/components/ui/badge';
import { Upload, Grid3X3, CreditCard, CheckCircle2, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Sube tu proyecto',
    description: 'Master plan, KMZ y datos del loteo.',
  },
  {
    icon: Grid3X3,
    title: 'Configura lotes',
    description: 'Parcelas, precios y disponibilidad.',
  },
  {
    icon: CreditCard,
    title: 'Recibe reservas',
    description: 'Seña online de forma segura.',
  },
  {
    icon: CheckCircle2,
    title: 'Cierra ventas',
    description: 'Contratos y pagos en un solo lugar.',
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
            Automatiza la comercialización de tu loteo
          </p>
        </div>

        {/* Steps with connecting line */}
        <div className="relative max-w-5xl mx-auto">
          {/* Continuous connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="group relative text-center"
              >
                {/* Step number circle */}
                <div className="relative z-10 w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-primary" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-foreground mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
