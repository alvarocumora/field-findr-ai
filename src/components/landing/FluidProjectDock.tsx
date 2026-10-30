import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Compass, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShowcaseProjects } from "./useShowcaseProjects";

const useProjectsWithTour = (ids: string[]) =>
  useQuery({
    queryKey: ["landing-tour-projects", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_scenes" as never)
        .select("project_id")
        .in("project_id", ids);
      if (error) throw error;
      return new Set(
        ((data ?? []) as Array<{ project_id: string }>).map(
          (row) => row.project_id,
        ),
      );
    },
    staleTime: 5 * 60 * 1000,
  });

const FluidProjectDock = () => {
  const {
    data: projects = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useShowcaseProjects();
  const { data: tours } = useProjectsWithTour(
    projects.map((project) => project.id),
  );
  return (
    <section
      id="proyectos-en-venta"
      className="scroll-mt-20 py-10 sm:py-14 lg:py-16"
      aria-labelledby="opportunities-title"
    >
      <div className="container px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Elige tu próximo destino
            </p>
            <h2
              id="opportunities-title"
              className="mt-2 font-editorial text-3xl font-medium tracking-tight sm:text-4xl"
            >
              Un lugar que se parece a ti.
            </h2>
          </div>
          <Link
            to="/explorar"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-ring"
          >
            Ver catálogo completo{" "}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-7">
          {isLoading ? (
            <div
              role="status"
              aria-label="Cargando proyectos"
              className="grid gap-6 md:grid-cols-3"
            >
              {[0, 1, 2].map((id) => (
                <div
                  key={id}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          ) : isError || !projects.length ? (
            <div
              className="rounded-2xl border bg-card p-6"
              role={isError ? "alert" : undefined}
            >
              <p className="text-muted-foreground">
                {isError
                  ? "No pudimos cargar los proyectos en este momento."
                  : "Encuentra más opciones en el catálogo de terrenos."}
              </p>
              {isError && (
                <button
                  type="button"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                  className="mr-6 mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline focus-ring"
                >
                  Reintentar proyectos
                </button>
              )}
              <Link
                to="/explorar"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline focus-ring"
              >
                Ver terrenos en venta
              </Link>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => {
                const base = `/proyecto/${encodeURIComponent(project.id)}`;
                return (
                  <article key={project.id} className="group min-w-0">
                    <Link
                      to={`${base}?tab=lots`}
                      aria-label={`Ver parcelas de ${project.name}`}
                      className="block rounded-2xl focus-ring"
                    >
                      <div className="relative overflow-hidden rounded-2xl bg-muted">
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={`Vista de ${project.name}`}
                            loading="lazy"
                            width={640}
                            height={480}
                            className="aspect-[4/3] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                          />
                        ) : (
                          <div className="aspect-[4/3] grid-topo" />
                        )}
                        {project.inventoryReady &&
                          project.available !== null &&
                          project.available > 0 && (
                            <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium text-card-foreground">
                              {project.available}{" "}
                              {project.available === 1
                                ? "parcela disponible"
                                : "parcelas disponibles"}
                            </span>
                          )}
                        <span className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-card text-card-foreground">
                          <ArrowUpRight
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                      <p className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {[project.city, project.region]
                          .filter(Boolean)
                          .join(", ") || "Chile"}
                      </p>
                      <h3 className="mt-1 font-editorial text-2xl font-medium">
                        {project.name}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-primary">
                        {project.minPrice
                          ? `Desde $${project.minPrice.toLocaleString("es-CL")} CLP`
                          : "Precio a consultar"}
                      </p>
                    </Link>
                    <div className="mt-3 flex min-h-8 flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {!project.inventoryReady ? (
                        <span>Consulta disponibilidad</span>
                      ) : project.available === 0 ? (
                        <span>Sin parcelas disponibles</span>
                      ) : null}
                      {tours?.has(project.id) && (
                        <Link
                          to={`${base}?tab=tour360`}
                          className="inline-flex min-h-9 items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline focus-ring"
                        >
                          <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                          Tour 360
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
export default FluidProjectDock;
