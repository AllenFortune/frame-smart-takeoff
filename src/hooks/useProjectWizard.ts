
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import { generateOverlay, extractSummary } from "@/utils/edgeFunctions";
import { useToast } from "@/hooks/use-toast";
import { useWizardSteps } from "@/hooks/useWizardSteps";
import { useWizardProgress } from "@/hooks/useWizardProgress";

export const useProjectWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pages, overlays, loading } = useProjectData(id!);
  const { resetProgress } = useWizardProgress(id!);
  
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
  
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  // Initialize selected pages from step data
  useEffect(() => {
    const pagesStep = steps.find(s => s.id === "pages");
    if (pagesStep?.selectedPages) {
      setSelectedPages(new Set(pagesStep.selectedPages));
    }
  }, [steps]);

  const handlePageToggle = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
    updateStepPagesSelection(Array.from(newSelected));
  };

  const handlePageSelectionContinue = async (selectedPageIds: string[]) => {
    if (!id) return;

    try {
      updateStepStatus("pages", "complete");
      
      steps.forEach(step => {
        if (step.id !== "pages") {
          updateStepPagesSelection(selectedPageIds);
        }
      });

      await extractSummary(id, selectedPageIds);

      toast({
        title: "Pages Selected",
        description: `Selected ${selectedPageIds.length} pages for analysis.`
      });

      moveToNextStep();
    } catch (error) {
      console.error('Error processing page selection:', error);
      toast({
        title: "Error",
        description: "Failed to process page selection. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePageSelect = (pageId: string) => {
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

  const handleAcceptAndNext = () => {
    const isComplete = moveToNextStep();
    
    if (isComplete) {
      navigate(`/project/${id}/review`);
    }
  };

  const handlePreviousStep = () => {
    moveToPreviousStep();
  };

  const handleResetProgress = async () => {
    try {
      await resetProgress();
      
      setSelectedPages(new Set());
      setAnalysisLoading(false);
      
      toast({
        title: "Progress Reset",
        description: "Wizard progress has been reset. You can start fresh."
      });
    } catch (error) {
      console.error('Error resetting progress:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStepChange = (stepId: string) => {
    if (canNavigateToStep(stepId)) {
      setActiveStep(stepId);
    } else {
      toast({
        title: "Cannot Navigate",
        description: "Complete the current step before proceeding.",
        variant: "destructive"
      });
    }
  };

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
    canNavigateToStep
  };
};
