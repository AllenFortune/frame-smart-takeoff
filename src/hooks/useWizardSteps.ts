
import { useState, useEffect } from "react";
import { PlanOverlay } from "@/hooks/useProjectData";

export interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  overlay?: any;
}

export const useWizardSteps = (overlays: PlanOverlay[]) => {
  const [steps, setSteps] = useState<StepData[]>([
    { id: "exterior", name: "Exterior Walls", status: "pending" },
    { id: "interior", name: "Interior Walls", status: "pending" },
    { id: "headers", name: "Headers", status: "pending" },
    { id: "hardware", name: "Hardware", status: "pending" },
  ]);

  const [activeStep, setActiveStep] = useState("exterior");

  // Load existing overlays when data is available
  useEffect(() => {
    if (overlays.length > 0) {
      setSteps(prevSteps => 
        prevSteps.map(step => {
          const stepOverlay = overlays.find(o => o.step === step.id);
          return {
            ...step,
            status: stepOverlay ? "complete" : "pending",
            overlay: stepOverlay
          };
        })
      );
    }
  }, [overlays]);

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

  return {
    steps,
    activeStep,
    setActiveStep,
    updateStepPageSelection,
    updateStepStatus,
    moveToNextStep
  };
};
