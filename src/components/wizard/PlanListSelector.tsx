
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PlanPage } from "@/hooks/useProjectData";
import { FileText, CheckCircle2 } from "lucide-react";

interface PlanListSelectorProps {
  pages: PlanPage[];
  selectedPages: Set<string>;
  confidenceThreshold: number;
  onPageToggle: (pageId: string) => void;
}

export const PlanListSelector = ({
  pages,
  selectedPages,
  confidenceThreshold,
  onPageToggle
}: PlanListSelectorProps) => {
  const filteredPages = pages.filter(page => 
    page.confidence >= confidenceThreshold && 
    page.class !== 'upload_failed'
  );

  const formatPlanTitle = (page: PlanPage) => {
    // Use sheet_number and description if available, otherwise fall back to classification
    if (page.sheet_number && page.description) {
      return `${page.sheet_number} - ${page.description}`;
    } else if (page.sheet_number) {
      return `${page.sheet_number} - ${page.plan_type || page.class}`;
    } else if (page.description) {
      return page.description;
    } else {
      return `Page ${page.page_no} - ${page.class}`;
    }
  };

  const getPlanTypeColor = (planType: string | null, className: string) => {
    const type = planType || className;
    switch (type.toLowerCase()) {
      case 'architectural':
      case 'floor_plan':
      case 'site_plan':
        return 'bg-blue-100 text-blue-800';
      case 'structural':
      case 'framing_plan':
        return 'bg-green-100 text-green-800';
      case 'electrical':
        return 'bg-yellow-100 text-yellow-800';
      case 'mechanical':
        return 'bg-purple-100 text-purple-800';
      case 'plumbing':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (filteredPages.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          No plans match the current confidence threshold.
          <br />
          Try lowering the threshold to see more plans.
        </p>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Available Plans ({filteredPages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredPages.map((page) => {
          const isSelected = selectedPages.has(page.id);
          const planTitle = formatPlanTitle(page);
          
          return (
            <div
              key={page.id}
              className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-muted/30 ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted hover:border-muted-foreground/20'
              }`}
              onClick={() => onPageToggle(page.id)}
            >
              <Checkbox 
                checked={isSelected}
                onChange={() => onPageToggle(page.id)}
                className="pointer-events-none"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {planTitle}
                  </h3>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Page {page.page_no}</span>
                  <span>•</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getPlanTypeColor(page.plan_type, page.class)}`}
                  >
                    {page.plan_type || page.class}
                  </Badge>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(page.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
