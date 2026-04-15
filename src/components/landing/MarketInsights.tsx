import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, MapPin, BookOpen, BarChart3, ArrowRight } from 'lucide-react';

const ARTICLES = [
  {
    icon: TrendingUp,
    title: 'Tendencias del mercado de terrenos 2026',
    summary: 'Las regiones con mayor crecimiento en plusvalía y los factores que impulsan la demanda de terrenos rurales e industriales.',
    tag: 'Tendencia',
  },
  {
    icon: MapPin,
    title: 'Guía para invertir en terrenos rurales',
    summary: 'Factibilidad, acceso, agua, regulación y potencial de subdivisión: todo lo que debes evaluar antes de comprar.',
    tag: 'Guía',
  },
  {
    icon: BarChart3,
    title: 'Las regiones con mayor plusvalía',
    summary: 'Análisis comparativo de valorización por zona: desde O'Higgins hasta Los Lagos, dónde están las mejores oportunidades.',
    tag: 'Análisis',
  },
];

const MarketInsights = () => (
  <section className="py-16 md:py-20 border-t border-border/20">
    <div className="container px-4">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Insights & tendencias
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Inteligencia de mercado territorial
          </h2>
        </div>
        <Button variant="ghost" asChild className="hidden md:flex text-primary">
          <Link to="/blog">
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {ARTICLES.map((article) => (
          <Link to="/blog" key={article.title}>
            <Card className="h-full border-border/40 bg-card/50 hover:border-primary/30 hover:shadow-md transition-all group">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <article.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {article.tag}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground flex-1">
                  {article.summary}
                </p>
                <span className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
                  Leer más <ArrowRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center md:hidden">
        <Button variant="outline" asChild>
          <Link to="/blog">Ver todos los artículos</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default MarketInsights;
