
import React from 'react';
import { Card } from "@/components/ui/card";
import { PageGridView } from './PageGridView';
import { PageListView } from './PageListView';
import { PlanPage } from "@/hooks/useProjectData";

interface PageDisplaySectionProps {
  viewMode: 'grid' | 'list';
  filteredPages: PlanPage[];
  selectedPages: Set<string>;
  imageErrors: Set<string>;
  onPageToggle: (pageId: string) => void;
  onImageError: (pageId: string) => void;
  onRetryImage: (pageId: string) => void;
  onDoubleTap: (pageId: string) => void;
  projectId?: string;
}

export const PageDisplaySection = ({
  viewMode,
  filteredPages,
  selectedPages,
  imageErrors,
  onPageToggle,
  onImageError,
  onRetryImage,
  onDoubleTap,
  projectId
}: PageDisplaySectionProps) => {
  if (filteredPages.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No pages match the current confidence threshold.
          <br />
          Try lowering the threshold to see more pages.
        </p>
      </Card>
    );
  }

  if (viewMode === 'grid') {
    return (
      <PageGridView
        pages={filteredPages}
        selectedPages={selectedPages}
        imageErrors={imageErrors}
        onPageToggle={onPageToggle}
        onImageError={onImageError}
        onRetryImage={onRetryImage}
        onDoubleTap={onDoubleTap}
        projectId={projectId}
      />
    );
  }

  return (
    <PageListView
      pages={filteredPages}
      selectedPages={selectedPages}
      imageErrors={imageErrors}
      onPageToggle={onPageToggle}
      onImageError={onImageError}
      onRetryImage={onRetryImage}
      onDoubleTap={onDoubleTap}
      projectId={projectId}
    />
  );
};
