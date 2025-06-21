
import { Card, CardContent } from "@/components/ui/card";
import { InteractiveCanvas } from "@/components/InteractiveCanvas";
import { PlanPage } from "@/hooks/useProjectData";
import { AlertCircle, FileText } from "lucide-react";
import { isSignedUrlExpired } from "@/lib/storage";

interface WizardCanvasProps {
  currentPage?: PlanPage;
  currentOverlay?: any;
}

export const WizardCanvas = ({ currentPage, currentOverlay }: WizardCanvasProps) => {
  const hasValidImage = currentPage?.img_url && !isSignedUrlExpired(currentPage.img_url);
  
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="p-6">
        {currentPage ? (
          hasValidImage ? (
            <InteractiveCanvas
              imageUrl={currentPage.img_url || ''}
              geojson={currentOverlay?.geojson}
              className="h-96"
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted rounded-lg border-2 border-dashed border-muted-foreground/20">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-500 mr-2" />
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Image Not Available</p>
                  <p className="text-sm">Page {currentPage.page_no} - {currentPage.class}</p>
                  <p className="text-xs mt-2">The image URL may have expired or the file is not accessible</p>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="h-96 flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="mb-4">Select a page to begin analysis</p>
              <p className="text-sm">Choose a page from the selector on the right</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
