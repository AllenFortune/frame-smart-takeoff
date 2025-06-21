
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
  thumbnail_url: string | null;
  preview_url: string | null;
  full_url: string | null;
}

interface PageListViewProps {
  pages: PlanPage[];
  selectedPages: Set<string>;
  imageErrors: Set<string>;
  onPageToggle: (pageId: string) => void;
  onImageError: (pageId: string) => void;
  onRetryImage: (pageId: string) => void;
  onDoubleTap: (pageId: string) => void;
  projectId?: string;
}

export const PageListView = ({
  pages,
  selectedPages,
  imageErrors,
  onPageToggle,
  onImageError,
  onRetryImage,
  onDoubleTap,
  projectId
}: PageListViewProps) => {
  return (
    <div className="space-y-2">
      {pages.map((page) => (
        <Card 
          key={page.id} 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onDoubleTap(page.id)}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              <PageImage 
                page={page}
                imageErrors={imageErrors}
                onImageError={onImageError}
                onRetryImage={onRetryImage}
                projectId={projectId}
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
  );
};
