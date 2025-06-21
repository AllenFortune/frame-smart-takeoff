
import React, { useState } from 'react';
import { PageControlsCard } from './pages/PageControlsCard';
import { PageDisplaySection } from './pages/PageDisplaySection';
import { PlanPage } from "@/hooks/useProjectData";

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
      <PageControlsCard
        viewMode={viewMode}
        confidenceThreshold={confidenceThreshold}
        relevantPagesCount={relevantPages.length}
        selectedPagesCount={selectedPages.size}
        onViewModeChange={setViewMode}
        onConfidenceChange={onConfidenceChange}
        onSelectAllRelevant={onSelectAllRelevant}
        onContinue={onContinue}
      />

      <PageDisplaySection
        viewMode={viewMode}
        filteredPages={filteredPages}
        selectedPages={selectedPages}
        imageErrors={imageErrors}
        onPageToggle={onPageToggle}
        onImageError={handleImageError}
        onRetryImage={handleRetryImage}
        onDoubleTap={handleDoubleTap}
        projectId={pages[0]?.project_id}
      />
    </div>
  );
};
