
import React from 'react';
import { WizardCanvas } from './WizardCanvas';
import { WizardControlPanel } from './WizardControlPanel';
import { PlanPage } from "@/hooks/useProjectData";

interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  selectedPages?: string[];
  overlay?: any;
}

interface WizardAnalysisStepProps {
  step: StepData;
  pages: PlanPage[];
  loading: boolean;
  analysisLoading: boolean;
  currentStepIndex: number;
  totalSteps: number;
  onPageSelect: (pageId: string) => void;
  onRunAnalysis: () => void;
  onAcceptAndNext: () => void;
  onPreviousStep: () => void;
  canGoBack: boolean;
  canNavigateToStep: (stepId: string) => boolean;
  projectId?: string; // Add projectId prop
}

export const WizardAnalysisStep = ({
  step,
  pages,
  loading,
  analysisLoading,
  currentStepIndex,
  totalSteps,
  onPageSelect,
  onRunAnalysis,
  onAcceptAndNext,
  onPreviousStep,
  canGoBack,
  canNavigateToStep,
  projectId // Add projectId to destructured props
}: WizardAnalysisStepProps) => {
  const currentPage = pages.find(p => p.id === step.selectedPageId);
  const currentOverlay = step.overlay;

  console.log('WizardAnalysisStep - Step:', step.id);
  console.log('WizardAnalysisStep - Selected page ID:', step.selectedPageId);
  console.log('WizardAnalysisStep - Current page found:', !!currentPage);
  console.log('WizardAnalysisStep - Selected pages for step:', step.selectedPages);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <WizardCanvas 
          currentPage={currentPage}
          currentOverlay={currentOverlay}
          isLoading={loading}
          projectId={projectId} // Pass projectId to WizardCanvas
        />
      </div>

      <div className="space-y-6">
        <WizardControlPanel
          step={step}
          pages={pages}
          loading={loading}
          analysisLoading={analysisLoading}
          currentStepIndex={currentStepIndex}
          totalSteps={totalSteps}
          onPageSelect={onPageSelect}
          onRunAnalysis={onRunAnalysis}
          onAcceptAndNext={onAcceptAndNext}
          onPreviousStep={onPreviousStep}
          canGoBack={canGoBack}
          canNavigateToStep={canNavigateToStep}
        />
      </div>
    </div>
  );
};
