import { Suspense, lazy, type ReactNode } from "react";
import { Route } from "react-router-dom";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DashboardAdmin } from "@/pages/dashboard";
import { PageLoader } from "./routeUtils";

const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AgentManagement = lazy(() => import("@/components/AgentManagement"));
const PropertyApprovalQueue = lazy(() => import("@/components/admin/PropertyApprovalQueue"));
const ProjectApprovalQueue = lazy(() => import("@/components/admin/ProjectApprovalQueue"));
const DocumentCenter = lazy(() => import("@/components/admin/DocumentCenter"));
const AuditLog = lazy(() => import("@/pages/dashboard/AuditLog"));
const ReservationsManager = lazy(() => import("@/components/reservations/ReservationsManager"));
const CreditManager = lazy(() => import("@/components/credits/CreditManager"));
const BusinessIntelligence = lazy(() => import("@/components/BusinessIntelligence"));
const FinancialDashboard = lazy(() => import("@/pages/dashboard/FinancialDashboard"));
const ProjectsManagement = lazy(() => import("@/components/ProjectsManagement"));
const VisualScenariosAdmin = lazy(() => import("@/pages/admin/VisualScenariosAdmin"));
const FeaturedManager = lazy(() => import("@/pages/admin/FeaturedManager"));

const adminElement = (children: ReactNode) => (
  <DashboardLayout requiredRole="admin">
    {children}
  </DashboardLayout>
);

export const adminRoutes = [
  <Route
    key="admin-dashboard"
    path="/admin/dashboard"
    element={adminElement(
      <Suspense fallback={<PageLoader />}>
        <DashboardAdmin />
      </Suspense>
    )}
  />,
  <Route key="admin-users" path="/admin/users" element={adminElement(<AdminUsers />)} />,
  <Route key="admin-agents" path="/admin/agents" element={adminElement(<AgentManagement />)} />,
  <Route key="admin-reservations" path="/admin/reservations" element={adminElement(<ReservationsManager />)} />,
  <Route key="admin-approvals" path="/admin/approvals" element={adminElement(<PropertyApprovalQueue />)} />,
  <Route key="admin-project-approvals" path="/admin/project-approvals" element={adminElement(<ProjectApprovalQueue />)} />,
  <Route key="admin-credits" path="/admin/credits" element={adminElement(<CreditManager />)} />,
  <Route key="admin-analytics" path="/admin/analytics" element={adminElement(<BusinessIntelligence />)} />,
  <Route key="admin-financial" path="/admin/financial" element={adminElement(<FinancialDashboard />)} />,
  <Route key="admin-documents" path="/admin/documents" element={adminElement(<DocumentCenter />)} />,
  <Route key="admin-projects" path="/admin/projects" element={adminElement(<ProjectsManagement />)} />,
  <Route key="admin-visual-scenarios" path="/admin/visual-scenarios" element={adminElement(<VisualScenariosAdmin />)} />,
  <Route key="admin-featured" path="/admin/featured" element={adminElement(<FeaturedManager />)} />,
  <Route key="admin-audit" path="/admin/audit" element={adminElement(<AuditLog />)} />,
];
