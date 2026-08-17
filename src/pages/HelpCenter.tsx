import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import { useSEO } from '@/hooks/useSEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, LifeBuoy, MessagesSquare } from 'lucide-react';
import { HELP_ARTICLES, SUPPORT_CATEGORIES, categoryLabel } from '@/lib/support/helpCenter';

const HelpCenter = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  useSEO({
    title: 'Centro de ayuda para brokers | Oferta Terrenos',
    description:
      'Guías sobre comisiones, proyectos, publicaciones y pagos para brokers de loteos y terrenos. Abre un ticket y recibe soporte del equipo.',
    canonicalUrl: 'https://ofertaterrenos.com/ayuda',
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HELP_ARTICLES.filter((a) => {
      const matchCat = category === 'all' || a.category === category;
      const matchQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.body.some((p) => p.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <header className="text-center mb-10">
          <Badge variant="outline" className="mb-3">Soporte</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Centro de ayuda</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Respuestas rápidas para brokers, corredoras e inmobiliarias. Si no encuentras lo que buscas,
            abre un ticket y el equipo te responde en tu panel.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild className="gap-2">
              <Link to="/asesor/soporte">
                <LifeBuoy className="h-4 w-4" aria-hidden="true" /> Ir a mis tickets
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link to="/contacto">
                <MessagesSquare className="h-4 w-4" aria-hidden="true" /> Contacto comercial
              </Link>
            </Button>
          </div>
        </header>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="help-search" className="sr-only">Buscar en el centro de ayuda</label>
          <Input
            id="help-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: comisiones, límites de publicación, mapa…"
            className="pl-9"
          />
        </div>

        <nav aria-label="Categorías de ayuda" className="mb-8 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={category === 'all' ? 'default' : 'outline'}
            onClick={() => setCategory('all')}
          >
            Todas
          </Button>
          {SUPPORT_CATEGORIES.map((c) => (
            <Button
              key={c.value}
              size="sm"
              variant={category === c.value ? 'default' : 'outline'}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Button>
          ))}
        </nav>

        {results.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No encontramos artículos para “{query}”. Abre un ticket desde tu panel y te ayudamos.
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {results.map((a) => (
              <AccordionItem key={a.slug} value={a.slug} className="border rounded-lg px-4">
                <AccordionTrigger className="text-left">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-muted-foreground font-normal">{a.summary}</p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Badge variant="secondary" className="mb-3">{categoryLabel(a.category)}</Badge>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {a.body.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="text-lg">¿Sigues con dudas?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Los tickets quedan con historial completo y asignación a un administrador.
            </p>
            <Button asChild>
              <Link to="/asesor/soporte">Abrir un ticket</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
};

export default HelpCenter;
