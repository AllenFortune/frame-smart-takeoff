
import { AppNavbar } from "@/components/AppNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useProjectData } from "@/hooks/useProjectData";
import { InteractiveCanvas } from "@/components/InteractiveCanvas";
import { generateOverlay } from "@/utils/edgeFunctions";
import { useToast } from "@/hooks/use-toast";
import { PageSelector } from "@/components/PageSelector";

interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  overlay?: any;
}

const ProjectWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pages, overlays, loading } = useProjectData(id!);
  
  const [steps, setSteps] = useState<StepData[]>([
    { id: "exterior", name: "Exterior Walls", status: "pending" },
    { id: "interior", name: "Interior Walls", status: "pending" },
    { id: "headers", name: "Headers", status: "pending" },
    { id: "hardware", name: "Hardware", status: "pending" },
  ]);
  
  const [activeStep, setActiveStep] = useState("exterior");
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Load existing overlays when data is available
  useEffect(() => {
    if (overlays.length > 0) {
      setSteps(prevSteps => 
        prevSteps.map(step => {
          const stepOverlay = overlays.find(o => o.step === step.id);
          return {
            ...step,
            status: stepOverlay ? "complete" : "pending",
            overlay: stepOverlay
          };
        })
      );
    }
  }, [overlays]);

  const handlePageSelect = (pageId: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === activeStep
          ? { ...step, selectedPageId: pageId }
          : step
      )
    );
  };

  const handleRunAnalysis = async () => {
    const currentStep = steps.find(s => s.id === activeStep);
    if (!currentStep?.selectedPageId) {
      toast({
        title: "No Page Selected",
        description: "Please select a page before running analysis.",
        variant: "destructive"
      });
      return;
    }

    setAnalysisLoading(true);
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === activeStep
          ? { ...step, status: "running" }
          : step
      )
    );

    try {
      console.log(`Running AI analysis for ${activeStep} on page ${currentStep.selectedPageId}`);
      
      const result = await generateOverlay(currentStep.selectedPageId, activeStep);
      
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === activeStep
            ? { ...step, status: "complete", overlay: result.overlay }
            : step
        )
      );

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${currentStep.name.toLowerCase()}.`
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === activeStep
            ? { ...step, status: "pending" }
            : step
        )
      );

      toast({
        title: "Analysis Failed",
        description: "Failed to run AI analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAcceptAndNext = () => {
    const currentStepIndex = steps.findIndex(s => s.id === activeStep);
    const nextStep = steps[currentStepIndex + 1];
    
    if (nextStep) {
      setActiveStep(nextStep.id);
    } else {
      // All steps complete, navigate to review
      navigate(`/project/${id}/review`);
    }
  };

  const currentStep = steps.find(s => s.id === activeStep);
  const currentPage = pages.find(p => p.id === currentStep?.selectedPageId);
  const currentOverlay = currentStep?.overlay;

  if (!id) {
    return <div>Project ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/project/${id}/pages`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pages
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Take-off Wizard</h1>
            <p className="text-muted-foreground">
              AI-powered material takeoff for each framing component
            </p>
          </div>
        </div>

        <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {steps.map((step) => (
              <TabsTrigger key={step.id} value={step.id} className="text-sm">
                <div className="flex items-center gap-2">
                  {step.status === "complete" && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {step.status === "running" && <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                  {step.name}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {steps.map((step) => (
            <TabsContent key={step.id} value={step.id}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
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
                </div>

                <div className="space-y-6">
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
                          onPageSelect={handlePageSelect}
                          loading={loading}
                        />
                      </div>

                      <Button 
                        className="w-full rounded-full bg-secondary hover:bg-secondary/90"
                        onClick={handleRunAnalysis}
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
                              {currentOverlay?.geojson?.features && (
                                <p className="text-xs text-muted-foreground">
                                  Found {currentOverlay.geojson.features.length} items
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={handleAcceptAndNext}
                        disabled={step.status !== "complete"}
                      >
                        {currentStepIndex === steps.length - 1 ? "Complete & Review" : "Accept & Next"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectWizard;
