import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, MapPin, BarChart3, BookOpen, Shield, Landmark, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEO } from '@/hooks/useSEO';

const ARTICLES = [
  {
    icon: TrendingUp,
    tag: 'Tendencia',
    title: 'Mercado de terrenos 2026: las regiones que lideran la plusvalía',
    summary: 'Un análisis de las zonas con mayor valorización en los últimos 3 años y las proyecciones para el próximo periodo. Descubre dónde están creciendo los precios y qué factores lo impulsan.',
    readTime: '6 min',
  },
  {
    icon: MapPin,
    tag: 'Guía',
    title: 'Cómo evaluar un terreno rural antes de comprar',
    summary: 'Factibilidad de agua, acceso vial, regulación municipal, subdivisión y topografía: los 10 factores críticos que todo comprador debe verificar.',
    readTime: '8 min',
  },
  {
    icon: BarChart3,
    tag: 'Análisis',
    title: 'Inversión en terrenos industriales y logísticos',
    summary: 'El boom de la logística en Chile ha disparado la demanda por sitios industriales. Analizamos las comunas más atractivas y los retornos esperados.',
    readTime: '5 min',
  },
  {
    icon: Shield,
    tag: 'Legal',
    title: 'Due diligence territorial: qué revisar antes de cerrar',
    summary: 'Desde el estudio de títulos hasta la verificación en el SII y el Conservador de Bienes Raíces. Una guía práctica para proteger tu inversión.',
    readTime: '7 min',
  },
  {
    icon: Landmark,
    tag: 'Regulación',
    title: 'Normativa de subdivisión de predios rurales en Chile',
    summary: 'Requisitos del SAG, superficies mínimas por zona, y el proceso completo para subdividir un predio rural de forma legal y rentable.',
    readTime: '6 min',
  },
  {
    icon: BookOpen,
    tag: 'Guía',
    title: 'Parcelas de agrado: oportunidad o riesgo para inversionistas',
    summary: 'Evaluamos el mercado de parcelas de agrado como activo de inversión. Plusvalía histórica, liquidez, costos ocultos y estrategias de salida.',
    readTime: '5 min',
  },
];

const Blog = () => {
  useSEO({
    title: 'Blog de Terrenos e Inversión Territorial | Ofertaterrenos.com',
    description: 'Artículos sobre inversión en terrenos, tendencias del mercado inmobiliario rural, guías de compra y análisis territorial en Chile.',
  });

  return (
    <Layout>
      <div className="container px-4 py-12 md:py-16 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Blog & Insights
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Inteligencia de mercado territorial
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Análisis, guías y tendencias sobre inversión en terrenos, campos, parcelas y oportunidades territoriales en Chile.
          </p>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {ARTICLES.map((article) => (
            <Card
              key={article.title}
              className="border-border/40 bg-card/50 hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <article.icon className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {article.tag}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{article.readTime}</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                  {article.title}
                </h2>
                <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                  {article.summary}
                </p>
                <span className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
                  Próximamente <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <Card className="mt-12 border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center space-y-4">
            <BookOpen className="h-8 w-8 text-primary mx-auto" />
            <h3 className="text-xl font-bold text-foreground">¿Quieres recibir nuestros análisis?</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Regístrate y recibe insights sobre inversión territorial, nuevas oportunidades y tendencias del mercado.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">Crear cuenta gratis</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Blog;
