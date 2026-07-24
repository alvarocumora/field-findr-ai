import { Suspense, lazy, type ReactNode } from "react";
import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { TeamActivityFeed } from "@/components/dashboard/TeamActivityFeed";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DashboardAsesor } from "@/pages/dashboard";
import { useCurrentPlan } from "@/hooks/useSubscription";
import { PageLoader } from "./routeUtils";

const DashboardInmobiliaria = lazy(() => import("@/pages/dashboard/DashboardInmobiliaria"));

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

const Tools = lazy(() => import("@/pages/Tools"));
const Profile = lazy(() => import("@/pages/Profile"));
const PublishProperty = lazy(() => import("@/components/PublishProperty"));
const PropertyInventory = lazy(() => import("@/components/PropertyInventory"));
const LeadManagement = lazy(() => import("@/components/LeadManagement"));
const ProjectsManagement = lazy(() => import("@/components/ProjectsManagement"));
const LotManagement = lazy(() => import("@/components/LotManagement"));
const CRMSystem = lazy(() => import("@/components/CRMSystem"));
const SalesManagement = lazy(() => import("@/components/SalesManagement"));
const BusinessIntelligence = lazy(() => import("@/components/BusinessIntelligence"));
const ReservationsManager = lazy(() => import("@/components/reservations/ReservationsManager"));
const CreditManager = lazy(() => import("@/components/credits/CreditManager"));
const ClosingManager = lazy(() => import("@/components/closing/ClosingManager"));
const EnterpriseSettings = lazy(() => import("@/components/enterprise/EnterpriseSettings"));
const ExecutiveDashboard = lazy(() => import("@/pages/dashboard/ExecutiveDashboard"));
const FinancialDashboard = lazy(() => import("@/pages/dashboard/FinancialDashboard"));
const AgentPerformance = lazy(() => import("@/pages/dashboard/AgentPerformance"));
const Messages = lazy(() => import("@/pages/dashboard/Messages"));
const SalesPipeline = lazy(() => import("@/pages/dashboard/SalesPipeline"));
const MultiProjectDashboard = lazy(() => import("@/pages/dashboard/MultiProjectDashboard"));
const PaymentManagement = lazy(() => import("@/pages/dashboard/PaymentManagement"));
const Reports = lazy(() => import("@/pages/dashboard/Reports"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const DemandHeatmapDashboard = lazy(() => import("@/pages/dashboard/DemandHeatmapDashboard"));
const APIPortal = lazy(() => import("@/pages/dashboard/APIPortal"));
const LandOpportunities = lazy(() => import("@/pages/dashboard/LandOpportunities"));
const Contacts = lazy(() => import("@/pages/dashboard/Contacts"));
const OpportunityDetail = lazy(() => import("@/pages/dashboard/OpportunityDetail"));
const LoteoControlCenter = lazy(() => import("@/pages/dashboard/LoteoControlCenter"));
const SubdivisionStudio = lazy(() => import("@/pages/dashboard/SubdivisionStudio"));
const Commissions = lazy(() => import("@/pages/dashboard/Commissions"));
const TeamManagement = lazy(() => import("@/pages/dashboard/TeamManagement"));
const MyCaptaciones = lazy(() => import("@/pages/dashboard/MyCaptaciones"));

const agentElement = (children: ReactNode) => (
  <DashboardLayout requiredRole="agent">
    {children}
  </DashboardLayout>
);

export const agentRoutes = [
  <Route
    key="asesor-dashboard"
    path="/asesor/dashboard"
    element={agentElement(
      <Suspense fallback={<PageLoader />}>
        <AgentDashboard />
      </Suspense>
    )}
  />,
  <Route key="asesor-opportunities" path="/asesor/opportunities" element={agentElement(<LandOpportunities />)} />,
  <Route key="asesor-opportunity" path="/asesor/opportunity/:id" element={agentElement(<OpportunityDetail />)} />,
  <Route key="asesor-contacts" path="/asesor/contacts" element={agentElement(<Contacts />)} />,
  <Route key="asesor-listings" path="/asesor/listings" element={agentElement(<PropertyInventory />)} />,
  <Route key="asesor-leads" path="/asesor/leads" element={agentElement(<LeadManagement />)} />,
  <Route key="asesor-projects" path="/asesor/projects" element={agentElement(<ProjectsManagement />)} />,
  <Route key="asesor-lots" path="/asesor/lots" element={agentElement(<LotManagement />)} />,
  <Route key="asesor-loteos" path="/asesor/loteos" element={agentElement(<LoteoControlCenter />)} />,
  <Route key="asesor-subdivision" path="/asesor/subdivision" element={agentElement(<SubdivisionStudio />)} />,
  <Route key="asesor-analytics" path="/asesor/analytics" element={agentElement(<BusinessIntelligence />)} />,
  <Route key="asesor-crm" path="/asesor/crm" element={agentElement(<CRMSystem />)} />,
  <Route key="asesor-sales" path="/asesor/sales" element={agentElement(<SalesManagement />)} />,
  <Route key="asesor-reservations" path="/asesor/reservations" element={agentElement(<ReservationsManager />)} />,
  <Route key="asesor-credits" path="/asesor/credits" element={agentElement(<CreditManager />)} />,
  <Route key="asesor-closing" path="/asesor/closing" element={agentElement(<ClosingManager />)} />,
  <Route key="asesor-messages" path="/asesor/messages" element={agentElement(<Messages />)} />,
  <Route key="asesor-enterprise" path="/asesor/enterprise" element={agentElement(<EnterpriseSettings />)} />,
  <Route key="asesor-executive" path="/asesor/executive" element={agentElement(<ExecutiveDashboard />)} />,
  <Route key="asesor-financial" path="/asesor/financial" element={agentElement(<FinancialDashboard />)} />,
  <Route key="asesor-performance" path="/asesor/performance" element={agentElement(<AgentPerformance />)} />,
  <Route key="asesor-comisiones" path="/asesor/comisiones" element={agentElement(<Commissions />)} />,
  <Route key="asesor-team" path="/asesor/team" element={agentElement(<TeamManagement />)} />,
  <Route key="asesor-captaciones" path="/asesor/captaciones" element={agentElement(<MyCaptaciones />)} />,
  <Route key="asesor-pipeline" path="/asesor/pipeline" element={agentElement(<SalesPipeline />)} />,
  <Route key="asesor-multi-project" path="/asesor/multi-project" element={agentElement(<MultiProjectDashboard />)} />,
  <Route key="asesor-payments" path="/asesor/payments" element={agentElement(<PaymentManagement />)} />,
  <Route key="asesor-reports" path="/asesor/reports" element={agentElement(<Reports />)} />,
  <Route key="asesor-notifications" path="/asesor/notifications" element={agentElement(<NotificationCenter />)} />,
  <Route key="asesor-demand" path="/asesor/demand" element={agentElement(<DemandHeatmapDashboard />)} />,
  <Route key="asesor-api" path="/asesor/api" element={agentElement(<APIPortal />)} />,
  <Route key="asesor-tools" path="/asesor/tools" element={agentElement(<Tools />)} />,
  <Route key="asesor-profile" path="/asesor/profile" element={agentElement(<Profile />)} />,
  <Route
    key="publish"
    path="/publish"
    element={
      <ProtectedRoute requireAuth requireRole="agent">
        <PublishProperty />
      </ProtectedRoute>
    }
  />,
];
