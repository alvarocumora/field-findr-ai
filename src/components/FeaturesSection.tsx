import { Brain, Map, LineChart, Shield, Zap, Users } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'IA Predictiva',
    description: 'Algoritmos que analizan tendencias del mercado y predicen la valorización de terrenos con 98% de precisión.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Map,
    title: 'Mapas Inteligentes',
    description: 'Visualiza capas de datos: zonificación, riesgos, servicios cercanos y proyecciones de desarrollo urbano.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: LineChart,
    title: 'Análisis de Mercado',
    description: 'Compara precios, detecta oportunidades y recibe alertas cuando aparecen propiedades que coinciden con tu perfil.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Shield,
    title: 'Due Diligence IA',
    description: 'Verificación automática de títulos, gravámenes, riesgos legales y ambientales en minutos.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Zap,
    title: 'Automatización',
    description: 'Gestiona leads, genera contratos y automatiza seguimientos con nuestro CRM inteligente.',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Red de Expertos',
    description: 'Conecta con agentes verificados, abogados especializados y asesores financieros.',
    gradient: 'from-indigo-500 to-purple-500',
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      <div className="container relative z-10 px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground mb-6">
            <Zap className="h-4 w-4 text-primary" />
            Tecnología de punta
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Herramientas que
            <span className="gradient-text"> transforman</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plataforma integral diseñada para inversores, desarrolladores y agentes inmobiliarios que buscan ventaja competitiva.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative glass rounded-2xl p-8 card-hover border-gradient opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, hsla(82, 100%, 50%, 0.05), transparent 70%)`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
