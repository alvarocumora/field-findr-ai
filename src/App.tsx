import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./components/theme/ThemeProvider";

// PWA Components
import OfflineIndicator from "./components/pwa/OfflineIndicator";
import InstallPrompt from "./components/pwa/InstallPrompt";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Tools from "./pages/Tools";
import Profile from "./pages/Profile";
import Explorar from "./pages/Explorar";
import PropertyDetail from "./pages/PropertyDetail";
import Install from "./pages/Install";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionFailure from "./pages/SubscriptionFailure";

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
              <Route path="/comparar" element={<ParcelComparator />} />
              <Route path="/instalar" element={<Install />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="/subscription/failure" element={<SubscriptionFailure />} />
              
              {/* Legacy routes - to be migrated */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<IntelligentSearch />} />
              <Route path="/compare" element={<ParcelComparator />} />
              <Route path="/calculators" element={<LandCalculators />} />
              <Route path="/price-predictor" element={<PricePredictor />} />
              <Route path="/risk-analysis" element={<RiskAnalysis />} />
              <Route path="/ai-recommendations" element={<AIRecommendationEngine />} />
              <Route path="/publish" element={<PublishProperty />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/favoritos" element={<Favorites />} />
              <Route path="/alerts" element={<Alerts />} />
              {/* Land Development Administration Routes */}
              <Route path="/urbanization" element={<UrbanizationManagement />} />
              <Route path="/crm" element={<CRMSystem />} />
              <Route path="/analytics" element={<BusinessIntelligence />} />
              <Route path="/inventory" element={<PropertyInventory />} />
              <Route path="/sales" element={<SalesManagement />} />
              <Route path="/agents" element={<AgentManagement />} />
              {/* Loteo Management Routes */}
              <Route path="/lots" element={<LotManagement />} />
              <Route path="/leads" element={<LeadManagement />} />
              <Route path="/projects" element={<ProjectsManagement />} />
              <Route path="/profile" element={<Profile />} />
              {/* New Tools Page */}
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
