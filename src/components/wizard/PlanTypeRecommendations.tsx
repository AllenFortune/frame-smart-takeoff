
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { PlanPage } from "@/hooks/useProjectData";
import { FRAMING_PLAN_REQUIREMENTS } from "./planTypeRecommendations/constants";
import { analyzePageCoverage, getRecommendedPages } from "./planTypeRecommendations/utils";
import { PlanRequirementItem } from "./planTypeRecommendations/PlanRequirementItem";
import { RecommendationHeader } from "./planTypeRecommendations/RecommendationHeader";

export interface PlanTypeRequirement {
  type: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  stateSpecific?: string[];
  estimatorNotes: string;
}

export { FRAMING_PLAN_REQUIREMENTS };

interface PlanTypeRecommendationsProps {
  pages: PlanPage[];
  selectedState?: string;
  onRecommendationApply: (recommendedPageIds: string[]) => void;
}

export const PlanTypeRecommendations = ({ 
  pages, 
  selectedState, 
  onRecommendationApply 
}: PlanTypeRecommendationsProps) => {
  const coverage = analyzePageCoverage(pages);
  
  const handleApplyRecommendations = () => {
    const recommendedPageIds = getRecommendedPages(coverage, selectedState);
    onRecommendationApply(recommendedPageIds);
  };

  const essentialMissing = FRAMING_PLAN_REQUIREMENTS
    .filter(req => req.priority === 'essential' && !coverage[req.type].found).length;

  return (
    <Card className="rounded-2xl shadow-lg">
      <RecommendationHeader essentialMissing={essentialMissing} />
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          As an expert framing estimator, these plan types are recommended for accurate lumber take-offs:
        </div>

        <div className="space-y-3">
          {FRAMING_PLAN_REQUIREMENTS.map((requirement) => (
            <PlanRequirementItem
              key={requirement.type}
              requirement={requirement}
              coverage={coverage[requirement.type]}
              selectedState={selectedState}
            />
          ))}
        </div>

        <button
          onClick={handleApplyRecommendations}
          className="w-full mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Apply Expert Recommendations ({getRecommendedPages(coverage, selectedState).length} pages)
        </button>
      </CardContent>
    </Card>
  );
};
