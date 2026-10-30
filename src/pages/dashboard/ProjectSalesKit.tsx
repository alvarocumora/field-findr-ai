import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAccess } from "@/hooks/useAccess";
import { useMyBrokerProfile, useProjectAssignments } from "@/hooks/useBrokers";
import type { PublicLot } from "@/lib/lots/publicLotTypes";
import {
  canReservePublicLot,
  formatPublicLotPrice,
} from "@/lib/lots/publicLotCommercial";
import { salesMaterialUrl, reservationFormUrl } from "@/lib/projects/salesKit";
import { summarize } from "@/lib/pdf/projectKit";
import { withProjectScope } from "@/hooks/useWorkspaceScope";
import { ProjectSocialCopyGenerator } from "@/components/projects/ProjectSocialCopyGenerator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceLoadError } from "@/components/dashboard/WorkspaceLoadError";
import { toast } from "sonner";

export default function ProjectSalesKit() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const access = useAccess();
  const assignments = useProjectAssignments();
  const broker = useMyBrokerProfile();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const projectQuery = useQuery({
    queryKey: ["sales-kit-project", user?.id, projectId],
    enabled: !!user && !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,name,slug,user_id,status,organization_id,location,region")
        .eq("id", projectId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const project = projectQuery.data;
  const owner = !!project && project.user_id === user?.id;
  const assignment = assignments.data?.find(
    (item) =>
      item.project_id === projectId &&
      item.broker_id === user?.id &&
      item.status === "approved",
  );
  const member = !!project?.organization_id && project.organization_id === access.organization?.id && access.can('projects.read');
  const eligible = owner || member || !!assignment;
  const active = project?.status === "active";
  const stock = useQuery({
    queryKey: ["sales-kit-stock", user?.id, projectId],
    enabled: !!projectId && eligible && active,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
    queryFn: async () => {
      const rows: PublicLot[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase
          .rpc("get_public_lots", { p_project_id: projectId! })
          .order("id", { ascending: true })
          .range(offset, offset + 499);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 500) break;
      }
      return rows.sort((a, b) =>
        String(a.lot_number).localeCompare(String(b.lot_number), "es", {
          numeric: true,
        }),
      );
    },
  });
  const queries = [projectQuery, assignments, broker];
  if (queries.some((query) => query.error))
    return (
      <WorkspaceLoadError
        title="No pudimos cargar el kit de venta"
        onRetry={() => Promise.all(queries.map((query) => query.refetch()))}
      />
    );
  if (access.isLoading || queries.some((query) => query.isLoading))
    return (
      <Skeleton className="h-56 w-full" aria-label="Cargando kit de venta" />
    );
  if (!project)
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <h1 className="text-xl font-semibold">Proyecto no disponible</h1>
          <Link to="/asesor/proyectos-en-venta">
            Volver a proyectos para vender
          </Link>
        </CardContent>
      </Card>
    );
  if (!eligible)
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <h1 className="text-xl font-semibold">
            Necesitas una asignación aprobada
          </h1>
          <p>
            Solicita autorización para acceder al kit de venta de este proyecto.
          </p>
          <Button asChild>
            <Link to="/asesor/proyectos-en-venta?tab=mine">
              Revisar mis solicitudes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  if (!active)
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <h1 className="text-xl font-semibold">
            Proyecto no activo para venta
          </h1>
          <p>
            Confirma con el responsable antes de compartir material o solicitar
            una reserva.
          </p>
          <Link to="/asesor/proyectos-en-venta?tab=mine">
            Volver a mis solicitudes
          </Link>
        </CardContent>
      </Card>
    );
  const lots = stock.data ?? [];
  const stockSummary = summarize(lots);
  const filtered = lots.filter(
    (lot) =>
      (status === "all" || lot.status === status) &&
      (!search.trim() ||
        `${lot.lot_number} ${lot.name || ""}`
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase())),
  );
  const ref = broker.data?.invite_code;
  const material = [
    { tab: "info" as const, label: "Ficha del proyecto" },
    { tab: "brochure" as const, label: "Material y PDF" },
    { tab: "tour360" as const, label: "Recorrido del proyecto" },
    { tab: "lots" as const, label: "Parcelas y precios" },
  ];
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error(
        "No pudimos copiar. Selecciona el enlace del campo y cópialo manualmente.",
      );
    }
  };
  const labels: Record<string, string> = {
    available: "Disponible",
    reserved: "Reservado",
    sold: "Vendido",
  };
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          to="/asesor/proyectos-en-venta?tab=mine"
          className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
        >
          Volver a mis solicitudes
        </Link>
        <h1 className="text-3xl font-semibold">
          Kit de venta · {project.name}
        </h1>
        <p className="text-muted-foreground">
          Material comercial, comisión y parcelas del mismo proyecto.
        </p>
      </header>
      <nav
        aria-label="Gestión comercial del proyecto"
        className="flex flex-wrap gap-2"
      >
        {access.can("commissions.read") && access.hasFeature("commissions") && (
          <Button asChild variant="outline">
            <Link to={withProjectScope("/asesor/comisiones", project.id)}>
              Comisiones del proyecto
            </Link>
          </Button>
        )}
        {access.can("reservations.read") &&
          access.hasFeature("reservations") && (
            <Button asChild variant="outline">
              <Link to={withProjectScope("/asesor/reservations", project.id)}>
                Reservas y comprobantes
              </Link>
            </Button>
          )}
        {(owner || member) && access.can("inventory.write") && (
          <Button asChild variant="outline">
            <Link to={withProjectScope("/asesor/lots", project.id)}>
              Administrar inventario
            </Link>
          </Button>
        )}
      </nav>
      {assignment && (
        <p className="rounded-lg border p-4 text-sm">
          Comisión acordada: {assignment.commission_rate}%. El cobro depende de
          la operación registrada y su estado; compartir una ficha no acredita
          una comisión ganada.
        </p>
      )}
      {!ref && !owner && !member && (
        <p role="status" className="text-sm text-muted-foreground">
          Tu perfil no tiene código de referencia disponible. Estos enlaces no
          incluyen atribución de broker.
        </p>
      )}
      <section
        aria-label="Material para compartir"
        className="grid gap-4 sm:grid-cols-2"
      >
        {material.map((item) => {
          const url = salesMaterialUrl(project, item.tab, ref);
          return (
            <Card key={item.tab}>
              <CardContent className="space-y-3 p-4">
                <h2 className="font-semibold">{item.label}</h2>
                <Input
                  readOnly
                  aria-label={`Enlace de ${item.label}`}
                  value={url}
                  className="text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a href={url} aria-label={`Abrir ${item.label}`}>
                      Abrir
                    </a>
                  </Button>
                  <Button
                    aria-label={`Copiar ${item.label}`}
                    onClick={() => void copy(url)}
                  >
                    Copiar enlace
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <ProjectSocialCopyGenerator
        input={{
          projectName: project.name,
          location: project.location,
          region: project.region,
          priceFrom: stockSummary.priceMin,
          availableLots: stockSummary.available,
          brokerName: broker.data?.display_name,
        }}
        link={salesMaterialUrl(project, "info", ref)}
      />
      <section aria-label="Inventario para ventas" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Inventario de parcelas</h2>
          <Button
            variant="outline"
            disabled={stock.isFetching}
            onClick={() => void stock.refetch()}
          >
            Actualizar inventario
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Se actualiza cada 30 segundos mientras esta vista está abierta. La
          disponibilidad y condiciones se validan nuevamente al solicitar la
          reserva.
        </p>
        {stock.error ? (
          <WorkspaceLoadError
            title="No pudimos consultar el inventario"
            onRetry={stock.refetch}
          />
        ) : stock.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <Input
                aria-label="Buscar parcela por número o nombre"
                className="max-w-sm"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Número o nombre de parcela"
              />
              <select
                aria-label="Estado de la parcela"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-11 rounded-md border bg-background px-3"
              >
                <option value="all">Todos los estados</option>
                <option value="available">Disponibles</option>
                <option value="reserved">Reservados</option>
                <option value="sold">Vendidos</option>
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              {filtered.length} de {lots.length} parcelas ·{" "}
              {lots.filter((lot) => canReservePublicLot(lot)).length} con
              disponibilidad y precio para solicitar reserva
            </p>
            {!filtered.length && (
              <p className="rounded-lg border p-6">
                {lots.length
                  ? "No hay parcelas que coincidan con estos filtros."
                  : "No hay parcelas publicadas en este proyecto."}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((lot) => (
                <Card key={lot.id}>
                  <CardContent className="space-y-3 p-4">
                    <h3 className="font-semibold">
                      Parcela {lot.lot_number}
                      {lot.name ? ` · ${lot.name}` : ""}
                    </h3>
                    <p>
                      {labels[lot.status || ""] || "Estado por confirmar"} ·{" "}
                      {formatPublicLotPrice(lot.price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Number.isFinite(lot.area) && lot.area > 0
                        ? `${lot.area.toLocaleString("es-CL")} m²`
                        : "Superficie por confirmar"}
                    </p>
                    <Button asChild variant="outline">
                      <a href={salesMaterialUrl(project, "lots", ref, lot.id)}>
                        Ver ficha de parcela
                      </a>
                    </Button>
                    {canReservePublicLot(lot) && (
                      <>
                        <Button asChild>
                          <a href={reservationFormUrl(project, lot.id, ref)}>
                            Abrir formulario de reserva
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            void copy(reservationFormUrl(project, lot.id, ref))
                          }
                        >
                          Copiar formulario
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>
      <p className="text-sm text-muted-foreground">
        El formulario solicita los datos del comprador. Abrirlo no bloquea
        inventario ni acredita pago. El comprobante se genera desde una reserva
        registrada en Reservas y comprobantes.
      </p>
    </div>
  );
}
