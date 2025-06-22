
import { useCallback } from "react";
import { StepData } from "./types";

export const useStepNavigation = (
  steps: StepData[],
  activeStep: string,
  setActiveStep: (step: string) => void,
  saveImmediately: (activeStep: string, steps: StepData[]) => void,
  isLoadingFromDatabase: React.MutableRefObject<boolean>
) => {
  const moveToNextStep = useCallback(() => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const nextStep = steps[currentStepIndex + 1];
    
    if (nextStep) {
      setActiveStep(nextStep.id);
      if (!isLoadingFromDatabase.current) {
        saveImmediately(nextStep.id, steps);
      }
      return false; // Not complete
    }
    return true; // All steps complete
  }, [steps, activeStep, setActiveStep, saveImmediately, isLoadingFromDatabase]);

  const moveToPreviousStep = useCallback(() => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const previousStep = steps[currentStepIndex - 1];
    
    if (previousStep) {
      setActiveStep(previousStep.id);
      if (!isLoadingFromDatabase.current) {
        saveImmediately(previousStep.id, steps);
      }
      return true; // Successfully moved back
    }
    return false; // Already at first step
  }, [steps, activeStep, setActiveStep, saveImmediately, isLoadingFromDatabase]);

  const canNavigateToStep = useCallback((stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    
    return stepIndex <= currentIndex || 
           (stepIndex === currentIndex + 1 && steps[currentIndex].status === 'complete');
  }, [steps, activeStep]);

  return {
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep
  };
};
