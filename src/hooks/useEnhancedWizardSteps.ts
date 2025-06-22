import { useState, useEffect, useRef, useCallback } from "react";
import { PlanOverlay } from "@/hooks/useProjectData";
import { useWizardProgress } from "@/hooks/useWizardProgress";
import { BUILDING_CODES } from "@/components/wizard/StateSelector";

export interface EnhancedStepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  selectedPages?: string[];
  overlay?: any;
  stateSpecific?: boolean;
  buildingCode?: string;
}

export const useEnhancedWizardSteps = (projectId: string, overlays: PlanOverlay[], selectedState?: string) => {
  const getStepsForState = (state?: string) => {
    const baseSteps: EnhancedStepData[] = [
      { id: "pages", name: "Select Pages", status: "pending" },
      { id: "exterior", name: "Exterior Walls", status: "pending" },
      { id: "interior", name: "Interior Walls", status: "pending" },
      { id: "headers", name: "Headers", status: "pending" },
      { id: "hardware", name: "Hardware", status: "pending" },
    ];

    // Add state-specific steps
    if (state && BUILDING_CODES[state]) {
      const stateCode = BUILDING_CODES[state];
      
      if (stateCode.shearWalls) {
        baseSteps.splice(3, 0, {
          id: "shear_walls",
          name: "Shear Walls",
          status: "pending",
          stateSpecific: true,
          buildingCode: `${state} requires shear wall panels for lateral force resistance`
        });
      }
      
      // Add state-specific hardware requirements
      if (state === 'FL') {
        baseSteps.push({
          id: "hurricane_hardware",
          name: "Hurricane Hardware",
          status: "pending",
          stateSpecific: true,
          buildingCode: "Florida requires hurricane strapping and wind-resistant connections"
        });
      }
    }

    return baseSteps;
  };

  const [steps, setSteps] = useState<EnhancedStepData[]>(getStepsForState(selectedState));
  const [activeStep, setActiveStep] = useState("pages");
  const { progress, loading: progressLoading, saving, saveProgress } = useWizardProgress(projectId);
  
  // Refs to prevent save loops during loading
  const isLoadingFromDatabase = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update steps when state changes
  useEffect(() => {
    if (selectedState) {
      const newSteps = getStepsForState(selectedState);
      setSteps(prevSteps => {
        // Preserve existing step data when updating steps
        return newSteps.map(newStep => {
          const existingStep = prevSteps.find(s => s.id === newStep.id);
          return existingStep ? { ...newStep, ...existingStep } : newStep;
        });
      });
    }
  }, [selectedState]);

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
  const debouncedSave = useCallback((activeStepToSave: string, stepsToSave: EnhancedStepData[]) => {
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

  const saveImmediately = useCallback((activeStepToSave: string, stepsToSave: EnhancedStepData[]) => {
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

  // Rest of the implementation matches useWizardSteps but with EnhancedStepData type
  const updateStepPageSelection = (pageId: string) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step =>
        step.id === activeStep
          ? { ...step, selectedPageId: pageId }
          : step
      );
      
      if (!isLoadingFromDatabase.current) {
        debouncedSave(activeStep, newSteps);
      }
      
      return newSteps;
    });
  };

  const updateStepPagesSelection = (pageIds: string[]) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step => {
        if (step.id === "pages") {
          return { ...step, selectedPages: pageIds };
        } else {
          return { ...step, selectedPages: pageIds };
        }
      });
      
      if (!isLoadingFromDatabase.current) {
        saveImmediately(activeStep, newSteps);
      }
      
      return newSteps;
    });
  };

  const updateStepStatus = (stepId: string, status: EnhancedStepData['status'], overlay?: any) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step =>
        step.id === stepId
          ? { ...step, status, overlay }
          : step
      );
      
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
      if (!isLoadingFromDatabase.current) {
        saveImmediately(nextStep.id, steps);
      }
      return false;
    }
    return true;
  };

  const moveToPreviousStep = () => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const previousStep = steps[currentStepIndex - 1];
    
    if (previousStep) {
      setActiveStep(previousStep.id);
      if (!isLoadingFromDatabase.current) {
        saveImmediately(previousStep.id, steps);
      }
      return true;
    }
    return false;
  };

  const canNavigateToStep = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === activeStep);
    
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
