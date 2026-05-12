import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth";
import { CompareProvider } from "./hooks/useCompare";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import OfflineIndicator from "./components/pwa/OfflineIndicator";
import InstallPrompt from "./components/pwa/InstallPrompt";
import AppRouter from "./routes/AppRouter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="ofertaterrenos-theme">
      <AuthProvider>
        <CompareProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRouter />
            <OfflineIndicator />
            <InstallPrompt />
          </TooltipProvider>
        </CompareProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
