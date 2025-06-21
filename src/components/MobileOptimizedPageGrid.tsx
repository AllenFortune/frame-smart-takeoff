import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Grid, List } from "lucide-react";
import { PageImage } from './pages/PageImage';
import { PlanPage } from "@/hooks/useProjectData"; // Use the correct import

interface MobileOptimizedPageGridProps {
  pages: PlanPage[];
  selectedPages: Set<string>;
  confidenceThreshold: number[];
  loading: boolean;
  onPageToggle: (pageId: string) => void;
  onConfidenceChange: (threshold: number[]) => void;
  onSelectAllRelevant: () => void;
  onContinue: () => void;
}

export const MobileOptimizedPageGrid = ({
  pages,
  selectedPages,
  confidenceThreshold,
  loading,
  onPageToggle,
  onConfidenceChange,
  onSelectAllRelevant,
  onContinue
}: MobileOptimizedPageGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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

  const handleDoubleTap = (pageId: string) => {
    onPageToggle(pageId);
  };

  const filteredPages = pages.filter(page => 
    page.confidence >= confidenceThreshold[0] && 
    page.class !== 'upload_failed'
  );

  const relevantPages = pages.filter(page => page.confidence >= confidenceThreshold[0]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filter by Confidence</h3>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Minimum: {Math.round(confidenceThreshold[0] * 100)}%</span>
              <span>{relevantPages.length} pages match</span>
            </div>
            <Slider
              value={confidenceThreshold}
              onValueChange={onConfidenceChange}
              max={1}
              min={0}
              step={0.05}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onSelectAllRelevant}
              className="flex-1"
            >
              Select All Relevant ({relevantPages.length})
            </Button>
            <Button 
              onClick={onContinue}
              disabled={selectedPages.size === 0}
              className="flex-1"
            >
              Continue ({selectedPages.size})
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Pages Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPages.map((page) => (
            <Card 
              key={page.id} 
              className="relative group cursor-pointer hover:shadow-lg transition-shadow touch-target-large"
              onClick={() => handleDoubleTap(page.id)}
            >
              <div className="p-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3 relative">
                  <PageImage 
                    page={page}
                    imageErrors={imageErrors}
                    onImageError={handleImageError}
                    onRetryImage={handleRetryImage}
                    projectId={page.project_id}
                  />
                  
                  {selectedPages.has(page.id) && (
                    <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant={selectedPages.has(page.id) ? "default" : "outline"}>
                      {page.class.replace('_', ' ')} • {Math.round(page.confidence * 100)}%
                    </Badge>
                    <Checkbox
                      checked={selectedPages.has(page.id)}
                      onCheckedChange={() => onPageToggle(page.id)}
                      className="touch-target-large"
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
      ) : (
        <div className="space-y-2">
          {filteredPages.map((page) => (
            <Card 
              key={page.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleDoubleTap(page.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <PageImage 
                    page={page}
                    imageErrors={imageErrors}
                    onImageError={handleImageError}
                    onRetryImage={handleRetryImage}
                    projectId={page.project_id}
                    preferredResolution="thumbnail"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={selectedPages.has(page.id) ? "default" : "outline"}>
                      {page.class.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(page.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div className="h-1 bg-muted rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${page.confidence * 100}%` }}
                    />
                  </div>
                </div>
                
                <Checkbox
                  checked={selectedPages.has(page.id)}
                  onCheckedChange={() => onPageToggle(page.id)}
                  className="touch-target-large"
                />
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {filteredPages.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No pages match the current confidence threshold.
            <br />
            Try lowering the threshold to see more pages.
          </p>
        </Card>
      )}
    </div>
  );
};
