import { Shield, Award, Clock, Users } from 'lucide-react';

const BADGES = [
  {
    icon: Shield,
    title: 'Datos Verificados',
    description: 'Información validada del SII y Conservador',
  },
  {
    icon: Award,
    title: 'IA de Precisión',
    description: 'Análisis con datos reales del mercado',
  },
  {
    icon: Clock,
    title: 'Tiempo Real',
    description: 'Precios y disponibilidad actualizados',
  },
  {
    icon: Users,
    title: 'Soporte Experto',
    description: 'Equipo inmobiliario a tu disposición',
  },
];

const TrustBadges = () => {
  return (
    <section className="py-12 border-t border-border/50">
      <div className="container px-4">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {BADGES.map((badge) => (
            <div
              key={badge.title}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <badge.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{badge.title}</h4>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
