
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WizardHeaderProps {
  projectId: string;
  onResetProgress?: () => void;
  saving?: boolean;
}

export const WizardHeader = ({ projectId, onResetProgress, saving }: WizardHeaderProps) => {
  const navigate = useNavigate();

  const handleSaveAndExit = () => {
    // Progress is auto-saved, so we can just navigate away
    navigate(`/project/${projectId}/pages`);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project/${projectId}/pages`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pages
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoToDashboard}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAndExit}
            disabled={saving}
          >
            Save & Exit
          </Button>

          {onResetProgress && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Wizard Progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all wizard progress and start fresh. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onResetProgress}>
                    Reset Progress
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Take-off Wizard</h1>
        <p className="text-muted-foreground">
          AI-powered material takeoff for each framing component
        </p>
        {saving && (
          <p className="text-sm text-blue-600 mt-1">
            Progress saving automatically...
          </p>
        )}
      </div>
    </div>
  );
};
