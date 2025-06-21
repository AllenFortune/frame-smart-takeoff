
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProjectUpload from "./pages/ProjectUpload";
import ProjectPages from "./pages/ProjectPages";
import ProjectPreflight from "./pages/ProjectPreflight";
import ProjectSpecs from "./pages/ProjectSpecs";
import ProjectWizard from "./pages/ProjectWizard";
import ProjectReview from "./pages/ProjectReview";
import ProjectResults from "./pages/ProjectResults";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fing-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:id/upload" element={<ProjectUpload />} />
            <Route path="/project/:id/pages" element={<ProjectPages />} />
            <Route path="/project/:id/preflight" element={<ProjectPreflight />} />
            <Route path="/project/:id/specs" element={<ProjectSpecs />} />
            <Route path="/project/:id/wizard" element={<ProjectWizard />} />
            <Route path="/project/:id/review" element={<ProjectReview />} />
            <Route path="/project/:id/results" element={<ProjectResults />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
