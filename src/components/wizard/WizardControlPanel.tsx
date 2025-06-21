
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle } from "lucide-react";
import { PageSelector } from "@/components/PageSelector";
import { PlanPage } from "@/hooks/useProjectData";

interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
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
  onAcceptAndNext
}: WizardControlPanelProps) => {
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{step.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Select Page:</h4>
          <PageSelector
            pages={pages}
            selectedPageId={step.selectedPageId}
            onPageSelect={onPageSelect}
            loading={loading}
          />
        </div>

        <Button 
          className="w-full rounded-full bg-secondary hover:bg-secondary/90"
          onClick={onRunAnalysis}
          disabled={!step.selectedPageId || analysisLoading || step.status === "running"}
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

        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={onAcceptAndNext}
          disabled={step.status !== "complete"}
        >
          {currentStepIndex === totalSteps - 1 ? "Complete & Review" : "Accept & Next"}
        </Button>
      </CardContent>
    </Card>
  );
};
