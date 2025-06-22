
import { useState, useEffect, useCallback } from "react";
import { EnhancedStepData, EnhancedStepStateActions } from "./types";
import { PlanOverlay } from "@/hooks/useProjectData";
import { useWizardProgress } from "@/hooks/useWizardProgress";
import { BUILDING_CODES } from "@/components/wizard/StateSelector";

const createInitialSteps = (selectedState?: string): EnhancedStepData[] => {
  const baseSteps: EnhancedStepData[] = [
    { id: "pages", name: "Select Pages", status: "pending" },
    { id: "exterior", name: "Exterior Walls", status: "pending" },
    { id: "interior", name: "Interior Walls", status: "pending" },
    { id: "headers", name: "Headers", status: "pending" },
    { id: "hardware", name: "Hardware", status: "pending" },
  ];

  // Add state-specific steps
  if (selectedState && BUILDING_CODES[selectedState]) {
    const stateCode = BUILDING_CODES[selectedState];
    
    if (stateCode.shearWalls) {
      baseSteps.splice(3, 0, {
        id: "shear_walls",
        name: "Shear Walls",
        status: "pending",
        stateSpecific: true,
        buildingCode: `${selectedState} requires shear wall panels for lateral force resistance`
      });
    }
    
    // Add state-specific hardware requirements
    if (selectedState === 'FL') {
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

export const useEnhancedStepState = (
  projectId: string,
  overlays: PlanOverlay[],
  selectedState: string | undefined,
  debouncedSave: (activeStep: string, steps: EnhancedStepData[]) => void,
  saveImmediately: (activeStep: string, steps: EnhancedStepData[]) => void,
  isLoadingFromDatabase: React.MutableRefObject<boolean>
) => {
  const [steps, setSteps] = useState<EnhancedStepData[]>(createInitialSteps(selectedState));
  const [activeStep, setActiveStep] = useState("pages");
  const { progress, loading: progressLoading } = useWizardProgress(projectId);

  // Update steps when state changes
  useEffect(() => {
    if (selectedState) {
      const newSteps = createInitialSteps(selectedState);
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
      
      setTimeout(() => {
        isLoadingFromDatabase.current = false;
      }, 100);
    }
  }, [progress, progressLoading, isLoadingFromDatabase]);

  // Load existing overlays
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
      
      setTimeout(() => {
        isLoadingFromDatabase.current = false;
      }, 100);
    }
  }, [overlays, isLoadingFromDatabase]);

  const updateStepPageSelection = useCallback((pageId: string) => {
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
  }, [activeStep, debouncedSave, isLoadingFromDatabase]);

  const updateStepPagesSelection = useCallback((pageIds: string[]) => {
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
  }, [activeStep, saveImmediately, isLoadingFromDatabase]);

  const updateStepStatus = useCallback((stepId: string, status: EnhancedStepData['status'], overlay?: any) => {
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
  }, [activeStep, saveImmediately, isLoadingFromDatabase]);

  const stepActions: EnhancedStepStateActions = {
    updateStepPageSelection,
    updateStepPagesSelection,
    updateStepStatus
  };

  return {
    steps,
    activeStep,
    setActiveStep,
    stepActions,
    progressLoading
  };
};
