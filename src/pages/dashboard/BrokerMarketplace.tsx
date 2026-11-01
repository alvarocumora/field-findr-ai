import { useAccess } from "@/hooks/useAccess";
import { visibleCommercialActions } from "@/lib/access/commercialQuickActions";
import { routeManifest } from "@/routes/routeManifest";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  useProjectAssignments,
  useRequestProjectAssignment,
  useDecideAssignment,
  useMyBrokerProfile,
  type ProjectBrokerAssignment,
} from "@/hooks/useBrokers";
import {
  useBrokerMarketProjects,
  useAssignedMarketProjects,
  type MarketProject,
} from "@/hooks/useBrokerMarketProjects";
import { useCommissionRules } from "@/hooks/useAdminCommissions";
import { commissionSplitLabel, fixedProjectRule } from "@/lib/commissions/fixedProjectRule";
import { getShareUrl } from "@/lib/publicUrls";
import { WorkspaceLoadError } from "@/components/dashboard/WorkspaceLoadError";

const projectPath = (project: Pick<MarketProject, "id" | "slug">) =>
  project.slug
    ? `/p/${encodeURIComponent(project.slug)}`
    : `/proyecto/${encodeURIComponent(project.id)}`;
const statuses: Record<
  ProjectBrokerAssignment["status"],
  { label: string; next: string }
> = {
  pending: {
    label: "En revisión",
    next: "Espera la aprobación del responsable del proyecto antes de comenzar a vender.",
  },
  approved: {
    label: "Aprobado para vender",
    next: "Revisa el material, comparte tu enlace y atiende tus consultas.",
  },
  rejected: {
    label: "No aprobado",
    next: "Consulta las condiciones con el responsable antes de volver a solicitar.",
  },
  revoked: {
    label: "Asignación revocada",
    next: "Confirma una nueva autorización antes de continuar ofreciendo este proyecto.",
  },
};

