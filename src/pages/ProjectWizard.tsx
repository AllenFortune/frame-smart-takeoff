
import React from "react";
import { AppNavbar } from "@/components/AppNavbar";
import { WizardHeader } from "@/components/wizard/WizardHeader";
import { WizardTabs } from "@/components/wizard/WizardTabs";
import { WizardProgressIndicator } from "@/components/wizard/WizardProgressIndicator";
import { WizardContent } from "@/components/wizard/WizardContent";
import { WizardLoading } from "@/components/wizard/WizardLoading";
import { useProjectWizard } from "@/hooks/useProjectWizard";

const ProjectWizard = () => {
  const {
    id,
    pages,
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
    projectId
  } = useProjectWizard();

  if (!id) {
    return <div>Project ID not found</div>;
  }

  if (progressLoading) {
    return <WizardLoading />;
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
          onStepChange={handleStepChange}
        />

        <WizardContent
          steps={steps}
          activeStep={activeStep}
          pages={pages}
          loading={loading}
          analysisLoading={analysisLoading}
          selectedPages={selectedPages}
          onPageToggle={handlePageToggle}
          onPageSelectionContinue={handlePageSelectionContinue}
          onPageSelect={handlePageSelect}
          onRunAnalysis={handleRunAnalysis}
          onAcceptAndNext={handleAcceptAndNext}
          onPreviousStep={handlePreviousStep}
          canNavigateToStep={canNavigateToStep}
          onStepChange={handleStepChange}
          projectId={projectId} // Pass projectId to WizardContent
        />
      </div>
    </div>
  );
};

export default ProjectWizard;
