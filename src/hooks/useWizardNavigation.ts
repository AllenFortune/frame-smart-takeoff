
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useWizardProgress } from "@/hooks/useWizardProgress";

export const useWizardNavigation = (
  projectId: string,
  moveToNextStep: () => boolean,
  moveToPreviousStep: () => boolean,
  canNavigateToStep: (stepId: string) => boolean,
  setActiveStep: (stepId: string) => void
) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetProgress } = useWizardProgress(projectId);

  const handleAcceptAndNext = () => {
    const isComplete = moveToNextStep();
    
    if (isComplete) {
      navigate(`/project/${projectId}/review`);
    }
  };

  const handlePreviousStep = () => {
    moveToPreviousStep();
  };

  const handleResetProgress = async () => {
    try {
      await resetProgress();
      
      toast({
        title: "Progress Reset",
        description: "Wizard progress has been reset. You can start fresh."
      });
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStepChange = (stepId: string) => {
    if (canNavigateToStep(stepId)) {
      setActiveStep(stepId);
    } else {
      toast({
        title: "Cannot Navigate",
        description: "Complete the current step before proceeding.",
        variant: "destructive"
      });
    }
  };

  return {
    handleAcceptAndNext,
    handlePreviousStep,
    handleResetProgress,
    handleStepChange
  };
};
