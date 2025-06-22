
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { InteractiveCanvas } from "@/components/InteractiveCanvas";
import { PdfPageRenderer } from "@/components/pdf/PdfPageRenderer";
import { ViewToggle } from "./ViewToggle";
import { PlanPage } from "@/hooks/useProjectData";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { isSignedUrlExpired, isPublicUrl } from "@/lib/storage";

interface WizardCanvasProps {
  currentPage?: PlanPage;
  currentOverlay?: any;
  isLoading?: boolean;
  projectId?: string;
}

export const WizardCanvas = ({ currentPage, currentOverlay, isLoading, projectId }: WizardCanvasProps) => {
  const [viewMode, setViewMode] = useState<'pdf' | 'image'>('pdf'); // Default to PDF view

  const hasValidImage = currentPage?.img_url && 
    (isPublicUrl(currentPage.img_url) || !isSignedUrlExpired(currentPage.img_url)) && 
    currentPage.class !== 'upload_failed';

  // Construct PDF URL from project ID
  const pdfUrl = projectId && currentPage ? 
    `https://erfbmgcxpmtnmkffqsac.supabase.co/storage/v1/object/public/plan-pdfs/${projectId}/plan.pdf` : 
    null;

  const pdfAvailable = Boolean(pdfUrl && currentPage);

  console.log('WizardCanvas - Current page:', currentPage?.page_no);
  console.log('WizardCanvas - View mode:', viewMode);
  console.log('WizardCanvas - PDF available:', pdfAvailable);
  console.log('WizardCanvas - Has valid image:', hasValidImage);
  
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardContent className="p-6">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading page...</p>
            </div>
          </div>
        ) : currentPage ? (
          <div className="space-y-4">
            {/* Page Header with View Toggle */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground bg-muted/20 p-2 rounded">
                <strong>Viewing:</strong> Page {currentPage.page_no}
                {currentPage.sheet_number && ` - ${currentPage.sheet_number}`}
                {currentPage.description && ` (${currentPage.description})`}
              </div>
              
              <ViewToggle
                currentView={viewMode}
                onViewChange={setViewMode}
                pdfAvailable={pdfAvailable}
                imageAvailable={hasValidImage}
              />
            </div>

            {/* Content Area */}
            <div className="h-96">
              {viewMode === 'pdf' && pdfAvailable ? (
                <PdfPageRenderer
                  pdfUrl={pdfUrl}
                  pageNumber={currentPage.page_no}
                  width={600}
                  className="w-full h-full"
                />
              ) : viewMode === 'image' && hasValidImage ? (
                <InteractiveCanvas
                  imageUrl={currentPage.img_url || ''}
                  geojson={currentOverlay?.geojson}
                  className="h-full"
                />
              ) : pdfAvailable ? (
                // Fallback to PDF if image view fails
                <PdfPageRenderer
                  pdfUrl={pdfUrl}
                  pageNumber={currentPage.page_no}
                  width={600}
                  className="w-full h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground bg-muted rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-500 mr-2" />
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {currentPage.class === 'upload_failed' ? 'Upload Failed' : 'Content Not Available'}
                      </p>
                      <p className="text-sm">Page {currentPage.page_no} - {currentPage.class}</p>
                      <p className="text-xs mt-2">
                        {currentPage.class === 'upload_failed' 
                          ? 'This page failed to upload during processing'
                          : 'Neither PDF nor image content is available for this page'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
