
import React, { useState } from 'react';
import { PlanListSelector } from "./PlanListSelector";
import { PlanTypeRecommendations } from "./PlanTypeRecommendations";
import { PlanPage } from "@/hooks/useProjectData";
import { LocationCard } from "./pageSelection/LocationCard";
import { ManualSelectionCard } from "./pageSelection/ManualSelectionCard";
import { LoadingCard } from "./pageSelection/LoadingCard";

interface EnhancedWizardPageSelectionProps {
  pages: PlanPage[];
  selectedPages: Set<string>;
  loading: boolean;
  onPageToggle: (pageId: string) => void;
  onContinue: (selectedPages: string[]) => void;
}

export const EnhancedWizardPageSelection = ({
  pages,
  selectedPages,
  loading,
  onPageToggle,
  onContinue
}: EnhancedWizardPageSelectionProps) => {
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [showRecommendations, setShowRecommendations] = useState(true);

  const handleSelectAllRelevant = () => {
    const relevant = pages
      .filter(page => 
        page.confidence >= confidenceThreshold[0] && 
        page.class !== 'upload_failed'
      )
      .map(page => page.id);
    
    // Clear current selection and add all relevant pages
    const currentArray = Array.from(selectedPages);
    currentArray.forEach(pageId => onPageToggle(pageId)); // Clear existing
    
    relevant.forEach(pageId => {
      if (!selectedPages.has(pageId)) {
        onPageToggle(pageId); // Add relevant pages
      }
    });
  };

  const handleApplyRecommendations = (recommendedPageIds: string[]) => {
    // Clear current selection
    const currentArray = Array.from(selectedPages);
    currentArray.forEach(pageId => onPageToggle(pageId));
    
    // Add recommended pages
    recommendedPageIds.forEach(pageId => {
      if (!selectedPages.has(pageId)) {
        onPageToggle(pageId);
      }
    });
    
    setShowRecommendations(false);
  };

  const handleContinue = () => {
    onContinue(Array.from(selectedPages));
  };

  if (loading) {
    return <LoadingCard />;
  }

  return (
    <div className="space-y-6">
      <LocationCard 
        selectedState={selectedState}
        onStateChange={setSelectedState}
      />

      {showRecommendations && (
        <PlanTypeRecommendations
          pages={pages}
          selectedState={selectedState}
          onRecommendationApply={handleApplyRecommendations}
        />
      )}

      <ManualSelectionCard
        showRecommendations={showRecommendations}
        onShowRecommendations={setShowRecommendations}
        confidenceThreshold={confidenceThreshold}
        onThresholdChange={setConfidenceThreshold}
        pages={pages}
        selectedPages={selectedPages}
        onSelectAllRelevant={handleSelectAllRelevant}
        onContinue={handleContinue}
      />

      <PlanListSelector
        pages={pages}
        selectedPages={selectedPages}
        confidenceThreshold={confidenceThreshold[0]}
        onPageToggle={onPageToggle}
      />
    </div>
  );
};
