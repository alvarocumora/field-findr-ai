import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/theme/ThemeProvider";

// Auth Components
import ProtectedRoute from "./components/auth/ProtectedRoute";

// PWA Components
import OfflineIndicator from "./components/pwa/OfflineIndicator";
import InstallPrompt from "./components/pwa/InstallPrompt";

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Cargando...</div>
  </div>
);

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Tools from "./pages/Tools";
import Profile from "./pages/Profile";
import Explorar from "./pages/Explorar";
import PropertyDetail from "./pages/PropertyDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Install from "./pages/Install";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionFailure from "./pages/SubscriptionFailure";
import Subscription from "./pages/Subscription";
import AdminUsers from "./pages/AdminUsers";

// Dashboard pages (lazy loaded)
import { DashboardAdmin, DashboardAsesor, DashboardInmobiliaria } from "./pages/dashboard";

// Legacy Components (to be migrated)
import AIRecommendationEngine from "./components/AIRecommendationEngine";
import UrbanizationManagement from "./components/ProjectManagement";
import CRMSystem from "./components/CRMSystem";
import BusinessIntelligence from "./components/BusinessIntelligence";
import PropertyInventory from "./components/PropertyInventory";
import SalesManagement from "./components/SalesManagement";
import ParcelComparator from "./components/ParcelComparator";
import LandCalculators from "./components/LandCalculators";
import IntelligentSearch from "./components/IntelligentSearch";
import AgentManagement from "./components/AgentManagement";
import PricePredictor from "./components/PricePredictor";
import RiskAnalysis from "./components/RiskAnalysis";
import Dashboard from "./components/Dashboard";
import PublishProperty from "./components/PublishProperty";
import Favorites from "./components/Favorites";
import Alerts from "./components/Alerts";
import LotManagement from "./components/LotManagement";
import LeadManagement from "./components/LeadManagement";
import ProjectsManagement from "./components/ProjectsManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="ofertaterrenos-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/explorar" element={<Explorar />} />
              <Route path="/propiedad/:id" element={<PropertyDetail />} />
              <Route path="/proyecto/:id" element={<ProjectDetail />} />
              <Route path="/comparar" element={<ParcelComparator />} />
              <Route path="/instalar" element={<Install />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="/subscription/failure" element={<SubscriptionFailure />} />
              
              {/* Auth-only routes */}
              <Route path="/favorites" element={
                <ProtectedRoute requireAuth>
                  <Favorites />
                </ProtectedRoute>
              } />
              <Route path="/favoritos" element={
                <ProtectedRoute requireAuth>
                  <Favorites />
                </ProtectedRoute>
              } />
              <Route path="/alerts" element={
                <ProtectedRoute requireAuth>
                  <Alerts />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute requireAuth>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute requireAuth>
                  <Subscription />
                </ProtectedRoute>
              } />
              
              {/* Premium routes - require paid subscription */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireAuth requirePremium>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/inventory" element={
                <ProtectedRoute requireAuth requirePremium>
                  <PropertyInventory />
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute requireAuth requirePremium>
                  <LeadManagement />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute requireAuth requirePremium>
                  <BusinessIntelligence />
                </ProtectedRoute>
              } />
              <Route path="/crm" element={
                <ProtectedRoute requireAuth requirePremium>
                  <CRMSystem />
                </ProtectedRoute>
              } />
              <Route path="/sales" element={
                <ProtectedRoute requireAuth requirePremium>
                  <SalesManagement />
                </ProtectedRoute>
              } />
              <Route path="/projects" element={
                <ProtectedRoute requireAuth>
                  <ProjectsManagement />
                </ProtectedRoute>
              } />
              <Route path="/lots" element={
                <ProtectedRoute requireAuth requirePremium>
                  <LotManagement />
                </ProtectedRoute>
              } />
              <Route path="/urbanization" element={
                <ProtectedRoute requireAuth requirePremium>
                  <UrbanizationManagement />
                </ProtectedRoute>
              } />
              
              {/* Admin-only routes */}
              <Route path="/agents" element={
                <ProtectedRoute requireAuth requirePremium requireRole="admin">
                  <AgentManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requireAuth requireRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requireAuth requireRole="admin">
                  <Suspense fallback={<PageLoader />}>
                    <DashboardAdmin />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Agent dashboard */}
              <Route path="/asesor/dashboard" element={
                <ProtectedRoute requireAuth requireRole="agent">
                  <Suspense fallback={<PageLoader />}>
                    <DashboardAsesor />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Inmobiliaria dashboard (for agents managing teams) */}
              <Route path="/inmobiliaria/dashboard" element={
                <ProtectedRoute requireAuth requireRole="agent">
                  <Suspense fallback={<PageLoader />}>
                    <DashboardInmobiliaria />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Agent/Admin routes */}
              <Route path="/publish" element={
                <ProtectedRoute requireAuth requireRole="agent">
                  <PublishProperty />
                </ProtectedRoute>
              } />
              
              {/* Public tools */}
              <Route path="/search" element={<IntelligentSearch />} />
              <Route path="/compare" element={<ParcelComparator />} />
              <Route path="/calculators" element={<LandCalculators />} />
              <Route path="/price-predictor" element={<PricePredictor />} />
              <Route path="/risk-analysis" element={<RiskAnalysis />} />
              <Route path="/ai-recommendations" element={<AIRecommendationEngine />} />
              <Route path="/tools" element={<Tools />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          
          {/* PWA Components */}
          <OfflineIndicator />
          <InstallPrompt />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
