
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowRight } from "lucide-react";
import { MobileOptimizedPageGrid } from "@/components/MobileOptimizedPageGrid";
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
      .filter(page => page.confidence >= confidenceThreshold[0])
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

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Select Plan Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose the pages that contain framing information for analysis.
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSelectAllRelevant}
              className="flex-1"
            >
              Select All Relevant ({pages.filter(p => p.confidence >= confidenceThreshold[0]).length})
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
        </CardContent>
      </Card>

      <MobileOptimizedPageGrid
        pages={pages}
        selectedPages={selectedPages}
        confidenceThreshold={confidenceThreshold}
        loading={loading}
        onPageToggle={onPageToggle}
        onConfidenceChange={setConfidenceThreshold}
        onSelectAllRelevant={handleSelectAllRelevant}
        onContinue={handleContinue}
      />
    </div>
  );
};
