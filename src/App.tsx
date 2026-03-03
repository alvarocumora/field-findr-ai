import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { CompareProvider } from "./hooks/useCompare";
import { ThemeProvider } from "./components/theme/ThemeProvider";

// Auth Components
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Layouts
import DashboardLayout from "./components/layouts/DashboardLayout";

// PWA Components
import OfflineIndicator from "./components/pwa/OfflineIndicator";
import InstallPrompt from "./components/pwa/InstallPrompt";

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Cargando...</div>
  </div>
);

// ===== Public Pages =====
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Tools from "./pages/Tools";
import Explorar from "./pages/Explorar";
import PropertyDetail from "./pages/PropertyDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Install from "./pages/Install";
import Pricing from "./pages/Pricing";
import Referrals from "./pages/Referrals";
import IntelligentSearch from "./components/IntelligentSearch";
import RegionLanding from "./pages/RegionLanding";
import CountryLanding from "./pages/CountryLanding";
import CityLanding from "./pages/CityLanding";
import Contact from "./pages/Contact";
import Comparar from "./pages/Comparar";
import Alertas from "./pages/Alertas";

// ===== Buyer Pages =====
import Profile from "./pages/Profile";
import MiTerreno from "./pages/MiTerreno";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionFailure from "./pages/SubscriptionFailure";
import Favorites from "./components/Favorites";

// ===== Reservation Pages =====
import ReservationSuccess from "./pages/ReservationSuccess";
import ReservationError from "./pages/ReservationError";
import ReservationPending from "./pages/ReservationPending";

// ===== Agent Pages =====
import PublishProperty from "./components/PublishProperty";
import PropertyInventory from "./components/PropertyInventory";
import LeadManagement from "./components/LeadManagement";
import ProjectsManagement from "./components/ProjectsManagement";
import LotManagement from "./components/LotManagement";
import CRMSystem from "./components/CRMSystem";
import SalesManagement from "./components/SalesManagement";
import BusinessIntelligence from "./components/BusinessIntelligence";
import ReservationsManager from "./components/reservations/ReservationsManager";
import CreditManager from "./components/credits/CreditManager";
import ClosingManager from "./components/closing/ClosingManager";
import EnterpriseSettings from "./components/enterprise/EnterpriseSettings";
import ExecutiveDashboard from "./pages/dashboard/ExecutiveDashboard";
import FinancialDashboard from "./pages/dashboard/FinancialDashboard";
import AgentPerformance from "./pages/dashboard/AgentPerformance";
import Messages from "./pages/dashboard/Messages";
// ===== Admin Pages =====
import AdminUsers from "./pages/AdminUsers";
import AgentManagement from "./components/AgentManagement";
import PropertyApprovalQueue from "./components/admin/PropertyApprovalQueue";

