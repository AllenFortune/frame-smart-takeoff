
import { useState, useEffect, useCallback } from "react";
import { StepData, StepStateActions } from "./types";
import { PlanOverlay } from "@/hooks/useProjectData";
import { useWizardProgress } from "@/hooks/useWizardProgress";

const createInitialSteps = (): StepData[] => [
  { id: "pages", name: "Select Pages", status: "pending" },
  { id: "exterior", name: "Exterior Walls", status: "pending" },
  { id: "interior", name: "Interior Walls", status: "pending" },
  { id: "headers", name: "Headers", status: "pending" },
  { id: "hardware", name: "Hardware", status: "pending" },
];

export const useStepState = (
  projectId: string,
  overlays: PlanOverlay[],
  debouncedSave: (activeStep: string, steps: StepData[]) => void,
  saveImmediately: (activeStep: string, steps: StepData[]) => void,
  isLoadingFromDatabase: React.MutableRefObject<boolean>
) => {
  const [steps, setSteps] = useState<StepData[]>(createInitialSteps());
  const [activeStep, setActiveStep] = useState("pages");
  const { progress, loading: progressLoading } = useWizardProgress(projectId);

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

  const updateStepStatus = useCallback((stepId: string, status: StepData['status'], overlay?: any) => {
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

  const stepActions: StepStateActions = {
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
