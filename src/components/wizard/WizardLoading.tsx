
import { AppNavbar } from "@/components/AppNavbar";

export const WizardLoading = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading wizard progress...</p>
        </div>
      </div>
    </div>
  );
};
