import { Shield, Award, Clock, Users } from 'lucide-react';

const BADGES = [
  {
    icon: Shield,
    title: 'Datos Verificados',
    description: 'Información validada del SII y Conservador de Bienes Raíces',
  },
  {
    icon: Award,
    title: 'IA de Precisión',
    description: 'Algoritmos entrenados con +500K transacciones reales',
  },
  {
    icon: Clock,
    title: 'Tiempo Real',
    description: 'Actualizaciones instantáneas de precios y disponibilidad',
  },
  {
    icon: Users,
    title: 'Soporte 24/7',
    description: 'Equipo de expertos inmobiliarios a tu disposición',
  },
];

const TrustBadges = () => {
  return (
    <section className="py-16 border-t border-border/50">
      <div className="container px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {BADGES.map((badge, index) => (
            <div
              key={badge.title}
              className="text-center group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <badge.icon className="h-7 w-7 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">{badge.title}</h4>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
