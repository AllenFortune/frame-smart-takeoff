
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageImage } from './PageImage';

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
}

interface PageCarouselViewProps {
  pages: PlanPage[];
  currentPage: number;
  selectedPages: Set<string>;
  imageErrors: Set<string>;
  onPageChange: (pageIndex: number) => void;
  onPageToggle: (pageId: string) => void;
  onImageError: (pageId: string) => void;
  onRetryImage: (pageId: string) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export const PageCarouselView = ({
  pages,
  currentPage,
  selectedPages,
  imageErrors,
  onPageChange,
  onPageToggle,
  onImageError,
  onRetryImage,
  onTouchStart,
  onTouchMove,
  onTouchEnd
}: PageCarouselViewProps) => {
  if (pages.length === 0) return null;

  const currentPageData = pages[currentPage];

  return (
    <div className="p-4">
      <div 
        className="relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Card className="relative overflow-hidden">
          <div className="aspect-[3/4] bg-gray-100 relative">
            <PageImage 
              page={currentPageData}
              imageErrors={imageErrors}
              onImageError={onImageError}
              onRetryImage={onRetryImage}
            />

            {/* Navigation arrows */}
            {currentPage > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 touch-target-large"
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            
            {currentPage < pages.length - 1 && (
              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 touch-target-large"
                onClick={() => onPageChange(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {/* Page indicator */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentPage + 1} of {pages.length}
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Badge variant={selectedPages.has(currentPageData.id) ? "default" : "outline"}>
                {currentPageData.class.replace('_', ' ')} • {Math.round(currentPageData.confidence * 100)}%
              </Badge>
              <Checkbox
                checked={selectedPages.has(currentPageData.id)}
                onCheckedChange={() => onPageToggle(currentPageData.id)}
                className="touch-target-large"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Confidence</span>
                <span>{Math.round(currentPageData.confidence * 100)}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${currentPageData.confidence * 100}%` }}
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
  );
};
