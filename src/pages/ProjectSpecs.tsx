
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, ArrowRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useToast } from "@/hooks/use-toast";

const ProjectSpecs = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [specs, setSpecs] = useState({
    projectName: "Riverside Townhomes - Phase 1",
    lumberSpecies: "douglas-fir",
    windLoad: "90",
    seismicZone: "D1",
    shearWallSpacing: "16",
    headerGrade: "glulam",
  });

  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = (field: string) => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive",
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setSpecs(prev => ({ ...prev, [field]: result }));
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice input failed",
        description: "Please try again or enter manually",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving specs:", specs);
    toast({
      title: "Specs saved!",
      description: "Project specifications have been saved",
    });
    navigate(`/project/${id}/wizard`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Quick Specs Wizard</h1>
            <p className="text-muted-foreground">
              Configure project specifications for accurate material estimates
            </p>
          </div>

          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle>Project Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="projectName"
                      value={specs.projectName}
                      onChange={(e) => setSpecs(prev => ({ ...prev, projectName: e.target.value }))}
                      className="rounded-full"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleVoiceInput('projectName')}
                      disabled={isListening}
                    >
                      <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : ''}`} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lumberSpecies">Lumber Species</Label>
                  <Select
                    value={specs.lumberSpecies}
                    onValueChange={(value) => setSpecs(prev => ({ ...prev, lumberSpecies: value }))}
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="douglas-fir">Douglas Fir</SelectItem>
                      <SelectItem value="southern-pine">Southern Pine</SelectItem>
                      <SelectItem value="hem-fir">Hem-Fir</SelectItem>
                      <SelectItem value="spf">SPF (Spruce-Pine-Fir)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="windLoad">Wind Load (mph)</Label>
                    <Input
                      id="windLoad"
                      value={specs.windLoad}
                      onChange={(e) => setSpecs(prev => ({ ...prev, windLoad: e.target.value }))}
                      className="rounded-full"
                      placeholder="90"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seismicZone">Seismic Zone</Label>
                    <Select
                      value={specs.seismicZone}
                      onValueChange={(value) => setSpecs(prev => ({ ...prev, seismicZone: value }))}
                    >
                      <SelectTrigger className="rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Zone A</SelectItem>
                        <SelectItem value="B">Zone B</SelectItem>
                        <SelectItem value="C">Zone C</SelectItem>
                        <SelectItem value="D1">Zone D1</SelectItem>
                        <SelectItem value="D2">Zone D2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shearWallSpacing">Shear Wall Spacing (in)</Label>
                    <Input
                      id="shearWallSpacing"
                      value={specs.shearWallSpacing}
                      onChange={(e) => setSpecs(prev => ({ ...prev, shearWallSpacing: e.target.value }))}
                      className="rounded-full"
                      placeholder="16"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headerGrade">Header Grade</Label>
                    <Select
                      value={specs.headerGrade}
                      onValueChange={(value) => setSpecs(prev => ({ ...prev, headerGrade: value }))}
                    >
                      <SelectTrigger className="rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="glulam">Glulam</SelectItem>
                        <SelectItem value="lvl">LVL</SelectItem>
                        <SelectItem value="dimensional">Dimensional Lumber</SelectItem>
                        <SelectItem value="steel">Steel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full rounded-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    Save & Continue to Takeoff
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectSpecs;
