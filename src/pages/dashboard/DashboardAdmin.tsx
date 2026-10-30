import { Link, Navigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/useDashboardStats";
import TodayPanel from "@/components/dashboard/TodayPanel";
import { WorkspaceLoadError } from "@/components/dashboard/WorkspaceLoadError";

const legacyTabs: Record<string, string> = {
  users: "/admin/users",
  properties: "/admin/approvals",
  reservations: "/admin/reservations",
  documents: "/admin/documents",
  analytics: "/admin/analytics",
  security: "/admin/audit",
};
const tasks = [
  {
    title: "Usuarios y empresas",
    description: "Gestiona cuentas, organizaciones y suscripciones.",
    links: [
      { to: "/admin/users", label: "Usuarios y roles" },
      { to: "/admin/inmobiliarias", label: "Inmobiliarias" },
      { to: "/admin/suscripciones", label: "Suscripciones" },
    ],
  },
  {
    title: "Aprobaciones y brokers",
    description:
      "Revisa postulaciones y calidad del inventario antes de publicar.",
    links: [
      { to: "/admin/brokers", label: "Postulaciones de brokers" },
      { to: "/admin/project-approvals", label: "Aprobar loteos" },
      { to: "/admin/approvals", label: "Aprobar propiedades" },
      { to: "/admin/captaciones", label: "Captaciones" },
    ],
  },
  {
    title: "Operación comercial",
    description: "Sigue proyectos, consultas y reservas registradas.",
    links: [
      { to: "/admin/projects", label: "Proyectos e inventario" },
      { to: "/admin/commercial-leads", label: "Consultas comerciales" },
      { to: "/admin/reservations", label: "Reservas y comprobantes" },
      { to: "/admin/documents", label: "Documentos de operaciones" },
    ],
  },
  {
    title: "Ventas y comisiones",
    description:
      "Revisa operaciones y condiciones antes de modificar o liquidar.",
    links: [
      { to: "/admin/ventas", label: "Ventas registradas" },
      { to: "/admin/comisiones", label: "Comisiones y reglas" },
      { to: "/admin/credits", label: "Créditos" },
    ],
  },
  {
    title: "Atención y auditoría",
    description: "Resuelve solicitudes y revisa el registro de acciones.",
    links: [
      { to: "/admin/soporte", label: "Soporte" },
      { to: "/admin/audit", label: "Registro de auditoría" },
    ],
  },
];

export default function DashboardAdmin() {
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const query = useAdminStats();
  const destination = legacyTabs[params.get("tab") || ""];
  if (destination) {
    const remaining = new URLSearchParams(params);
    remaining.delete("tab");
    return (
      <Navigate
        to={`${destination}${remaining.size ? `?${remaining}` : ""}${hash}`}
        replace
      />
    );
  }
  const metrics = query.data
    ? [
        {
          label: "Usuarios registrados",
          value: query.data.totalUsers,
          to: "/admin/users",
        },
        {
          label: "Publicaciones activas",
          value: query.data.activeListings,
          to: "/explorar",
        },
        {
          label: "Proyectos activos",
          value: query.data.activeProjects,
          to: "/admin/projects",
        },
        {
          label: "Documentos por revisar",
          value: query.data.pendingAlerts,
          to: "/admin/documents",
        },
      ]
    : [];
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Administración de plataforma
          </h1>
          <p className="mt-2 text-muted-foreground">
            Revisa pendientes y entra al gestor de cada operación.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Actualizar resumen
        </Button>
      </header>
      <TodayPanel scope="platform" title="Pendientes de la plataforma" />
      <section
        aria-label="Resumen verificable de plataforma"
        className="space-y-3"
      >
        {query.error ? (
          <WorkspaceLoadError
            title="No pudimos verificar el resumen de administración"
            onRetry={query.refetch}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {query.isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))
              : metrics.map((metric) => (
                  <Card key={metric.label}>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="my-2 text-2xl font-semibold">
                        {metric.value.toLocaleString("es-CL")}
                      </p>
                      <Link
                        to={metric.to}
                        className="inline-flex min-h-11 items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Ver detalle
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Conteos exactos de las fuentes consultadas. Documentos por revisar
          incluye pendientes, subidos y en revisión. Los depósitos de reserva no
          representan el valor total de ventas.
        </p>
      </section>
      <section
        aria-label="Funciones de administración"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {tasks.map((task) => (
          <Card key={task.title}>
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-semibold">{task.title}</h2>
              <p className="text-sm text-muted-foreground">
                {task.description}
              </p>
              <ul className="space-y-1">
                {task.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="inline-flex min-h-11 items-center gap-2 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
