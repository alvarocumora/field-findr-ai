import { Suspense, type ReactNode } from "react";
import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Tools from "@/pages/Tools";
import Profile from "@/pages/Profile";
import PublishProperty from "@/components/PublishProperty";
import PropertyInventory from "@/components/PropertyInventory";
import LeadManagement from "@/components/LeadManagement";
import ProjectsManagement from "@/components/ProjectsManagement";
import LotManagement from "@/components/LotManagement";
import CRMSystem from "@/components/CRMSystem";
import SalesManagement from "@/components/SalesManagement";
import BusinessIntelligence from "@/components/BusinessIntelligence";
import ReservationsManager from "@/components/reservations/ReservationsManager";
import CreditManager from "@/components/credits/CreditManager";
import ClosingManager from "@/components/closing/ClosingManager";
import EnterpriseSettings from "@/components/enterprise/EnterpriseSettings";
import ExecutiveDashboard from "@/pages/dashboard/ExecutiveDashboard";
import FinancialDashboard from "@/pages/dashboard/FinancialDashboard";
import AgentPerformance from "@/pages/dashboard/AgentPerformance";
import Messages from "@/pages/dashboard/Messages";
import SalesPipeline from "@/pages/dashboard/SalesPipeline";
import MultiProjectDashboard from "@/pages/dashboard/MultiProjectDashboard";
import PaymentManagement from "@/pages/dashboard/PaymentManagement";
import Reports from "@/pages/dashboard/Reports";
import NotificationCenter from "@/pages/NotificationCenter";
import DemandHeatmapDashboard from "@/pages/dashboard/DemandHeatmapDashboard";
import APIPortal from "@/pages/dashboard/APIPortal";
import LandOpportunities from "@/pages/dashboard/LandOpportunities";
import Contacts from "@/pages/dashboard/Contacts";
import OpportunityDetail from "@/pages/dashboard/OpportunityDetail";
import { DashboardAsesor } from "@/pages/dashboard";
import { PageLoader } from "./routeUtils";

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
        <DashboardAsesor />
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
