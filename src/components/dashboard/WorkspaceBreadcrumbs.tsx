import { Link, matchPath, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { routeManifest } from '@/routes/routeManifest';
import { APP_CONTEXTS } from '@/lib/access/appContext';
import { useAccess } from '@/hooks/useAccess';

/** Visible location and a reliable return to the active workspace, independent of history. */
export default function WorkspaceBreadcrumbs() {
  const { pathname } = useLocation();
  const { context } = useAccess();
  if (!context || context === 'buyer') return null;
  const home = APP_CONTEXTS[context];
  const route = routeManifest.find((entry) => matchPath({ path: entry.path, end: true }, pathname));
  const label = route?.nav?.label ?? (pathname.startsWith('/asesor/project/') ? 'Detalle del proyecto' : pathname.startsWith('/asesor/kit-venta/') ? 'Kit de venta' : 'Detalle');
  return (
    <nav aria-label="Ubicación actual" className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <span>{home.shortLabel}</span><ChevronRight className="h-3 w-3" aria-hidden="true" />
      {pathname === home.home ? <span aria-current="page">Inicio</span> : <>
        <Link to={home.home} className="inline-flex min-h-11 items-center text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Inicio</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" /><span aria-current="page">{label}</span>
      </>}
    </nav>
  );
}
