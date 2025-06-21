
import { Button } from "@/components/ui/button";
import { FolderOpen, Plus } from "lucide-react";

interface EmptyStateProps {
  onNewProject: () => void;
  creating: boolean;
  isOnline: boolean;
}

export const EmptyState = ({ onNewProject, creating, isOnline }: EmptyStateProps) => {
  return (
    <div className="text-center py-12">
      <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
      <p className="text-muted-foreground mb-6">
        Create your first framing estimate to get started
      </p>
      <Button
        onClick={onNewProject}
        disabled={creating || !isOnline}
        className="rounded-full bg-primary hover:bg-primary/90"
      >
        <Plus className="w-5 h-5 mr-2" />
        {creating ? "Creating..." : "Create First Project"}
      </Button>
    </div>
  );
};
