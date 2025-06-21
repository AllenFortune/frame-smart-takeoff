
import { useState } from "react";
import { StepData } from "@/hooks/useWizardSteps";
import { generateOverlay } from "@/utils/edgeFunctions";
import { useToast } from "@/hooks/use-toast";

export const useAnalysisOperations = (
  activeStep: string,
  steps: StepData[],
  updateStepStatus: (stepId: string, status: StepData['status'], overlay?: any) => void,
  updateStepPageSelection: (pageId: string) => void
) => {
  const { toast } = useToast();
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handlePageSelect = (pageId: string) => {
    console.log(`Selecting page ${pageId} for step ${activeStep}`);
    updateStepPageSelection(pageId);
  };

  const handleRunAnalysis = async () => {
    const currentStep = steps.find(s => s.id === activeStep);
    if (!currentStep?.selectedPageId) {
      toast({
        title: "No Page Selected",
        description: "Please select a page before running analysis.",
        variant: "destructive"
      });
      return;
    }

    setAnalysisLoading(true);
    updateStepStatus(activeStep, "running");

    try {
      console.log(`Running AI analysis for ${activeStep} on page ${currentStep.selectedPageId}`);
      
      const result = await generateOverlay(currentStep.selectedPageId, activeStep);
      
      updateStepStatus(activeStep, "complete", result.overlay);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${currentStep.name.toLowerCase()}.`
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      
      updateStepStatus(activeStep, "pending");

      toast({
        title: "Analysis Failed",
        description: "Failed to run AI analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  return {
    analysisLoading,
    handlePageSelect,
    handleRunAnalysis
  };
};
