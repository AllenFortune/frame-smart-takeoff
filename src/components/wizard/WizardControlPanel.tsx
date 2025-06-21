
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { PageSelector } from "@/components/PageSelector";
import { PlanPage } from "@/hooks/useProjectData";

interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  selectedPages?: string[];
  overlay?: any;
}

interface WizardControlPanelProps {
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
}

export const WizardControlPanel = ({
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
  canNavigateToStep
}: WizardControlPanelProps) => {
  // Don't show control panel for page selection step
  if (step.id === "pages") {
    return null;
  }

  // Filter pages to only show selected ones from page selection step + add debugging
  const availablePages = step.selectedPages ? 
    pages.filter(page => step.selectedPages!.includes(page.id)) : 
    pages;

  console.log(`Step ${step.id} - Selected pages:`, step.selectedPages);
  console.log(`Step ${step.id} - Available pages:`, availablePages.length);
  console.log(`Step ${step.id} - Currently selected page:`, step.selectedPageId);

  // Find the currently selected page details
  const selectedPage = availablePages.find(p => p.id === step.selectedPageId);

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          {step.name}
          <Badge variant="outline">
            Step {currentStepIndex + 1} of {totalSteps}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Select Page:</h4>
          {availablePages.length === 0 ? (
            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              No pages available. Please go back to the "Select Pages" step and choose pages for analysis.
            </div>
          ) : (
            <PageSelector
              pages={availablePages}
              selectedPageId={step.selectedPageId}
              onPageSelect={onPageSelect}
              loading={loading}
            />
          )}
        </div>

        {selectedPage && (
          <div className="text-xs text-muted-foreground p-2 bg-muted/20 rounded">
            <p><strong>Selected:</strong> Page {selectedPage.page_no}</p>
            {selectedPage.sheet_number && <p><strong>Sheet:</strong> {selectedPage.sheet_number}</p>}
            {selectedPage.description && <p><strong>Description:</strong> {selectedPage.description}</p>}
            <p><strong>Type:</strong> {selectedPage.class}</p>
          </div>
        )}

        <Button 
          className="w-full rounded-full bg-secondary hover:bg-secondary/90"
          onClick={onRunAnalysis}
          disabled={!step.selectedPageId || analysisLoading || step.status === "running" || availablePages.length === 0}
        >
          <Play className="w-4 h-4 mr-2" />
          {step.status === "running" ? "Running Analysis..." : "Run AI Analysis"}
        </Button>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Status:</h4>
          <div className="text-sm">
            {step.status === "pending" && (
              <Badge variant="secondary">Ready to analyze</Badge>
            )}
            {step.status === "running" && (
              <Badge variant="default">Analyzing...</Badge>
            )}
            {step.status === "complete" && (
              <div className="space-y-2">
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Analysis Complete
                </Badge>
                {step.overlay?.geojson?.features && (
                  <p className="text-xs text-muted-foreground">
                    Found {step.overlay.geojson.features.length} items
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onPreviousStep}
            disabled={!canGoBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <Button
            variant="outline"
            className="flex-1 rounded-full"
            onClick={onAcceptAndNext}
            disabled={step.status !== "complete"}
          >
            {currentStepIndex === totalSteps - 1 ? "Complete" : "Next"}
            {currentStepIndex !== totalSteps - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
