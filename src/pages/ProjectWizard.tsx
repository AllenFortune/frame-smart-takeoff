
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useProjectData } from "@/hooks/useProjectData";
import { generateOverlay } from "@/utils/edgeFunctions";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppNavbar } from "@/components/AppNavbar";
import { WizardHeader } from "@/components/wizard/WizardHeader";
import { WizardTabs } from "@/components/wizard/WizardTabs";
import { WizardCanvas } from "@/components/wizard/WizardCanvas";
import { WizardControlPanel } from "@/components/wizard/WizardControlPanel";
import { useWizardSteps } from "@/hooks/useWizardSteps";

const ProjectWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pages, overlays, loading } = useProjectData(id!);
  
  const {
    steps,
    activeStep,
    setActiveStep,
    updateStepPageSelection,
    updateStepStatus,
    moveToNextStep
  } = useWizardSteps(overlays);
  
  const [analysisLoading, setAnalysisLoading] = useState(false);

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

  const currentStep = steps.find(s => s.id === activeStep);
  const currentPage = pages.find(p => p.id === currentStep?.selectedPageId);
  const currentOverlay = currentStep?.overlay;
  const currentStepIndex = steps.findIndex(s => s.id === activeStep);

  if (!id) {
    return <div>Project ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <WizardHeader projectId={id} />

        <WizardTabs 
          steps={steps}
          activeStep={activeStep}
          onStepChange={setActiveStep}
        />

        <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
          {steps.map((step) => (
            <TabsContent key={step.id} value={step.id}>
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
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectWizard;
