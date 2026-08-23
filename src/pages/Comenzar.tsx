import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Landmark, TrendingUp, ArrowRight } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useAuth } from '@/hooks/useAuth';

/**
 * Onboarding por intención: una sola pregunta ("¿qué vienes a hacer?")
 * que deja al usuario dentro del flujo correcto sin pasearlo por el menú.
 */
const Comenzar = () => {
  const { user } = useAuth();

  useSEO({
    title: 'Comenzar en Oferta Terrenos: comprar, vender o invertir',
    description:
      'Elige tu camino en un paso: buscar terrenos, publicar y vender tu propiedad o loteo, o invertir con análisis territorial.',
    canonicalUrl: '/comenzar',
  });

  const intents = [
    {
      icon: Search,
      title: 'Quiero comprar',
      text: 'Busca terrenos y parcelas con mapa, filtros reales y fichas con análisis territorial.',
      to: '/explorar',
      cta: 'Explorar terrenos',
    },
    {
      icon: Landmark,
      title: 'Quiero vender',
      text: 'Publica un terreno o gestiona un loteo completo: planos, lotes, reservas y comisiones.',
      to: user ? '/publicar' : '/auth?role=agent&redirect=/publicar',
      cta: 'Publicar ahora',
    },
    {
      icon: TrendingUp,
      title: 'Quiero invertir',
      text: 'Oportunidades filtradas por potencial, comparables de mercado y proyección de plusvalía.',
      to: '/oportunidades',
      cta: 'Ver oportunidades',
    },
  ];

  return (
    <PublicLayout>
      <main className="container px-4 py-16 max-w-5xl">
        <header className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">¿Qué vienes a hacer?</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Elige tu camino y te dejamos directo en la herramienta correcta. Puedes cambiar
            de rol cuando quieras.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {intents.map(({ icon: Icon, title, text, to, cta }) => (
            <Card key={title} className="border-border/60 h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <Icon className="h-7 w-7 text-primary mb-4" aria-hidden="true" />
                <h2 className="text-lg font-semibold mb-2">{title}</h2>
                <p className="text-sm text-muted-foreground flex-1">{text}</p>
                <Button asChild className="mt-6 w-full">
                  <Link to={to}>
                    {cta} <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          ¿Vendes terrenos de forma profesional?{' '}
          <Link to="/comunidad" className="text-primary hover:underline">
            Conoce la comunidad de brokers
          </Link>
        </p>
      </main>
    </PublicLayout>
  );
};

export default Comenzar;
