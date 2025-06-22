
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import { useWizardSteps } from "@/hooks/useWizardSteps";
import { usePageSelection } from "@/hooks/usePageSelection";
import { useAnalysisOperations } from "@/hooks/useAnalysisOperations";
import { useWizardNavigation } from "@/hooks/useWizardNavigation";

export const useProjectWizard = () => {
  const { id } = useParams();
  const { pages, overlays, loading } = useProjectData(id!);
  
  const {
    steps,
    activeStep,
    saving,
    progressLoading,
    setActiveStep,
    updateStepPageSelection,
    updateStepPagesSelection,
    updateStepStatus,
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep
  } = useWizardSteps(id!, overlays);

  const {
    selectedPages,
    handlePageToggle,
    handlePageSelectionContinue
  } = usePageSelection(
    id!,
    steps,
    updateStepStatus,
    updateStepPagesSelection,
    moveToNextStep
  );

  const {
    analysisLoading,
    handlePageSelect,
    handleRunAnalysis
  } = useAnalysisOperations(
    activeStep,
    steps,
    updateStepStatus,
    updateStepPageSelection
  );

  const {
    handleAcceptAndNext,
    handlePreviousStep,
    handleResetProgress,
    handleStepChange
  } = useWizardNavigation(
    id!,
    moveToNextStep,
    moveToPreviousStep,
    canNavigateToStep,
    setActiveStep
  );

  // Auto-select first available page for analysis steps
  useEffect(() => {
    const currentStep = steps.find(s => s.id === activeStep);
    if (currentStep && activeStep !== "pages" && currentStep.selectedPages?.length > 0) {
      // If no page is selected but we have available pages, select the first one
      if (!currentStep.selectedPageId) {
        const firstPageId = currentStep.selectedPages[0];
        console.log(`Auto-selecting first page ${firstPageId} for step ${activeStep}`);
        updateStepPageSelection(firstPageId);
      }
    }
  }, [activeStep, steps, updateStepPageSelection]);

  return {
    id,
    pages,
    overlays,
    loading,
    steps,
    activeStep,
    saving,
    progressLoading,
    analysisLoading,
    selectedPages,
    handlePageToggle,
    handlePageSelectionContinue,
    handlePageSelect,
    handleRunAnalysis,
    handleAcceptAndNext,
    handlePreviousStep,
    handleResetProgress,
    handleStepChange,
    canNavigateToStep,
    projectId: id // Add projectId as a direct export for easy access
  };
};
