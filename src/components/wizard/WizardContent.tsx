
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { WizardPageSelection } from "./WizardPageSelection";
import { WizardAnalysisStep } from "./WizardAnalysisStep";
import { PlanPage } from "@/hooks/useProjectData";
import { StepData } from "@/hooks/useWizardSteps";

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
  const currentStepIndex = steps.findIndex(s => s.id === activeStep);
  const canGoBack = currentStepIndex > 0;

  return (
    <Tabs value={activeStep} onValueChange={onStepChange} className="w-full">
      {steps.map((step) => (
        <TabsContent key={step.id} value={step.id}>
          {step.id === "pages" ? (
            <WizardPageSelection
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
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};
