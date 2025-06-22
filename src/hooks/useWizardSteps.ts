
import { useEffect } from "react";
import { PlanOverlay } from "@/hooks/useProjectData";
import { useWizardProgress } from "@/hooks/useWizardProgress";
import { useStepPersistence } from "./wizardSteps/useStepPersistence";
import { useStepState } from "./wizardSteps/useStepState";
import { useStepNavigation } from "./wizardSteps/useStepNavigation";

export type { StepData } from "./wizardSteps/types";

export const useWizardSteps = (projectId: string, overlays: PlanOverlay[]) => {
  const { saving } = useWizardProgress(projectId);
  const { 
    debouncedSave, 
    saveImmediately, 
    isLoadingFromDatabase, 
    cleanup 
  } = useStepPersistence(projectId);

  const {
    steps,
    activeStep,
    setActiveStep: setActiveStepState,
    stepActions,
    progressLoading
  } = useStepState(projectId, overlays, debouncedSave, saveImmediately, isLoadingFromDatabase);

  const {
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep
  } = useStepNavigation(steps, activeStep, setActiveStepState, saveImmediately, isLoadingFromDatabase);

  const setActiveStep = (stepId: string) => {
    if (canNavigateToStep(stepId)) {
      setActiveStepState(stepId);
      if (!isLoadingFromDatabase.current) {
        saveImmediately(stepId, steps);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    steps,
    activeStep,
    saving,
    progressLoading,
    setActiveStep,
    ...stepActions,
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep
  };
};
