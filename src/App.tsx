import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import IdentityQueryBoundary from "./components/auth/IdentityQueryBoundary";
import { AuthProvider } from "./hooks/useAuth";
import { CompareProvider } from "./hooks/useCompare";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import OfflineIndicator from "./components/pwa/OfflineIndicator";
import InstallPrompt from "./components/pwa/InstallPrompt";
import AppRouter from "./routes/AppRouter";

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="ofertaterrenos-theme">
    <AuthProvider>
      <IdentityQueryBoundary>
        <CompareProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRouter />
            <OfflineIndicator />
            <InstallPrompt />
          </TooltipProvider>
        </CompareProvider>
      </IdentityQueryBoundary>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
