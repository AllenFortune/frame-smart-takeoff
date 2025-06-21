
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useProjectData } from "@/hooks/useProjectData";
import { generateOverlay, extractSummary } from "@/utils/edgeFunctions";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppNavbar } from "@/components/AppNavbar";
import { WizardHeader } from "@/components/wizard/WizardHeader";
import { WizardTabs } from "@/components/wizard/WizardTabs";
import { WizardCanvas } from "@/components/wizard/WizardCanvas";
import { WizardControlPanel } from "@/components/wizard/WizardControlPanel";
import { WizardProgressIndicator } from "@/components/wizard/WizardProgressIndicator";
import { WizardPageSelection } from "@/components/wizard/WizardPageSelection";
import { useWizardSteps } from "@/hooks/useWizardSteps";
import { useWizardProgress } from "@/hooks/useWizardProgress";

const ProjectWizard = () => {
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
  React.useEffect(() => {
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
      // Mark page selection as complete
      updateStepStatus("pages", "complete");
      
      // Update all analysis steps with selected pages
      steps.forEach(step => {
        if (step.id !== "pages") {
          updateStepPagesSelection(selectedPageIds);
        }
      });

      // Start summary extraction
      await extractSummary(id, selectedPageIds);

      toast({
        title: "Pages Selected",
        description: `Selected ${selectedPageIds.length} pages for analysis.`
      });

      // Move to next step
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
      // All steps complete, navigate to review
      navigate(`/project/${id}/review`);
    }
  };

  const handlePreviousStep = () => {
    moveToPreviousStep();
  };

  const handleResetProgress = async () => {
    await resetProgress();
    // Refresh the page to reload initial state
    window.location.reload();
  };

  const currentStep = steps.find(s => s.id === activeStep);
  const currentPage = pages.find(p => p.id === currentStep?.selectedPageId);
  const currentOverlay = currentStep?.overlay;
  const currentStepIndex = steps.findIndex(s => s.id === activeStep);
  const canGoBack = currentStepIndex > 0;

  if (!id) {
    return <div>Project ID not found</div>;
  }

  if (progressLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wizard progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <WizardHeader 
          projectId={id} 
          onResetProgress={handleResetProgress}
          saving={saving}
        />

        <WizardProgressIndicator 
          steps={steps}
          saving={saving}
        />

        <WizardTabs 
          steps={steps}
          activeStep={activeStep}
          onStepChange={(stepId) => {
            if (canNavigateToStep(stepId)) {
              setActiveStep(stepId);
            } else {
              toast({
                title: "Cannot Navigate",
                description: "Complete the current step before proceeding.",
                variant: "destructive"
              });
            }
          }}
        />

        <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
          {steps.map((step) => (
            <TabsContent key={step.id} value={step.id}>
              {step.id === "pages" ? (
                <WizardPageSelection
                  pages={pages}
                  selectedPages={selectedPages}
                  loading={loading}
                  onPageToggle={handlePageToggle}
                  onContinue={handlePageSelectionContinue}
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <WizardCanvas 
                      currentPage={currentPage}
                      currentOverlay={currentOverlay}
                    />
                  </div>

                  <div className="space-y-6">
                    <WizardControlPanel
                      step={step}
                      pages={pages}
                      loading={loading}
                      analysisLoading={analysisLoading}
                      currentStepIndex={currentStepIndex}
                      totalSteps={steps.length}
                      onPageSelect={handlePageSelect}
                      onRunAnalysis={handleRunAnalysis}
                      onAcceptAndNext={handleAcceptAndNext}
                      onPreviousStep={handlePreviousStep}
                      canGoBack={canGoBack}
                      canNavigateToStep={canNavigateToStep}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectWizard;
