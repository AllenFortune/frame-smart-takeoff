
import { AppNavbar } from "@/components/AppNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const ProjectWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const steps = [
    { id: "exterior", name: "Exterior Walls", status: "pending" },
    { id: "interior", name: "Interior Walls", status: "pending" },
    { id: "headers", name: "Headers", status: "pending" },
    { id: "hardware", name: "Hardware", status: "pending" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Take-off Wizard</h1>
          <p className="text-muted-foreground">
            AI-powered material takeoff for each framing component
          </p>
        </div>

        <Tabs defaultValue="exterior" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            {steps.map((step) => (
              <TabsTrigger key={step.id} value={step.id} className="text-sm">
                {step.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {steps.map((step) => (
            <TabsContent key={step.id} value={step.id}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="rounded-2xl shadow-lg h-96">
                    <CardContent className="p-6 h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <div className="w-full h-64 bg-muted rounded-lg mb-4 flex items-center justify-center">
                          Plan Canvas Area
                        </div>
                        <p>AI takeoff canvas will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="rounded-2xl shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg">{step.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full rounded-full bg-secondary hover:bg-secondary/90">
                        <Play className="w-4 h-4 mr-2" />
                        Run AI Analysis
                      </Button>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Detected Items:</h4>
                        <div className="text-sm text-muted-foreground">
                          Click "Run AI Analysis" to detect {step.name.toLowerCase()}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => navigate(`/project/${id}/review`)}
                      >
                        Accept & Next
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
