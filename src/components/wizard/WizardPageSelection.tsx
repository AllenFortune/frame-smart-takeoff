
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowRight } from "lucide-react";
import { PlanListSelector } from "./PlanListSelector";
import { PlanPage } from "@/hooks/useProjectData";

interface WizardPageSelectionProps {
  pages: PlanPage[];
  selectedPages: Set<string>;
  loading: boolean;
  onPageToggle: (pageId: string) => void;
  onContinue: (selectedPages: string[]) => void;
}

export const WizardPageSelection = ({
  pages,
  selectedPages,
  loading,
  onPageToggle,
  onContinue
}: WizardPageSelectionProps) => {
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);

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

  const handleContinue = () => {
    onContinue(Array.from(selectedPages));
  };

  const getSelectedPlanNames = () => {
    return Array.from(selectedPages)
      .map(pageId => {
        const page = pages.find(p => p.id === pageId);
        if (!page) return '';
        
        if (page.sheet_number && page.description) {
          return `${page.sheet_number} - ${page.description}`;
        } else if (page.sheet_number) {
          return `${page.sheet_number}`;
        } else {
          return `Page ${page.page_no}`;
        }
      })
      .filter(Boolean)
      .slice(0, 3) // Show first 3
      .join(', ');
  };

  const selectedNames = getSelectedPlanNames();
  const hasMoreSelected = selectedPages.size > 3;

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading plan information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Select Plans for Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose the plans that contain framing information for analysis. Plans are listed by sheet number and description.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Confidence Threshold: {Math.round(confidenceThreshold[0] * 100)}%</label>
              <Slider
                value={confidenceThreshold}
                onValueChange={setConfidenceThreshold}
                max={1}
                min={0.1}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSelectAllRelevant}
              className="flex-1"
            >
              Select All Relevant ({pages.filter(p => p.confidence >= confidenceThreshold[0] && p.class !== 'upload_failed').length})
            </Button>
            <Button 
              onClick={handleContinue}
              disabled={selectedPages.size === 0}
              className="flex-1"
            >
              Continue ({selectedPages.size} selected)
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {selectedPages.size > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Selected Plans:</p>
              <p className="text-sm text-muted-foreground">
                {selectedNames}
                {hasMoreSelected && ` and ${selectedPages.size - 3} more`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PlanListSelector
        pages={pages}
        selectedPages={selectedPages}
        confidenceThreshold={confidenceThreshold[0]}
        onPageToggle={onPageToggle}
      />
    </div>
  );
};
