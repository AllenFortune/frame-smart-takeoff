
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PageImage } from './PageImage';

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
}

interface PageGridViewProps {
  pages: PlanPage[];
  selectedPages: Set<string>;
  imageErrors: Set<string>;
  onPageToggle: (pageId: string) => void;
  onImageError: (pageId: string) => void;
  onRetryImage: (pageId: string) => void;
  onDoubleTap: (pageId: string) => void;
}

export const PageGridView = ({
  pages,
  selectedPages,
  imageErrors,
  onPageToggle,
  onImageError,
  onRetryImage,
  onDoubleTap
}: PageGridViewProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      {pages.map((page) => (
        <Card 
          key={page.id} 
          className="relative group cursor-pointer hover:shadow-lg transition-shadow touch-target-large"
          onClick={() => onDoubleTap(page.id)}
        >
          <div className="p-4">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3 relative">
              <PageImage 
                page={page}
                imageErrors={imageErrors}
                onImageError={onImageError}
                onRetryImage={onRetryImage}
              />
              
              {/* Selection overlay */}
              {selectedPages.has(page.id) && (
                <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg" />
              )}
            </div>
            
            {/* Page metadata and controls */}
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
  );
};
