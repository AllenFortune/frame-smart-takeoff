
import { useEffect } from "react";
import { PlanOverlay } from "@/hooks/useProjectData";
import { useWizardProgress } from "@/hooks/useWizardProgress";
import { useEnhancedStepPersistence } from "./enhancedWizardSteps/useEnhancedStepPersistence";
import { useEnhancedStepState } from "./enhancedWizardSteps/useEnhancedStepState";
import { useEnhancedStepNavigation } from "./enhancedWizardSteps/useEnhancedStepNavigation";

export type { EnhancedStepData } from "./enhancedWizardSteps/types";

export const useEnhancedWizardSteps = (projectId: string, overlays: PlanOverlay[], selectedState?: string) => {
  const { saving } = useWizardProgress(projectId);
  const { 
    debouncedSave, 
    saveImmediately, 
    isLoadingFromDatabase, 
    cleanup 
  } = useEnhancedStepPersistence(projectId);

  const {
    steps,
    activeStep,
    setActiveStep: setActiveStepState,
    stepActions,
    progressLoading
  } = useEnhancedStepState(projectId, overlays, selectedState, debouncedSave, saveImmediately, isLoadingFromDatabase);

  const {
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep
  } = useEnhancedStepNavigation(steps, activeStep, setActiveStepState, saveImmediately, isLoadingFromDatabase);

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
