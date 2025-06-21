import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PageImage } from '@/components/ui/page-image';

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
}

interface PageGridProps {
  projectId: string;
  onContinue: (selectedPages: string[]) => void;
}

export const PageGrid = ({ projectId, onContinue }: PageGridProps) => {
  const [pages, setPages] = useState<PlanPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchPages();
  }, [projectId]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_pages')
        .select('*')
        .eq('project_id', projectId)
        .order('page_no');

      if (error) throw error;
      setPages(data || []);
      
      // Auto-select pages above confidence threshold
      const autoSelected = (data || [])
        .filter(page => page.confidence >= confidenceThreshold[0])
        .map(page => page.id);
      setSelectedPages(new Set(autoSelected));
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({
        title: "Error",
        description: "Failed to load plan pages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (pageId: string) => {
    setImageErrors(prev => new Set([...prev, pageId]));
  };

  const handleRetryImage = (pageId: string) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(pageId);
      return newSet;
    });
  };

  const togglePage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const selectAllRelevant = () => {
    const relevant = pages
      .filter(page => page.confidence >= confidenceThreshold[0])
      .map(page => page.id);
    setSelectedPages(new Set(relevant));
  };

  const filteredPages = pages.filter(page => page.confidence >= confidenceThreshold[0]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading plan pages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Plan Page Review</h2>
          <p className="text-muted-foreground">
            Select the relevant pages for framing takeoff
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={selectAllRelevant}>
            Select All Relevant
          </Button>
          <Button 
            onClick={() => onContinue(Array.from(selectedPages))}
            disabled={selectedPages.size === 0}
          >
            Continue to Specs ({selectedPages.size} selected)
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Confidence Threshold: {Math.round(confidenceThreshold[0] * 100)}%
          </label>
          <Slider
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            max={1}
            min={0}
            step={0.1}
            className="w-full max-w-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPages.map((page) => (
          <Card key={page.id} className="relative group cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                <PageImage 
                  page={page}
                  imageErrors={imageErrors}
                  onImageError={handleImageError}
                  onRetryImage={handleRetryImage}
                  projectId={projectId}
                  preferredResolution="thumbnail"
                  showResolutionControls={false}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant={selectedPages.has(page.id) ? "default" : "outline"}>
                    {page.class.replace('_', ' ')} • {Math.round(page.confidence * 100)}%
                  </Badge>
                  <Checkbox
                    checked={selectedPages.has(page.id)}
                    onCheckedChange={() => togglePage(page.id)}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confidence</span>
                    <span>{Math.round(page.confidence * 100)}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${page.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No pages meet the current confidence threshold. Try lowering the threshold.
          </p>
        </div>
      )}
    </div>
  );
};