// ===== Dashboard Pages (lazy) =====
import { DashboardAdmin, DashboardAsesor, DashboardInmobiliaria } from "./pages/dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="ofertaterrenos-theme">
      <AuthProvider>
        <CompareProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* ====== PUBLIC ROUTES ====== */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route path="/propiedad/:id" element={<PropertyDetail />} />
              <Route path="/proyecto/:id" element={<ProjectDetail />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/search" element={<IntelligentSearch />} />
              <Route path="/instalar" element={<Install />} />
              <Route path="/referidos" element={<Referrals />} />
              <Route path="/region/:slug" element={<RegionLanding />} />
              <Route path="/pais/:code" element={<CountryLanding />} />
              <Route path="/ciudad/:slug" element={<CityLanding />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/comparar" element={<Comparar />} />
              <Route path="/alertas" element={<Alertas />} />

              {/* Subscription result pages */}
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="/subscription/failure" element={<SubscriptionFailure />} />

              {/* Reservation result pages */}
              <Route path="/reserva/exito" element={<ReservationSuccess />} />
              <Route path="/reserva/error" element={<ReservationError />} />
              <Route path="/reserva/pendiente" element={<ReservationPending />} />

              {/* ====== BUYER ROUTES (auth required) ====== */}
              <Route path="/favoritos" element={
                <ProtectedRoute requireAuth><Favorites /></ProtectedRoute>
              } />
              <Route path="/mi-terreno" element={
                <ProtectedRoute requireAuth><MiTerreno /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute requireAuth><Profile /></ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute requireAuth><Subscription /></ProtectedRoute>
              } />

              {/* ====== AGENT ROUTES (/asesor/*) ====== */}
              <Route path="/asesor/dashboard" element={
                <DashboardLayout requiredRole="agent">
                  <Suspense fallback={<PageLoader />}>
                    <DashboardAsesor />
                  </Suspense>
                </DashboardLayout>
              } />
              <Route path="/asesor/listings" element={
                <DashboardLayout requiredRole="agent">
                  <PropertyInventory />
                </DashboardLayout>
              } />
              <Route path="/asesor/leads" element={
                <DashboardLayout requiredRole="agent">
                  <LeadManagement />
                </DashboardLayout>
              } />
              <Route path="/asesor/projects" element={
                <DashboardLayout requiredRole="agent">
                  <ProjectsManagement />
                </DashboardLayout>
              } />
              <Route path="/asesor/lots" element={
                <DashboardLayout requiredRole="agent">
                  <LotManagement />
                </DashboardLayout>
              } />
              <Route path="/asesor/analytics" element={
                <DashboardLayout requiredRole="agent">
                  <BusinessIntelligence />
                </DashboardLayout>
              } />
              <Route path="/asesor/crm" element={
                <DashboardLayout requiredRole="agent">
                  <CRMSystem />
                </DashboardLayout>
              } />
              <Route path="/asesor/sales" element={
                <DashboardLayout requiredRole="agent">
                  <SalesManagement />
                </DashboardLayout>
              } />
              <Route path="/asesor/reservations" element={
                <DashboardLayout requiredRole="agent">
                  <ReservationsManager />
                </DashboardLayout>
              } />
              <Route path="/asesor/credits" element={
                <DashboardLayout requiredRole="agent">
                  <CreditManager />
                </DashboardLayout>
              } />
              <Route path="/asesor/closing" element={
                <DashboardLayout requiredRole="agent">
                  <ClosingManager />
                </DashboardLayout>
              } />
              <Route path="/asesor/messages" element={
                <DashboardLayout requiredRole="agent">
                  <Messages />
                </DashboardLayout>
              } />
              <Route path="/asesor/enterprise" element={
                <DashboardLayout requiredRole="agent">
                  <EnterpriseSettings />
                </DashboardLayout>
              } />
              <Route path="/asesor/executive" element={
                <DashboardLayout requiredRole="agent">
                  <ExecutiveDashboard />
                </DashboardLayout>
              } />
              <Route path="/asesor/financial" element={
                <DashboardLayout requiredRole="agent">
                  <FinancialDashboard />
                </DashboardLayout>
              } />
              <Route path="/asesor/performance" element={
                <DashboardLayout requiredRole="agent">
                  <AgentPerformance />
                </DashboardLayout>
              } />
              <Route path="/publish" element={
                <ProtectedRoute requireAuth requireRole="agent">
                  <PublishProperty />
                </ProtectedRoute>
              } />

              {/* ====== ADMIN ROUTES (/admin/*) ====== */}
              <Route path="/admin/dashboard" element={
                <DashboardLayout requiredRole="admin">
                  <Suspense fallback={<PageLoader />}>
                    <DashboardAdmin />
                  </Suspense>
                </DashboardLayout>
              } />
              <Route path="/admin/users" element={
                <DashboardLayout requiredRole="admin">
                  <AdminUsers />
                </DashboardLayout>
              } />
              <Route path="/admin/agents" element={
                <DashboardLayout requiredRole="admin">
                  <AgentManagement />
                </DashboardLayout>
              } />
              <Route path="/admin/reservations" element={
                <DashboardLayout requiredRole="admin">
                  <ReservationsManager />
                </DashboardLayout>
              } />
              <Route path="/admin/approvals" element={
                <DashboardLayout requiredRole="admin">
                  <PropertyApprovalQueue />
                </DashboardLayout>
              } />
              <Route path="/admin/credits" element={
                <DashboardLayout requiredRole="admin">
                  <CreditManager />
                </DashboardLayout>
              } />
              <Route path="/admin/analytics" element={
                <DashboardLayout requiredRole="admin">
                  <BusinessIntelligence />
                </DashboardLayout>
              } />
              <Route path="/admin/financial" element={
                <DashboardLayout requiredRole="admin">
                  <FinancialDashboard />
                </DashboardLayout>
              } />

              {/* ====== LEGACY REDIRECTS ====== */}
              <Route path="/favorites" element={<Navigate to="/favoritos" replace />} />
              <Route path="/dashboard" element={<Navigate to="/asesor/dashboard" replace />} />
              <Route path="/inventory" element={<Navigate to="/asesor/listings" replace />} />
              <Route path="/leads" element={<Navigate to="/asesor/leads" replace />} />
              <Route path="/projects" element={<Navigate to="/asesor/projects" replace />} />
              <Route path="/lots" element={<Navigate to="/asesor/lots" replace />} />
              <Route path="/analytics" element={<Navigate to="/asesor/analytics" replace />} />
              <Route path="/crm" element={<Navigate to="/asesor/crm" replace />} />
              <Route path="/sales" element={<Navigate to="/asesor/sales" replace />} />
              <Route path="/agents" element={<Navigate to="/admin/agents" replace />} />
              <Route path="/compare" element={<Navigate to="/comparar" replace />} />
              <Route path="/calculators" element={<Navigate to="/tools" replace />} />
              <Route path="/price-predictor" element={<Navigate to="/tools" replace />} />
              <Route path="/risk-analysis" element={<Navigate to="/tools" replace />} />
              <Route path="/ai-recommendations" element={<Navigate to="/tools" replace />} />
              <Route path="/urbanization" element={<Navigate to="/asesor/projects" replace />} />

              {/* ====== CATCH-ALL ====== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>

          {/* PWA Components */}
          <OfflineIndicator />
          <InstallPrompt />
        </TooltipProvider>
        </CompareProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
