
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Info } from "lucide-react";
import { PlanPage } from "@/hooks/useProjectData";

export interface PlanTypeRequirement {
  type: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  stateSpecific?: string[];
  estimatorNotes: string;
}

export const FRAMING_PLAN_REQUIREMENTS: PlanTypeRequirement[] = [
  {
    type: 'floor_plan',
    name: 'Floor Plans',
    description: 'Room layouts, wall locations, dimensions',
    priority: 'essential',
    estimatorNotes: 'Required for wall framing, room dimensions, and layout understanding. Critical for accurate lumber counts.'
  },
  {
    type: 'structural',
    name: 'Structural Plans',
    description: 'Beam schedules, post locations, load paths',
    priority: 'essential',
    estimatorNotes: 'Essential for determining beam sizes, post requirements, and structural lumber specifications.'
  },
  {
    type: 'framing_plan',
    name: 'Framing Plans',
    description: 'Wall framing details, header schedules',
    priority: 'essential',
    estimatorNotes: 'Shows specific framing requirements, header sizes, and construction details. Most important for lumber take-offs.'
  },
  {
    type: 'foundation',
    name: 'Foundation Plans',
    description: 'Stem walls, footings, foundation details',
    priority: 'recommended',
    estimatorNotes: 'Needed for sill plate calculations and foundation-to-framing connections.'
  },
  {
    type: 'roof',
    name: 'Roof Plans',
    description: 'Rafter/truss layout, roof framing',
    priority: 'essential',
    estimatorNotes: 'Critical for roof framing lumber, rafter calculations, and truss specifications.'
  },
  {
    type: 'wall_sections',
    name: 'Wall Sections',
    description: 'Wall assembly details, heights',
    priority: 'recommended',
    estimatorNotes: 'Shows wall heights, assembly details, and specific framing requirements.'
  },
  {
    type: 'structural_details',
    name: 'Structural Details',
    description: 'Connection details, special framing',
    priority: 'recommended',
    stateSpecific: ['CA'],
    estimatorNotes: 'Important for special connections, hold-downs, and state-specific requirements like shear walls.'
  }
];

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
  
  const analyzePageCoverage = () => {
    const coverage: Record<string, { found: boolean; pages: PlanPage[]; confidence: number }> = {};
    
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

  const coverage = analyzePageCoverage();
  
  const getRecommendedPages = () => {
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

  const handleApplyRecommendations = () => {
    const recommendedPageIds = getRecommendedPages();
    onRecommendationApply(recommendedPageIds);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-800';
      case 'recommended': return 'bg-yellow-100 text-yellow-800';
      case 'optional': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const essentialMissing = FRAMING_PLAN_REQUIREMENTS
    .filter(req => req.priority === 'essential' && !coverage[req.type].found).length;

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="w-5 h-5" />
          Framing Estimator Recommendations
        </CardTitle>
        {essentialMissing > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-amber-800 text-sm font-medium">
                {essentialMissing} essential plan type{essentialMissing > 1 ? 's' : ''} missing for accurate framing estimate
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          As an expert framing estimator, these plan types are recommended for accurate lumber take-offs:
        </div>

        <div className="space-y-3">
          {FRAMING_PLAN_REQUIREMENTS.map((req) => {
            const planCoverage = coverage[req.type];
            const isStateSpecific = req.stateSpecific?.includes(selectedState || '');
            const showRequirement = !req.stateSpecific || isStateSpecific;
            
            if (!showRequirement) return null;

            return (
              <div key={req.type} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {planCoverage.found ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <h4 className="font-medium text-sm">{req.name}</h4>
                    <Badge variant="outline" className={getPriorityColor(req.priority)}>
                      {req.priority}
                    </Badge>
                    {isStateSpecific && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {selectedState} Required
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">{req.description}</p>
                <p className="text-xs bg-blue-50 text-blue-800 p-2 rounded">
                  <strong>Estimator Note:</strong> {req.estimatorNotes}
                </p>
                
                {planCoverage.found && (
                  <div className="mt-2 text-xs text-green-700">
                    ✓ Found {planCoverage.pages.length} matching page{planCoverage.pages.length > 1 ? 's' : ''} 
                    (avg. {Math.round(planCoverage.confidence * 100)}% confidence)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={handleApplyRecommendations}
          className="w-full mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          Apply Expert Recommendations ({getRecommendedPages().length} pages)
        </button>
      </CardContent>
    </Card>
  );
};
