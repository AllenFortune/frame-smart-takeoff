
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PageGridHeader } from './pages/PageGridHeader';
import { PageGridView } from './pages/PageGridView';
import { PageCarouselView } from './pages/PageCarouselView';

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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filteredPages = pages.filter(page => page.confidence >= confidenceThreshold[0]);

  const handleImageError = (pageId: string) => {
    setImageErrors(prev => new Set([...prev, pageId]));
  };

  const retryImage = (pageId: string) => {
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(pageId);
      return newSet;
    });
  };

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
      <PageGridHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        confidenceThreshold={confidenceThreshold}
        onConfidenceChange={onConfidenceChange}
        filteredPagesCount={filteredPages.length}
        selectedPagesCount={selectedPages.size}
        onSelectAllRelevant={onSelectAllRelevant}
        onContinue={() => onContinue(Array.from(selectedPages))}
      />

      {/* Grid View */}
      {viewMode === 'grid' && (
        <PageGridView
          pages={filteredPages}
          selectedPages={selectedPages}
          imageErrors={imageErrors}
          onPageToggle={onPageToggle}
          onImageError={handleImageError}
          onRetryImage={retryImage}
          onDoubleTap={handleDoubleTap}
        />
      )}

      {/* Carousel View */}
      {viewMode === 'carousel' && (
        <PageCarouselView
          pages={filteredPages}
          currentPage={currentPage}
          selectedPages={selectedPages}
          imageErrors={imageErrors}
          onPageChange={setCurrentPage}
          onPageToggle={onPageToggle}
          onImageError={handleImageError}
          onRetryImage={retryImage}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
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
