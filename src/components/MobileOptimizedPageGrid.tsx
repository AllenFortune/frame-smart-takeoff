
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
}

interface MobileOptimizedPageGridProps {
  pages: PlanPage[];
  selectedPages: Set<string>;
  confidenceThreshold: number[];
  loading: boolean;
  onPageToggle: (pageId: string) => void;
  onConfidenceChange: (value: number[]) => void;
  onSelectAllRelevant: () => void;
  onContinue: (selectedPages: string[]) => void;
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
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const { toast } = useToast();

  const filteredPages = pages.filter(page => page.confidence >= confidenceThreshold[0]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0 && currentPage < filteredPages.length - 1) {
        // Swipe left - next page
        setCurrentPage(prev => prev + 1);
        navigator.vibrate?.(50); // Haptic feedback
      } else if (diff < 0 && currentPage > 0) {
        // Swipe right - previous page
        setCurrentPage(prev => prev - 1);
        navigator.vibrate?.(50);
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Double tap to toggle selection
  const handleDoubleTap = (pageId: string) => {
    onPageToggle(pageId);
    navigator.vibrate?.(100);
    toast({
      title: selectedPages.has(pageId) ? "Page deselected" : "Page selected",
      duration: 1000
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading plan pages...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/60 border-b p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Plan Pages</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'carousel' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('carousel')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Confidence: {Math.round(confidenceThreshold[0] * 100)}%
            </label>
            <Slider
              value={confidenceThreshold}
              onValueChange={onConfidenceChange}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onSelectAllRelevant}
              className="flex-1"
            >
              Select All ({filteredPages.length})
            </Button>
            <Button 
              onClick={() => onContinue(Array.from(selectedPages))}
              disabled={selectedPages.size === 0}
              className="flex-1"
            >
              Continue ({selectedPages.size})
            </Button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
          {filteredPages.map((page) => (
            <Card 
              key={page.id} 
              className="relative group cursor-pointer hover:shadow-lg transition-shadow touch-target-large"
              onClick={() => handleDoubleTap(page.id)}
            >
              <div className="p-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3 relative">
                  {page.img_url ? (
                    <img 
                      src={page.img_url} 
                      alt={`Page ${page.page_no}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Page {page.page_no}
                    </div>
                  )}
                  
                  {/* Selection overlay */}
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
      )}

      {/* Carousel View */}
      {viewMode === 'carousel' && filteredPages.length > 0 && (
        <div className="p-4">
          <div 
            className="relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Card className="relative overflow-hidden">
              <div className="aspect-[3/4] bg-gray-100 relative">
                {filteredPages[currentPage]?.img_url ? (
                  <img 
                    src={filteredPages[currentPage].img_url} 
                    alt={`Page ${filteredPages[currentPage].page_no}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Page {filteredPages[currentPage]?.page_no}
                  </div>
                )}

                {/* Navigation arrows */}
                {currentPage > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 touch-target-large"
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                )}
                
                {currentPage < filteredPages.length - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 touch-target-large"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}

                {/* Page indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {currentPage + 1} of {filteredPages.length}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Badge variant={selectedPages.has(filteredPages[currentPage]?.id) ? "default" : "outline"}>
                    {filteredPages[currentPage]?.class.replace('_', ' ')} • {Math.round(filteredPages[currentPage]?.confidence * 100)}%
                  </Badge>
                  <Checkbox
                    checked={selectedPages.has(filteredPages[currentPage]?.id)}
                    onCheckedChange={() => onPageToggle(filteredPages[currentPage]?.id)}
                    className="touch-target-large"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confidence</span>
                    <span>{Math.round(filteredPages[currentPage]?.confidence * 100)}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${filteredPages[currentPage]?.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Swipe hint */}
            <p className="text-xs text-muted-foreground text-center mt-2">
              Swipe left/right or use arrows to navigate • Double tap to select
            </p>
          </div>
        </div>
      )}

      {filteredPages.length === 0 && (
        <div className="text-center py-12 px-4">
          <p className="text-muted-foreground">
            No pages meet the current confidence threshold. Try lowering the threshold.
          </p>
        </div>
      )}
    </div>
  );
};
