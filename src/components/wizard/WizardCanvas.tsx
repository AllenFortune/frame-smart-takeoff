
import { Card, CardContent } from "@/components/ui/card";
import { InteractiveCanvas } from "@/components/InteractiveCanvas";
import { PlanPage } from "@/hooks/useProjectData";

interface WizardCanvasProps {
  currentPage?: PlanPage;
  currentOverlay?: any;
}

export const WizardCanvas = ({ currentPage, currentOverlay }: WizardCanvasProps) => {
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="p-6">
        {currentPage ? (
          <InteractiveCanvas
            imageUrl={currentPage.img_url || ''}
            geojson={currentOverlay?.geojson}
            className="h-96"
          />
        ) : (
          <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
            <div className="text-center">
              <p className="mb-4">Select a page to begin analysis</p>
              <p className="text-sm">Choose a page from the selector on the right</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
