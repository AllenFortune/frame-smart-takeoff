
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlanPage } from '@/hooks/useProjectData';

interface PageSelectorProps {
  pages: PlanPage[];
  selectedPageId?: string;
  onPageSelect: (pageId: string) => void;
  loading?: boolean;
}

export const PageSelector = ({ 
  pages, 
  selectedPageId, 
  onPageSelect, 
  loading 
}: PageSelectorProps) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No pages available</p>
        <p className="text-xs">Upload plans first</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {pages.map((page) => (
          <Button
            key={page.id}
            variant={selectedPageId === page.id ? "default" : "outline"}
            className="w-full justify-start h-auto p-3"
            onClick={() => onPageSelect(page.id)}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-medium">Page {page.page_no}</div>
                  <div className="text-xs text-muted-foreground">
                    {page.class}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge 
                  variant={page.confidence >= 0.7 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {Math.round(page.confidence * 100)}%
                </Badge>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};
