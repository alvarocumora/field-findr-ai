import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** A useful public dead-end, not a browser reset or an English template. */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn('Rural Finder: ruta pública no encontrada', location.pathname);
  }, [location.pathname]);

  return (
    <main className="theme-rural flex min-h-screen items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-border bg-card text-primary">
          <MapPin className="h-8 w-8" aria-hidden="true" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Rural Finder · Error 404</p>
        <h1 className="mt-3 font-editorial text-4xl font-medium tracking-tight sm:text-5xl">
          No encontramos esta página.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Es posible que el proyecto, la parcela o el enlace haya cambiado.
          Puedes volver a la portada o seguir explorando los terrenos publicados.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-h-11">
            <Link to="/explorar"><Compass className="mr-2 h-4 w-4" aria-hidden="true" />Explorar terrenos</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-11">
            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Volver al inicio</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
