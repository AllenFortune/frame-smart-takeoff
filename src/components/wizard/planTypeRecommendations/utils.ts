
import { PlanPage } from "@/hooks/useProjectData";
import { FRAMING_PLAN_REQUIREMENTS, PlanTypeRequirement } from "./constants";

export interface PlanCoverage {
  found: boolean;
  pages: PlanPage[];
  confidence: number;
}

export const analyzePageCoverage = (pages: PlanPage[]): Record<string, PlanCoverage> => {
  const coverage: Record<string, PlanCoverage> = {};
  
  FRAMING_PLAN_REQUIREMENTS.forEach(req => {
    const matchingPages = pages.filter(page => {
      const pageType = page.class.toLowerCase();
      const planType = page.plan_type?.toLowerCase() || '';
      const description = page.description?.toLowerCase() || '';
      
      return pageType.includes(req.type) || 
             planType.includes(req.type) || 
             description.includes(req.name.toLowerCase()) ||
             (req.type === 'floor_plan' && (pageType.includes('architectural') || planType.includes('floor'))) ||
             (req.type === 'structural' && (pageType.includes('structural') || planType.includes('beam'))) ||
             (req.type === 'framing_plan' && (pageType.includes('framing') || description.includes('framing')));
    });
    
    const avgConfidence = matchingPages.length > 0 
      ? matchingPages.reduce((sum, p) => sum + p.confidence, 0) / matchingPages.length 
      : 0;
      
    coverage[req.type] = {
      found: matchingPages.length > 0,
      pages: matchingPages,
      confidence: avgConfidence
    };
  });
  
  return coverage;
};

export const getRecommendedPages = (
  coverage: Record<string, PlanCoverage>,
  selectedState?: string
): string[] => {
  const recommended: string[] = [];
  
  FRAMING_PLAN_REQUIREMENTS.forEach(req => {
    if (req.priority === 'essential' || 
        (req.stateSpecific?.includes(selectedState || '') && req.priority === 'recommended')) {
      const planCoverage = coverage[req.type];
      if (planCoverage.found && planCoverage.pages.length > 0) {
        // Add the highest confidence page for this requirement
        const bestPage = planCoverage.pages.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        recommended.push(bestPage.id);
      }
    }
  });
  
  return recommended;
};