export default function BrokerMarketplace() {
  const { user } = useAuth();
  const access = useAccess();
  const nextSteps = visibleCommercialActions(
    [
      { route: "/asesor/leads", label: "Atender consultas" },
      { route: "/asesor/reservations", label: "Ver reservas" },
      { route: "/asesor/comisiones", label: "Mis comisiones" },
    ],
    routeManifest,
    access,
  );
  const [params, setParams] = useSearchParams();
  const tab = ["mine", "incoming"].includes(params.get("tab") || "")
    ? params.get("tab")!
    : "catalog";
  const q = params.get("q") || "";
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };
  const catalog = useBrokerMarketProjects(q);
  const assignmentsQuery = useProjectAssignments();
  const rulesQuery = useCommissionRules();
  const profileQuery = useMyBrokerProfile();
  const assignments = assignmentsQuery.data ?? [];
  const details = useAssignedMarketProjects(
    assignments.map((assignment) => assignment.project_id),
  );
  const request = useRequestProjectAssignment();
  const decide = useDecideAssignment();
  const queries = [
    catalog,
    assignmentsQuery,
    rulesQuery,
    profileQuery,
    details,
  ];
  const projects = catalog.data?.pages.flat() ?? [];
  const mine = assignments.filter(
    (assignment) => assignment.broker_id === user?.id,
  );
  const incoming = assignments.filter(
    (assignment) =>
      assignment.owner_id === user?.id && assignment.status === "pending",
  );
  const approved = mine.filter(
    (assignment) => assignment.status === "approved",
  );
  const rules = (rulesQuery.data ?? []).filter((rule) => rule.is_active);
  const profile = profileQuery.data;
  const projectFor = (id: string) =>
    details.data?.find((project) => project.id === id);
  const rateLabel = (projectId: string) => {
    const fixed = fixedProjectRule(rules, projectId);
    if (fixed) {
      return commissionSplitLabel(fixed);
    }
    const assignment = approved.find((item) => item.project_id === projectId);
    const rate = assignment?.commission_rate ??
      rules.find((rule) => rule.scope === "project" && rule.project_id === projectId)?.commission_rate ??
      rules.find((rule) => rule.scope === "default")?.commission_rate;
    return rate !== undefined && Number.isFinite(rate) && rate >= 0
      ? `${rate}%${assignment ? " acordado" : " de referencia · por acordar"}`
      : "Comisión por acordar";
  };
  const share = async (project: MarketProject) => {
    const url = getShareUrl(projectPath(project), {
      ref: profile?.invite_code,
    });
    try {
      if (navigator.share)
        await navigator.share({
          title: project.name,
          text: `Parcelas en venta: ${project.name}`,
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Enlace de venta copiado");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast.error(
          "No se pudo compartir. Abre la ficha para copiar su enlace.",
        );
    }
  };
  if (queries.some((query) => query.error))
    return (
      <div className="container p-4">
        <WorkspaceLoadError
          title="No pudimos cargar los proyectos para vender"
          onRetry={() => Promise.all(queries.map((query) => query.refetch()))}
        />
      </div>
    );
  const loading = [assignmentsQuery, rulesQuery, profileQuery, details].some(
    (query) => query.isLoading,
  );
  const catalogLoading = catalog.isLoading || catalog.isSearchPending;
  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Proyectos para vender
        </h1>
        <p className="mt-2 text-muted-foreground">
          Elige un proyecto, solicita autorización y sigue cada oportunidad
          hasta la venta.
        </p>
      </header>
      <nav
        aria-label="Siguiente paso comercial"
        className="flex flex-wrap gap-2"
      >
        {nextSteps.map((step) => (
          <Button key={step.route} asChild variant="outline">
            <Link to={step.route}>{step.label}</Link>
          </Button>
        ))}
      </nav>
      {loading ? (
        <div role="status" aria-label="Cargando proyectos y solicitudes">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {approved.length} proyectos aprobados para vender ·{" "}
            {mine.filter((item) => item.status === "pending").length}{" "}
            solicitudes en revisión
          </p>
          <Tabs
            value={tab}
            onValueChange={(value) => updateParam("tab", value)}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger className="min-h-11" value="catalog">
                Buscar proyectos
              </TabsTrigger>
              <TabsTrigger className="min-h-11" value="mine">
                Mis solicitudes ({mine.length})
              </TabsTrigger>
              {incoming.length > 0 && (
                <TabsTrigger className="min-h-11" value="incoming">
                  Por aprobar ({incoming.length})
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="catalog" className="space-y-4">
              <div className="relative mt-4 max-w-lg">
                <Search
                  className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  aria-label="Buscar proyecto, comuna o región"
                  className="h-11 pl-9"
                  value={q}
                  onChange={(event) => updateParam("q", event.target.value)}
                  placeholder="Proyecto, comuna o región"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {catalogLoading
                  ? "Buscando proyectos…"
                  : `${projects.length} proyectos cargados. La búsqueda consulta el catálogo completo.`}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {catalogLoading && <Skeleton className="h-48 w-full" />}
                {!catalogLoading &&
                  projects.map((project) => {
                    const assignment = mine.find(
                      (item) => item.project_id === project.id,
                    );
                    const state = assignment
                      ? statuses[assignment.status]
                      : null;
                    return (
                      <Card key={project.id} className="overflow-hidden">
                        {project.images?.[0] && (
                          <img
                            src={project.images[0]}
                            alt={`Vista de ${project.name}`}
                            className="h-36 w-full object-cover"
                            loading="lazy"
                          />
                        )}
                        <CardContent className="space-y-3 p-4">
                          <h2 className="text-lg font-semibold">
                            {project.name}
                          </h2>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin
                              className="h-4 w-4 shrink-0"
                              aria-hidden="true"
                            />
                            {[project.city, project.region]
                              .filter(Boolean)
                              .join(", ") ||
                              project.location ||
                              "Ubicación por consultar"}
                          </p>
                          <p className="text-sm">{rateLabel(project.id)}</p>
                          <p className="text-xs text-muted-foreground">
                            Precios y disponibilidad en la ficha del proyecto.
                          </p>
                          {state && (
                            <>
                              <Badge variant="secondary">{state.label}</Badge>
                              <p className="text-sm text-muted-foreground">
                                {state.next}
                              </p>
                            </>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <Button asChild variant="outline">
                              <Link
                                to={
                                  assignment?.status === "approved"
                                    ? `/asesor/kit-venta/${encodeURIComponent(project.id)}`
                                    : projectPath(project)
                                }
                              >
                                {assignment?.status === "approved"
                                  ? "Abrir kit de venta"
                                  : "Ver ficha del proyecto"}
                              </Link>
                            </Button>
                            {(!assignment ||
                              assignment.status === "rejected" ||
                              assignment.status === "revoked") && (
                              <Button
                                disabled={request.isPending}
                                onClick={() =>
                                  request.mutate({ projectId: project.id })
                                }
                              >
                                {assignment
                                  ? "Solicitar nueva revisión"
                                  : "Solicitar venta"}
                              </Button>
                            )}
                            {assignment?.status === "approved" && (
                              <Button
                                aria-label={`Compartir ${project.name}`}
                                onClick={() => void share(project)}
                              >
                                <Share2
                                  className="mr-2 h-4 w-4"
                                  aria-hidden="true"
                                />
                                Compartir
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
              {!catalogLoading && !projects.length && (
                <Card>
                  <CardContent className="space-y-3 p-6">
                    <p>
                      {q
                        ? "No encontramos proyectos para esa búsqueda."
                        : "No hay proyectos disponibles para solicitar en este momento."}
                    </p>
                    {q && (
                      <Button
                        variant="outline"
                        onClick={() => updateParam("q", "")}
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
              {!catalogLoading && catalog.hasNextPage && (
                <Button
                  variant="outline"
                  disabled={catalog.isFetchingNextPage}
                  onClick={() => void catalog.fetchNextPage()}
                >
                  {catalog.isFetchingNextPage
                    ? "Cargando…"
                    : "Cargar más proyectos"}
                </Button>
              )}
            </TabsContent>
            <TabsContent value="mine" className="space-y-4">
              {!mine.length && (
                <Card>
                  <CardContent className="space-y-3 p-6">
                    <p>
                      Aún no tienes solicitudes. Elige un proyecto para
                      comenzar.
                    </p>
                    <Button onClick={() => updateParam("tab", "catalog")}>
                      Buscar proyectos
                    </Button>
                  </CardContent>
                </Card>
              )}
              {mine.map((assignment) => {
                const project = projectFor(assignment.project_id);
                return (
                  <Card key={assignment.id}>
                    <CardContent className="space-y-3 p-4">
                      <h2 className="text-lg font-semibold">
                        {project?.name ||
                          "Proyecto no disponible para consulta"}
                      </h2>
                      <Badge variant="secondary">
                        {statuses[assignment.status].label}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {statuses[assignment.status].next}
                      </p>
                      <p className="text-sm">
                        {rateLabel(assignment.project_id)}{" "}
                        {assignment.status === "approved" ? "" : "· sujeto a aprobación"}
                      </p>
                      {project && (
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline">
                            <Link
                              to={
                                assignment.status === "approved"
                                  ? `/asesor/kit-venta/${encodeURIComponent(project.id)}`
                                  : projectPath(project)
                              }
                            >
                              {assignment.status === "approved"
                                ? "Abrir kit de venta"
                                : "Ver ficha del proyecto"}
                            </Link>
                          </Button>
                          {assignment.status === "approved" && (
                            <Button onClick={() => void share(project)}>
                              Compartir enlace de venta
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
            <TabsContent value="incoming" className="space-y-4">
              {!incoming.length && (
                <p className="p-4 text-muted-foreground">
                  No tienes solicitudes pendientes de aprobación.
                </p>
              )}
              {incoming.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="space-y-3 p-4">
                    <h2 className="font-semibold">
                      {projectFor(assignment.project_id)?.name ||
                        "Proyecto no disponible para consulta"}
                    </h2>
                    <p>Condición comercial: {rateLabel(assignment.project_id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.message || "Sin mensaje adicional"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={decide.isPending}
                        onClick={() =>
                          decide.mutate({
                            id: assignment.id,
                            status: "approved",
                          })
                        }
                      >
                        Aprobar solicitud
                      </Button>
                      <Button
                        variant="outline"
                        disabled={decide.isPending}
                        onClick={() =>
                          decide.mutate({
                            id: assignment.id,
                            status: "rejected",
                          })
                        }
                      >
                        Rechazar solicitud
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
