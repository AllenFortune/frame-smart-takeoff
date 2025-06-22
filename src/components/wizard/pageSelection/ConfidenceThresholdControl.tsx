
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ConfidenceThresholdControlProps {
  confidenceThreshold: number[];
  onThresholdChange: (value: number[]) => void;
  pages: any[];
  onSelectAllRelevant: () => void;
}

export const ConfidenceThresholdControl = ({
  confidenceThreshold,
  onThresholdChange,
  pages,
  onSelectAllRelevant
}: ConfidenceThresholdControlProps) => {
  const relevantCount = pages.filter(p => 
    p.confidence >= confidenceThreshold[0] && 
    p.class !== 'upload_failed'
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          Confidence Threshold: {Math.round(confidenceThreshold[0] * 100)}%
        </label>
        <Slider
          value={confidenceThreshold}
          onValueChange={onThresholdChange}
          max={1}
          min={0.1}
          step={0.1}
          className="mt-2"
        />
      </div>
      
      <Button 
        variant="outline" 
        onClick={onSelectAllRelevant}
        className="w-full"
      >
        Select All Relevant ({relevantCount})
      </Button>
    </div>
  );
};
