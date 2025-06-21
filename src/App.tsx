
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProjectUpload from "./pages/ProjectUpload";
import ProjectWizard from "./pages/ProjectWizard";
import ProjectPreflight from "./pages/ProjectPreflight";
import ProjectReview from "./pages/ProjectReview";
import ProjectResults from "./pages/ProjectResults";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fing-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/project/:id/upload" element={
                <ProtectedRoute>
                  <ProjectUpload />
                </ProtectedRoute>
              } />
              <Route path="/project/:id/preflight" element={
                <ProtectedRoute>
                  <ProjectPreflight />
                </ProtectedRoute>
              } />
              {/* Redirect old pages route to wizard */}
              <Route path="/project/:id/pages" element={
                <Navigate to="/project/:id/wizard" replace />
              } />
              <Route path="/project/:id/wizard" element={
                <ProtectedRoute>
                  <ProjectWizard />
                </ProtectedRoute>
              } />
              <Route path="/project/:id/review" element={
                <ProtectedRoute>
                  <ProjectReview />
                </ProtectedRoute>
              } />
              <Route path="/project/:id/results" element={
                <ProtectedRoute>
                  <ProjectResults />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
