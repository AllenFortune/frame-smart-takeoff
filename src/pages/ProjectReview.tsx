
import { AppNavbar } from "@/components/AppNavbar";
import { InteractiveCanvas } from "@/components/InteractiveCanvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import { useState } from "react";

const ProjectReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pages, overlays, loading } = useProjectData(id!);
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);

  // Mock detections for now - in real app would come from overlays
  const detections = [
    { id: 1, type: "2x4 Stud", qty: 145, status: "verified" },
    { id: 2, type: "2x6 Plate", qty: 28, status: "verified" },
    { id: 3, type: "2x10 Header", qty: 12, status: "flagged" },
    { id: 4, type: "Shear Panel", qty: 8, status: "verified" },
  ];

  // Get the current page and overlay
  const currentPage = pages[0]; // For demo, use first page
  const currentOverlay = overlays.find(o => o.page_id === currentPage?.id);

  const handlePolygonClick = (featureId: string) => {
    setSelectedOverlay(featureId);
  };

  const handlePolygonToggle = (featureId: string, included: boolean) => {
    console.log('Toggle polygon:', featureId, included);
    // In real app, would update the overlay data
  };

  const handleGeojsonUpdate = (geojson: any) => {
    console.log('Update geojson:', geojson);
    // In real app, would save the updated overlay
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="flex items-center justify-center py-12">
          <span>Loading project data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Visual Review</h1>
          <p className="text-muted-foreground">
            Review AI detections and make corrections before generating final estimates
          </p>
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
                <CardTitle>Detection Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {detections.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{item.type}</div>
                      <div className="text-sm text-muted-foreground">Qty: {item.qty}</div>
                    </div>
                    {item.status === "verified" ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Review
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              onClick={() => navigate(`/project/${id}/results`)}
              className="w-full rounded-full bg-primary hover:bg-primary/90"
              size="lg"
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
