import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { routeManifest } from '@/routes/routeManifest';
import { visibleCommercialActions } from '@/lib/access/commercialQuickActions';

const tasks = [
  { route: '/asesor/proyectos-en-venta', title: 'Vender proyectos', detail: 'Revisa el catálogo y solicita asignación.' },
  { route: '/asesor/leads', title: 'Atender clientes', detail: 'Contacta y da seguimiento a tus oportunidades.' },
  { route: '/asesor/visitas', title: 'Organizar visitas', detail: 'Revisa tu agenda y confirma el siguiente encuentro.' },
  { route: '/asesor/captaciones', title: 'Captar terrenos', detail: 'Ofrece un terreno y sigue la revisión de gerencia.' },
  { route: '/asesor/comisiones', title: 'Revisar comisiones', detail: 'Distingue potenciales, ganadas y pagadas.' },
];

/** Uses the same route visibility and capability rules as the sidebar. */
export default function CommercialTasks() {
  const access = useAccess();
  const visible = visibleCommercialActions(tasks, routeManifest, access);
  if (!visible.length || access.isLoading) return null;
  return (
    <section aria-label="Tu próxima tarea" className="space-y-3">
      <h2 className="text-lg font-semibold">¿Qué necesitas hacer hoy?</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((task) => (
          <Link key={task.route} to={task.route} className="rounded-lg border bg-card p-4 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex items-center justify-between gap-2 font-medium">{task.title}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></span>
            <span className="block mt-1 text-sm text-muted-foreground">{task.detail}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
