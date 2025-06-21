
import { useState, useEffect, useRef, useCallback } from "react";
import { PlanOverlay } from "@/hooks/useProjectData";
import { useWizardProgress } from "@/hooks/useWizardProgress";

export interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  selectedPages?: string[]; // For page selection step
  overlay?: any;
}

export const useWizardSteps = (projectId: string, overlays: PlanOverlay[]) => {
  const [steps, setSteps] = useState<StepData[]>([
    { id: "pages", name: "Select Pages", status: "pending" },
    { id: "exterior", name: "Exterior Walls", status: "pending" },
    { id: "interior", name: "Interior Walls", status: "pending" },
    { id: "headers", name: "Headers", status: "pending" },
    { id: "hardware", name: "Hardware", status: "pending" },
  ]);

  const [activeStep, setActiveStep] = useState("pages");
  const { progress, loading: progressLoading, saving, saveProgress } = useWizardProgress(projectId);
  
  // Refs to prevent save loops during loading
  const isLoadingFromDatabase = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load progress when available
  useEffect(() => {
    if (progress && !progressLoading) {
      isLoadingFromDatabase.current = true;
      
      setActiveStep(progress.active_step);
      
      // Restore step data from saved progress
      setSteps(prevSteps => 
        prevSteps.map(step => {
          const savedStepData = progress.step_data[step.id];
          if (savedStepData) {
            return {
              ...step,
              status: savedStepData.status,
              selectedPageId: savedStepData.selectedPageId,
              selectedPages: savedStepData.selectedPages,
              overlay: savedStepData.overlay
            };
          }
          return step;
        })
      );
      
      // Reset loading flag after a brief delay
      setTimeout(() => {
        isLoadingFromDatabase.current = false;
      }, 100);
    }
  }, [progress, progressLoading]);

  // Load existing overlays when data is available
  useEffect(() => {
    if (overlays.length > 0) {
      isLoadingFromDatabase.current = true;
      
      setSteps(prevSteps => 
        prevSteps.map(step => {
          const stepOverlay = overlays.find(o => o.step === step.id);
          return {
            ...step,
            status: stepOverlay ? "complete" : step.status,
            overlay: stepOverlay || step.overlay
          };
        })
      );
      
      // Reset loading flag after a brief delay
      setTimeout(() => {
        isLoadingFromDatabase.current = false;
      }, 100);
    }
  }, [overlays]);

  // Debounced save function
  const debouncedSave = useCallback((activeStepToSave: string, stepsToSave: StepData[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (!isLoadingFromDatabase.current && projectId) {
        const stepData = stepsToSave.reduce((acc, step) => {
          acc[step.id] = {
            selectedPageId: step.selectedPageId,
            selectedPages: step.selectedPages,
            status: step.status,
            overlay: step.overlay
          };
          return acc;
        }, {} as any);

        saveProgress(activeStepToSave, stepData);
      }
    }, 1500); // 1.5 second debounce
  }, [projectId, saveProgress]);

  // Manual save function for immediate saves (step completion, navigation)
  const saveImmediately = useCallback((activeStepToSave: string, stepsToSave: StepData[]) => {
    if (!isLoadingFromDatabase.current && projectId) {
      const stepData = stepsToSave.reduce((acc, step) => {
        acc[step.id] = {
          selectedPageId: step.selectedPageId,
          selectedPages: step.selectedPages,
          status: step.status,
          overlay: step.overlay
        };
        return acc;
      }, {} as any);

      saveProgress(activeStepToSave, stepData);
    }
  }, [projectId, saveProgress]);

  const updateStepPageSelection = (pageId: string) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step =>
        step.id === activeStep
          ? { ...step, selectedPageId: pageId }
          : step
      );
      
      // Debounced save for page selection changes
      if (!isLoadingFromDatabase.current) {
        debouncedSave(activeStep, newSteps);
      }
      
      return newSteps;
    });
  };

  const updateStepPagesSelection = (pageIds: string[]) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step =>
        step.id === activeStep
          ? { ...step, selectedPages: pageIds }
          : step
      );
      
      // Save immediately for page selection completion
      if (!isLoadingFromDatabase.current) {
        saveImmediately(activeStep, newSteps);
      }
      
      return newSteps;
    });
  };

  const updateStepStatus = (stepId: string, status: StepData['status'], overlay?: any) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step =>
        step.id === stepId
          ? { ...step, status, overlay }
          : step
      );
      
      // Save immediately when step status changes (completion, running, etc.)
      if (!isLoadingFromDatabase.current) {
        saveImmediately(activeStep, newSteps);
      }
      
      return newSteps;
    });
  };

  const moveToNextStep = () => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const nextStep = steps[currentStepIndex + 1];
    
    if (nextStep) {
      setActiveStep(nextStep.id);
      // Save immediately when navigating between steps
      if (!isLoadingFromDatabase.current) {
        saveImmediately(nextStep.id, steps);
      }
      return false; // Not complete
    }
    return true; // All steps complete
  };

  const moveToPreviousStep = () => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const previousStep = steps[currentStepIndex - 1];
    
    if (previousStep) {
      setActiveStep(previousStep.id);
      // Save immediately when navigating between steps
      if (!isLoadingFromDatabase.current) {
        saveImmediately(previousStep.id, steps);
      }
      return true; // Successfully moved back
    }
    return false; // Already at first step
  };

  const canNavigateToStep = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    
    // Allow navigation to current step, previous steps, or next step if current is complete
    return stepIndex <= currentIndex || 
           (stepIndex === currentIndex + 1 && steps[currentIndex].status === 'complete');
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    steps,
    activeStep,
    saving,
    progressLoading,
    setActiveStep: (stepId: string) => {
      if (canNavigateToStep(stepId)) {
        setActiveStep(stepId);
        // Save immediately when manually navigating to a step
        if (!isLoadingFromDatabase.current) {
          saveImmediately(stepId, steps);
        }
      }
    },
    updateStepPageSelection,
    updateStepPagesSelection,
    updateStepStatus,
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep
  };
};
