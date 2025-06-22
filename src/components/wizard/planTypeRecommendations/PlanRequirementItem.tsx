
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { PlanTypeRequirement } from "./constants";
import { PlanCoverage } from "./utils";

interface PlanRequirementItemProps {
  requirement: PlanTypeRequirement;
  coverage: PlanCoverage;
  selectedState?: string;
}

export const PlanRequirementItem = ({ 
  requirement, 
  coverage, 
  selectedState 
}: PlanRequirementItemProps) => {
  const isStateSpecific = requirement.stateSpecific?.includes(selectedState || '');
  const showRequirement = !requirement.stateSpecific || isStateSpecific;
  
  if (!showRequirement) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-800';
      case 'recommended': return 'bg-yellow-100 text-yellow-800';
      case 'optional': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {coverage.found ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
          <h4 className="font-medium text-sm">{requirement.name}</h4>
          <Badge variant="outline" className={getPriorityColor(requirement.priority)}>
            {requirement.priority}
          </Badge>
          {isStateSpecific && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {selectedState} Required
            </Badge>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">{requirement.description}</p>
      <p className="text-xs bg-blue-50 text-blue-800 p-2 rounded">
        <strong>Estimator Note:</strong> {requirement.estimatorNotes}
      </p>
      
      {coverage.found && (
        <div className="mt-2 text-xs text-green-700">
          ✓ Found {coverage.pages.length} matching page{coverage.pages.length > 1 ? 's' : ''} 
          (avg. {Math.round(coverage.confidence * 100)}% confidence)
        </div>
      )}
    </div>
  );
};
