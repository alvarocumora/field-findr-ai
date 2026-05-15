import { Suspense, type ReactNode } from "react";
import { Route } from "react-router-dom";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import AdminUsers from "@/pages/AdminUsers";
import AgentManagement from "@/components/AgentManagement";
import PropertyApprovalQueue from "@/components/admin/PropertyApprovalQueue";
import DocumentCenter from "@/components/admin/DocumentCenter";
import AuditLog from "@/pages/dashboard/AuditLog";
import ReservationsManager from "@/components/reservations/ReservationsManager";
import CreditManager from "@/components/credits/CreditManager";
import BusinessIntelligence from "@/components/BusinessIntelligence";
import FinancialDashboard from "@/pages/dashboard/FinancialDashboard";
import ProjectsManagement from "@/components/ProjectsManagement";
import VisualScenariosAdmin from "@/pages/admin/VisualScenariosAdmin";
import { DashboardAdmin } from "@/pages/dashboard";
import { PageLoader } from "./routeUtils";

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
  <Route key="admin-credits" path="/admin/credits" element={adminElement(<CreditManager />)} />,
  <Route key="admin-analytics" path="/admin/analytics" element={adminElement(<BusinessIntelligence />)} />,
  <Route key="admin-financial" path="/admin/financial" element={adminElement(<FinancialDashboard />)} />,
  <Route key="admin-documents" path="/admin/documents" element={adminElement(<DocumentCenter />)} />,
  <Route key="admin-projects" path="/admin/projects" element={adminElement(<ProjectsManagement />)} />,
  <Route key="admin-visual-scenarios" path="/admin/visual-scenarios" element={adminElement(<VisualScenariosAdmin />)} />,
  <Route key="admin-audit" path="/admin/audit" element={adminElement(<AuditLog />)} />,
];
