
import { useState, useEffect } from "react";
import { PlanOverlay } from "@/hooks/useProjectData";
import { useWizardProgress } from "@/hooks/useWizardProgress";

export interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  overlay?: any;
}

export const useWizardSteps = (projectId: string, overlays: PlanOverlay[]) => {
  const [steps, setSteps] = useState<StepData[]>([
    { id: "exterior", name: "Exterior Walls", status: "pending" },
    { id: "interior", name: "Interior Walls", status: "pending" },
    { id: "headers", name: "Headers", status: "pending" },
    { id: "hardware", name: "Hardware", status: "pending" },
  ]);

  const [activeStep, setActiveStep] = useState("exterior");
  const { progress, loading: progressLoading, saving, saveProgress } = useWizardProgress(projectId);

  // Load progress when available
  useEffect(() => {
    if (progress && !progressLoading) {
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
              overlay: savedStepData.overlay
            };
          }
          return step;
        })
      );
    }
  }, [progress, progressLoading]);

  // Load existing overlays when data is available
  useEffect(() => {
    if (overlays.length > 0) {
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
    }
  }, [overlays]);

  // Auto-save progress when steps or active step changes
  useEffect(() => {
    if (!progressLoading && projectId) {
      const stepData = steps.reduce((acc, step) => {
        acc[step.id] = {
          selectedPageId: step.selectedPageId,
          status: step.status,
          overlay: step.overlay
        };
        return acc;
      }, {} as any);

      saveProgress(activeStep, stepData);
    }
  }, [steps, activeStep, projectId, progressLoading]);

  const updateStepPageSelection = (pageId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === activeStep
          ? { ...step, selectedPageId: pageId }
          : step
      )
    );
  };

  const updateStepStatus = (stepId: string, status: StepData['status'], overlay?: any) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? { ...step, status, overlay }
          : step
      )
    );
  };

  const moveToNextStep = () => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const nextStep = steps[currentStepIndex + 1];
    
    if (nextStep) {
      setActiveStep(nextStep.id);
      return false; // Not complete
    }
    return true; // All steps complete
  };

  const moveToPreviousStep = () => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const previousStep = steps[currentStepIndex - 1];
    
    if (previousStep) {
      setActiveStep(previousStep.id);
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

  return {
    steps,
    activeStep,
    saving,
    progressLoading,
    setActiveStep: (stepId: string) => {
      if (canNavigateToStep(stepId)) {
        setActiveStep(stepId);
      }
    },
    updateStepPageSelection,
    updateStepStatus,
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep
  };
};
