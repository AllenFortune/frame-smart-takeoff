
import { Button } from "@/components/ui/button";
import { Plus, WifiOff } from "lucide-react";

interface DashboardHeaderProps {
  onNewProject: () => void;
  creating: boolean;
  isOnline: boolean;
}

export const DashboardHeader = ({ onNewProject, creating, isOnline }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Your Projects</h1>
        <p className="text-muted-foreground mt-2">
          Manage your framing estimates and takeoffs
        </p>
      </div>
      <div className="flex items-center gap-4">
        {!isOnline && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <WifiOff className="w-4 h-4" />
            Offline
          </div>
        )}
        <Button
          onClick={onNewProject}
          disabled={creating || !isOnline}
          className="rounded-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {creating ? "Creating..." : "New Project"}
        </Button>
      </div>
    </div>
  );
};
