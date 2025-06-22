
import { useRef, useCallback } from "react";
import { EnhancedStepData } from "./types";
import { useWizardProgress } from "@/hooks/useWizardProgress";

export const useEnhancedStepPersistence = (projectId: string) => {
  const { saveProgress } = useWizardProgress(projectId);
  const isLoadingFromDatabase = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSave = useCallback((activeStep: string, steps: EnhancedStepData[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (!isLoadingFromDatabase.current && projectId) {
        const stepData = steps.reduce((acc, step) => {
          acc[step.id] = {
            selectedPageId: step.selectedPageId,
            selectedPages: step.selectedPages,
            status: step.status,
            overlay: step.overlay
          };
          return acc;
        }, {} as any);

        saveProgress(activeStep, stepData);
      }
    }, 1500);
  }, [projectId, saveProgress]);

  const saveImmediately = useCallback((activeStep: string, steps: EnhancedStepData[]) => {
    if (!isLoadingFromDatabase.current && projectId) {
      const stepData = steps.reduce((acc, step) => {
        acc[step.id] = {
          selectedPageId: step.selectedPageId,
          selectedPages: step.selectedPages,
          status: step.status,
          overlay: step.overlay
        };
        return acc;
      }, {} as any);

      saveProgress(activeStep, stepData);
    }
  }, [projectId, saveProgress]);

  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  }, []);

  return {
    debouncedSave,
    saveImmediately,
    isLoadingFromDatabase,
    cleanup
  };
};
