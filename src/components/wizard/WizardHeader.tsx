
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WizardHeaderProps {
  projectId: string;
}

export const WizardHeader = ({ projectId }: WizardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8 flex items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/project/${projectId}/pages`)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Pages
      </Button>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Take-off Wizard</h1>
        <p className="text-muted-foreground">
          AI-powered material takeoff for each framing component
        </p>
      </div>
    </div>
  );
};
