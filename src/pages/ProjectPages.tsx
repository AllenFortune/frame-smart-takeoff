
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectData } from '@/hooks/useProjectData';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppNavbar } from '@/components/AppNavbar';
import { MobileOptimizedPageGrid } from '@/components/MobileOptimizedPageGrid';

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

  const handleConfidenceChange = (threshold: number[]) => {
    setConfidenceThreshold(threshold);
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
        title: "No Pages Selected",
        description: "Please select at least one page to continue.",
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
            <h1 className="text-3xl font-bold">Select Pages for Analysis</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Choose which pages you want to include in the framing analysis. 
            Pages are automatically classified and scored by confidence level.
          </p>
        </div>

        <MobileOptimizedPageGrid
          pages={pages}
          selectedPages={selectedPages}
          confidenceThreshold={confidenceThreshold}
          loading={loading}
          onPageToggle={handlePageToggle}
          onConfidenceChange={handleConfidenceChange}
          onSelectAllRelevant={handleSelectAllRelevant}
          onContinue={handleContinue}
        />
      </div>
    </div>
  );
};

export default ProjectPages;
