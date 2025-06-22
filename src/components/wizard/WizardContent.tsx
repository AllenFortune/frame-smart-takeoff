
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { EnhancedWizardPageSelection } from "./EnhancedWizardPageSelection";
import { WizardAnalysisStep } from "./WizardAnalysisStep";
import { PlanPage } from "@/hooks/useProjectData";
import { StepData } from "@/hooks/useWizardSteps";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThumbnailDebugPanel } from "./ThumbnailDebugPanel";

interface WizardContentProps {
  steps: StepData[];
  activeStep: string;
  pages: PlanPage[];
  loading: boolean;
  analysisLoading: boolean;
  selectedPages: Set<string>;
  onPageToggle: (pageId: string) => void;
  onPageSelectionContinue: (selectedPages: string[]) => void;
  onPageSelect: (pageId: string) => void;
  onRunAnalysis: () => void;
  onAcceptAndNext: () => void;
  onPreviousStep: () => void;
  canNavigateToStep: (stepId: string) => boolean;
  onStepChange: (stepId: string) => void;
  projectId?: string;
}

export const WizardContent = ({
  steps,
  activeStep,
  pages,
  loading,
  analysisLoading,
  selectedPages,
  onPageToggle,
  onPageSelectionContinue,
  onPageSelect,
  onRunAnalysis,
  onAcceptAndNext,
  onPreviousStep,
  canNavigateToStep,
  onStepChange
}: WizardContentProps) => {
  const { id } = useParams();
  const currentStep = steps.find(s => s.id === activeStep);

  // Show debug panel for image issues
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const currentStepIndex = steps.findIndex(s => s.id === activeStep);
  const canGoBack = currentStepIndex > 0;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (analysisLoading) {
    return <div>Analysis Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel Toggle - only show when there are image issues */}
      {activeStep !== "pages" && pages.some(p => !p.preview_url && !p.img_url) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium">
                Some plan images are not loading properly
              </p>
            </div>
            <Button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              variant="outline"
              size="sm"
            >
              {showDebugPanel ? 'Hide' : 'Show'} Debug Tools
            </Button>
          </div>
          
          {showDebugPanel && id && (
            <div className="mt-4">
              <ThumbnailDebugPanel 
                projectId={id} 
                onRefresh={() => window.location.reload()} 
              />
            </div>
          )}
        </div>
      )}

      <Tabs value={activeStep} onValueChange={onStepChange} className="w-full">
        {steps.map((step) => (
          <TabsContent key={step.id} value={step.id}>
            {step.id === "pages" ? (
              <EnhancedWizardPageSelection
                pages={pages}
                selectedPages={selectedPages}
                loading={loading}
                onPageToggle={onPageToggle}
                onContinue={onPageSelectionContinue}
              />
            ) : (
              <WizardAnalysisStep
                step={step}
                pages={pages}
                loading={loading}
                analysisLoading={analysisLoading}
                currentStepIndex={currentStepIndex}
                totalSteps={steps.length}
                onPageSelect={onPageSelect}
                onRunAnalysis={onRunAnalysis}
                onAcceptAndNext={onAcceptAndNext}
                onPreviousStep={onPreviousStep}
                canGoBack={canGoBack}
                canNavigateToStep={canNavigateToStep}
                projectId={id}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
