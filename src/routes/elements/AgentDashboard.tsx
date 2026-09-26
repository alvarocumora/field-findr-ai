import { TeamActivityFeed } from "@/components/dashboard/TeamActivityFeed";
import ModulesHub from "@/components/dashboard/ModulesHub";
import { DashboardAsesor } from "@/pages/dashboard";
import DashboardInmobiliaria from "@/pages/dashboard/DashboardInmobiliaria";
import { useCurrentPlan } from "@/hooks/useSubscription";
import { PageLoader } from "../routeUtils";

/**
 * El dashboard del asesor depende del tipo de cuenta (plan):
 * inmobiliaria/grupo/enterprise → panel de agencia (ya incluye el feed de
 * actividad); el resto → vista de corredor + feed de actividad del equipo.
 * En ambos casos cierra con el índice de módulos del manifiesto.
 */
const AgentDashboard = () => {
  const { plan, isLoading } = useCurrentPlan();
  if (isLoading) return <PageLoader />;
  const isAgency = plan === "inmobiliaria" || plan === "grupo" || plan === "enterprise";

  return (
    <>
      {isAgency ? (
        <DashboardInmobiliaria />
      ) : (
        <>
          <DashboardAsesor />
          <div className="container pb-8">
            <TeamActivityFeed />
          </div>
        </>
      )}
      <div className="container pb-10">
        <ModulesHub area="agent" plan={plan ?? undefined} context="empresa" />
      </div>
    </>
  );
};

export default AgentDashboard;
