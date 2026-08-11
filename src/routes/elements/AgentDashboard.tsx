import { TeamActivityFeed } from "@/components/dashboard/TeamActivityFeed";
import { DashboardAsesor } from "@/pages/dashboard";
import DashboardInmobiliaria from "@/pages/dashboard/DashboardInmobiliaria";
import { useCurrentPlan } from "@/hooks/useSubscription";
import { PageLoader } from "../routeUtils";

/**
 * El dashboard del asesor depende del tipo de cuenta (plan):
 * inmobiliaria/grupo/enterprise → panel de agencia (ya incluye el feed de
 * actividad); el resto → vista de corredor + feed de actividad del equipo.
 */
const AgentDashboard = () => {
  const { plan, isLoading } = useCurrentPlan();
  if (isLoading) return <PageLoader />;
  const isAgency = plan === "inmobiliaria" || plan === "grupo" || plan === "enterprise";
  if (isAgency) return <DashboardInmobiliaria />;
  return (
    <>
      <DashboardAsesor />
      <div className="container pb-8">
        <TeamActivityFeed />
      </div>
    </>
  );
};

export default AgentDashboard;
