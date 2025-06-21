
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppNavbar } from '@/components/AppNavbar';
import { PlanListSelector } from '@/components/wizard/PlanListSelector';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const ProjectPages = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { pages, loading } = useProjectData(id!);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);

  // Load previously selected pages from localStorage
  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`selected-pages-${id}`);
      if (saved) {
        try {
          const pageIds = JSON.parse(saved);
          setSelectedPages(new Set(pageIds));
        } catch (error) {
          console.error('Error loading saved page selection:', error);
        }
      }
    }
  }, [id]);

  // Save selected pages to localStorage whenever selection changes
  useEffect(() => {
    if (id && selectedPages.size > 0) {
      localStorage.setItem(`selected-pages-${id}`, JSON.stringify(Array.from(selectedPages)));
    }
  }, [id, selectedPages]);

  const handlePageToggle = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAllRelevant = () => {
    const relevantPages = pages.filter(page => 
      page.confidence >= confidenceThreshold[0] && 
      page.class !== 'upload_failed'
    );
    setSelectedPages(new Set(relevantPages.map(p => p.id)));
  };

  const handleContinue = () => {
    if (selectedPages.size === 0) {
      toast({
        title: "No Plans Selected",
        description: "Please select at least one plan to continue.",
        variant: "destructive"
      });
      return;
    }

    navigate(`/project/${id}/specs`);
  };

  const handleBack = () => {
    navigate(`/project/${id}/preflight`);
  };

  if (!id) {
    return <div>Project ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Select Plans for Analysis</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Choose which plans you want to include in the framing analysis. 
            Plans are automatically classified and organized by sheet number and type.
          </p>
        </div>

        {loading ? (
          <Card className="rounded-2xl shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading plan information...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Plan Selection Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Confidence Threshold: {Math.round(confidenceThreshold[0] * 100)}%
                  </label>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleSelectAllRelevant}
                    className="flex-1"
                  >
                    Select All Relevant ({pages.filter(p => p.confidence >= confidenceThreshold[0] && p.class !== 'upload_failed').length})
                  </Button>
                  <Button 
                    onClick={handleContinue}
                    disabled={selectedPages.size === 0}
                    className="flex-1"
                  >
                    Continue with Selected ({selectedPages.size})
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <PlanListSelector
              pages={pages}
              selectedPages={selectedPages}
              confidenceThreshold={confidenceThreshold[0]}
              onPageToggle={handlePageToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPages;
