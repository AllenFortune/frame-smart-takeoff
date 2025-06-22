
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectData } from '@/hooks/useProjectData';
import { usePageSelection } from '@/hooks/usePageSelection';
import { LoadingCard } from './pageSelection/LoadingCard';
import { LocationCard } from './pageSelection/LocationCard';
import { ManualSelectionCard } from './pageSelection/ManualSelectionCard';
import { PageSelectionDebugCard } from './pageSelection/PageSelectionDebugCard';
import { PlanTypeRecommendations } from './PlanTypeRecommendations';
import { MobileOptimizedPageGrid } from '../MobileOptimizedPageGrid';

interface EnhancedWizardPageSelectionProps {
  pages?: any[];
  selectedPages?: Set<string>;
  loading?: boolean;
  onPageToggle?: (pageId: string) => void;
  onContinue?: (selectedPages: string[]) => void;
}

export const EnhancedWizardPageSelection = ({
  pages: propPages,
  selectedPages: propSelectedPages,
  loading: propLoading,
  onPageToggle: propOnPageToggle,
  onContinue: propOnContinue
}: EnhancedWizardPageSelectionProps = {}) => {
  const { id } = useParams();
  const { pages: hookPages, loading: hookLoading } = useProjectData(id!);
  const [selectedState, setSelectedState] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);
  
  // Use props if provided, otherwise use hook data
  const pages = propPages || hookPages;
  const loading = propLoading !== undefined ? propLoading : hookLoading;
  
  const {
    selectedPages,
    handlePageToggle: togglePage,
    handlePageSelectionContinue: handleContinue
  } = usePageSelection(id!, [], () => {}, () => {}, () => true);

  // Use prop handlers if provided, otherwise use hook handlers
  const onPageToggle = propOnPageToggle || togglePage;
  const onContinue = propOnContinue || ((selectedPageIds: string[]) => handleContinue(selectedPageIds));

  const actualSelectedPages = propSelectedPages || selectedPages;

  const selectAllRelevant = () => {
    const relevant = pages
      .filter(page => page.confidence >= confidenceThreshold[0])
      .map(page => page.id);
    relevant.forEach(pageId => onPageToggle(pageId));
  };

  const handleContinueWrapper = () => {
    const selectedPageIds = Array.from(actualSelectedPages);
    onContinue(selectedPageIds);
  };

  const handleRecommendationApply = (recommendedPageIds: string[]) => {
    recommendedPageIds.forEach(pageId => {
      if (!actualSelectedPages.has(pageId)) {
        onPageToggle(pageId);
      }
    });
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingCard />
      ) : (
        <>
          <LocationCard
            selectedState={selectedState}
            onStateChange={setSelectedState}
          />

          {/* Add debug card when there are image loading issues */}
          {pages.some(p => !p.thumbnail_url && !p.preview_url && !p.img_url) && (
            <PageSelectionDebugCard 
              projectId={id}
              onRefresh={() => window.location.reload()}
            />
          )}

          <ManualSelectionCard
            showRecommendations={showRecommendations}
            onShowRecommendations={setShowRecommendations}
            confidenceThreshold={confidenceThreshold}
            onThresholdChange={setConfidenceThreshold}
            pages={pages}
            selectedPages={actualSelectedPages}
            onSelectAllRelevant={selectAllRelevant}
            onContinue={handleContinueWrapper}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {!showRecommendations ? (
                <MobileOptimizedPageGrid
                  pages={pages}
                  selectedPages={actualSelectedPages}
                  confidenceThreshold={confidenceThreshold}
                  loading={loading}
                  onPageToggle={onPageToggle}
                  onConfidenceChange={setConfidenceThreshold}
                  onSelectAllRelevant={selectAllRelevant}
                  onContinue={handleContinueWrapper}
                />
              ) : (
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Plan Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MobileOptimizedPageGrid
                      pages={pages}
                      selectedPages={actualSelectedPages}
                      confidenceThreshold={confidenceThreshold}
                      loading={loading}
                      onPageToggle={onPageToggle}
                      onConfidenceChange={setConfidenceThreshold}
                      onSelectAllRelevant={selectAllRelevant}
                      onContinue={handleContinueWrapper}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {showRecommendations && (
              <div className="space-y-6">
                <PlanTypeRecommendations 
                  pages={pages}
                  selectedState={selectedState}
                  onRecommendationApply={handleRecommendationApply}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
