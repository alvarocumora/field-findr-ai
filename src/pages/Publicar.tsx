import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Handshake, MapPin, Store } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import StickyHeader from '@/components/navigation/StickyHeader';

/**
 * Hub único de publicación: una sola puerta de entrada para los cuatro flujos
 * de publicar en la plataforma. Todos los botones "Publicar" del sitio apuntan
 * aquí, en vez de repartirse entre /publish, /asesor/projects y captaciones.
 */
const OPTIONS = [
  {
    icon: MapPin,
    title: 'Terreno individual',
    description: 'Publica un terreno propio en el marketplace con ayuda de IA: fotos, ubicación y precio.',
    href: '/publish',
    cta: 'Publicar terreno',
  },
  {
    icon: Building2,
    title: 'Proyecto / Loteo',
    description: 'Crea un proyecto con sus lotes (importa KMZ o dibuja), plano interactivo, reservas y ventas.',
    href: '/asesor/projects',
    cta: 'Crear proyecto',
  },
  {
    icon: Store,
    title: 'Lote de un proyecto',
    description: 'Publica lotes individuales de tus proyectos como avisos en el marketplace.',
    href: '/asesor/lots',
    cta: 'Ir a mis lotes',
  },
  {
    icon: Handshake,
    title: 'Terreno de un tercero (captación)',
    description: 'Ofrece un terreno que no es tuyo: la gerencia de OT negocia con el dueño y tú cobras comisión de captación.',
    href: '/asesor/captaciones',
    cta: 'Ofrecer captación',
  },
];

const Publicar = () => (
  <div className="min-h-screen bg-background">
    <StickyHeader />
    <main className="container max-w-4xl py-12 md:py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">¿Qué quieres publicar?</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          Elige el flujo que corresponde: todos terminan con tu publicación visible para compradores.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {OPTIONS.map((o) => (
          <Link key={o.href} to={o.href} className="group focus-ring rounded-xl">
            <Card className="h-full border-border/60 transition-colors group-hover:border-primary/50">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <o.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-semibold text-lg text-foreground">{o.title}</h2>
                <p className="text-sm text-muted-foreground mt-1 flex-1">{o.description}</p>
                <span className="mt-4 text-sm font-medium text-primary flex items-center gap-1">
                  {o.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  </div>
);

export default Publicar;
