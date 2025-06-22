import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectData } from '@/hooks/useProjectData';
import { usePageSelection } from '@/hooks/usePageSelection';
import { LoadingCard } from './pageSelection/LoadingCard';
import { LocationCard } from './pageSelection/LocationCard';
import { ManualSelectionCard } from './pageSelection/ManualSelectionCard';
import { PlanTypeRecommendations } from './pageSelection/PlanTypeRecommendations';
import { MobileOptimizedPageGrid } from '../MobileOptimizedPageGrid';
import { PageSelectionDebugCard } from "./pageSelection/PageSelectionDebugCard";

export const EnhancedWizardPageSelection = () => {
  const { id } = useParams();
  const { pages, loading } = useProjectData(id!);
  const [selectedState, setSelectedState] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);
  
  const {
    selectedPages,
    handlePageToggle: togglePage,
    handlePageSelectionContinue: handleContinue
  } = usePageSelection(id!, [], () => {}, () => {}, () => {});

  const selectAllRelevant = () => {
    const relevant = pages
      .filter(page => page.confidence >= confidenceThreshold[0])
      .map(page => page.id);
    // This would need to be connected to the actual selection logic
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
            selectedPages={selectedPages}
            onSelectAllRelevant={selectAllRelevant}
            onContinue={handleContinue}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {!showRecommendations ? (
                <MobileOptimizedPageGrid
                  pages={pages}
                  selectedPages={selectedPages}
                  confidenceThreshold={confidenceThreshold}
                  loading={loading}
                  onPageToggle={togglePage}
                  onConfidenceChange={setConfidenceThreshold}
                  onSelectAllRelevant={selectAllRelevant}
                  onContinue={handleContinue}
                />
              ) : (
                <Card className="rounded-2xl shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg">Plan Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MobileOptimizedPageGrid
                      pages={pages}
                      selectedPages={selectedPages}
                      confidenceThreshold={confidenceThreshold}
                      loading={loading}
                      onPageToggle={togglePage}
                      onConfidenceChange={setConfidenceThreshold}
                      onSelectAllRelevant={selectAllRelevant}
                      onContinue={handleContinue}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {showRecommendations && (
              <div className="space-y-6">
                <PlanTypeRecommendations 
                  pages={pages}
                  selectedPages={selectedPages}
                  onPageToggle={togglePage}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
