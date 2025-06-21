
import { useState, useEffect } from "react";
import { StepData } from "@/hooks/useWizardSteps";
import { extractSummary } from "@/utils/edgeFunctions";
import { useToast } from "@/hooks/use-toast";

export const usePageSelection = (
  projectId: string,
  steps: StepData[],
  updateStepStatus: (stepId: string, status: StepData['status'], overlay?: any) => void,
  updateStepPagesSelection: (pageIds: string[]) => void,
  moveToNextStep: () => boolean
) => {
  const { toast } = useToast();
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
    if (!projectId) return;

    try {
      console.log('Completing page selection with pages:', selectedPageIds);
      updateStepStatus("pages", "complete");
      
      // Update all subsequent steps with the selected pages
      const analysisSteps = steps.filter(step => step.id !== "pages");
      analysisSteps.forEach(step => {
        console.log(`Updating step ${step.id} with selected pages:`, selectedPageIds);
        updateStepPagesSelection(selectedPageIds);
      });

      await extractSummary(projectId, selectedPageIds);

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

  return {
    selectedPages,
    handlePageToggle,
    handlePageSelectionContinue
  };
};
