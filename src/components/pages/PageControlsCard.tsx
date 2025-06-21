
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, Grid, List } from "lucide-react";

interface PageControlsCardProps {
  viewMode: 'grid' | 'list';
  confidenceThreshold: number[];
  relevantPagesCount: number;
  selectedPagesCount: number;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onConfidenceChange: (threshold: number[]) => void;
  onSelectAllRelevant: () => void;
  onContinue: () => void;
}

export const PageControlsCard = ({
  viewMode,
  confidenceThreshold,
  relevantPagesCount,
  selectedPagesCount,
  onViewModeChange,
  onConfidenceChange,
  onSelectAllRelevant,
  onContinue
}: PageControlsCardProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Filter by Confidence</h3>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Minimum: {Math.round(confidenceThreshold[0] * 100)}%</span>
            <span>{relevantPagesCount} pages match</span>
          </div>
          <Slider
            value={confidenceThreshold}
            onValueChange={onConfidenceChange}
            max={1}
            min={0}
            step={0.05}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onSelectAllRelevant}
            className="flex-1"
          >
            Select All Relevant ({relevantPagesCount})
          </Button>
          <Button 
            onClick={onContinue}
            disabled={selectedPagesCount === 0}
            className="flex-1"
          >
            Continue ({selectedPagesCount})
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
