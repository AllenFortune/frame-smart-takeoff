
import { AppNavbar } from "@/components/AppNavbar";
import { InteractiveCanvas } from "@/components/InteractiveCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import { useDetectionData } from "@/hooks/useDetectionData";
import { useState } from "react";

const ProjectReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pages, overlays, loading: projectLoading } = useProjectData(id!);
  const { detections, loading: detectionsLoading, updateDetectionStatus } = useDetectionData(id!);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);

  // Get the current page and overlay
  const currentPage = pages[0]; // For demo, use first page
  const currentOverlay = overlays.find(o => o.page_id === currentPage?.id);

  const handlePolygonClick = (featureId: string) => {
    setSelectedOverlay(featureId);
  };

  const handlePolygonToggle = (featureId: string, included: boolean) => {
    console.log('Toggle polygon:', featureId, included);
    
    // Update detection status based on inclusion
    const detection = detections.find(d => d.feature_id === featureId);
    if (detection) {
      updateDetectionStatus(detection.id, included ? 'verified' : 'flagged');
    }
  };

  const handleGeojsonUpdate = (geojson: any) => {
    console.log('Update geojson:', geojson);
    // In real app, would save the updated overlay to Supabase
  };

  const handleDetectionStatusChange = (detectionId: string, status: 'verified' | 'flagged') => {
    updateDetectionStatus(detectionId, status);
  };

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading project data...</span>
        </div>
      </div>
    );
  }

  const totalDetections = detections.length;
  const verifiedDetections = detections.filter(d => d.status === 'verified').length;
  const flaggedDetections = detections.filter(d => d.status === 'flagged').length;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Visual Review</h1>
          <p className="text-muted-foreground">
            Review AI detections and make corrections before generating final estimates
          </p>
          {totalDetections > 0 && (
            <div className="flex items-center gap-4 mt-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                {verifiedDetections} Verified
              </Badge>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {flaggedDetections} Need Review
              </Badge>
              <Badge variant="outline">
                {totalDetections} Total
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {currentPage?.img_url && (
              <InteractiveCanvas
                imageUrl={currentPage.img_url}
                geojson={currentOverlay?.geojson}
                onPolygonClick={handlePolygonClick}
                onPolygonToggle={handlePolygonToggle}
                onGeojsonUpdate={handleGeojsonUpdate}
                className="h-full"
              />
            )}
          </div>

          <div className="space-y-6">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Detection Summary
                  {detectionsLoading && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detections.length === 0 && !detectionsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No detections found</p>
                    <p className="text-sm">Upload and process plans to see detections</p>
                  </div>
                ) : (
                  detections.map((detection) => (
                    <div key={detection.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{detection.type}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {detection.quantity}
                          {detection.material && ` • ${detection.material}`}
                          {detection.length_ft && ` • ${detection.length_ft}ft`}
                          {detection.area_sqft && ` • ${detection.area_sqft} sq ft`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Confidence: {Math.round(detection.confidence * 100)}%
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {detection.status === "verified" ? (
                          <Badge className="bg-green-100 text-green-800" variant="secondary">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Review
                          </Badge>
                        )}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDetectionStatusChange(detection.id, 'verified')}
                            className="text-xs px-2 py-1"
                          >
                            ✓
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDetectionStatusChange(detection.id, 'flagged')}
                            className="text-xs px-2 py-1"
                          >
                            ✗
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Button
              onClick={() => navigate(`/project/${id}/results`)}
              className="w-full rounded-full bg-primary hover:bg-primary/90"
              size="lg"
              disabled={detections.length === 0}
            >
              Generate Lumber List
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectReview;
