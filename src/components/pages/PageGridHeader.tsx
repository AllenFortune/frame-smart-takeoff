
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Grid, List } from 'lucide-react';

interface PageGridHeaderProps {
  viewMode: 'grid' | 'carousel';
  onViewModeChange: (mode: 'grid' | 'carousel') => void;
  confidenceThreshold: number[];
  onConfidenceChange: (value: number[]) => void;
  filteredPagesCount: number;
  selectedPagesCount: number;
  onSelectAllRelevant: () => void;
  onContinue: () => void;
}

export const PageGridHeader = ({
  viewMode,
  onViewModeChange,
  confidenceThreshold,
  onConfidenceChange,
  filteredPagesCount,
  selectedPagesCount,
  onSelectAllRelevant,
  onContinue
}: PageGridHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/60 border-b p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Plan Pages</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'carousel' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('carousel')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Confidence Slider */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Confidence: {Math.round(confidenceThreshold[0] * 100)}%
          </label>
          <Slider
            value={confidenceThreshold}
            onValueChange={onConfidenceChange}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onSelectAllRelevant}
            className="flex-1"
          >
            Select All ({filteredPagesCount})
          </Button>
          <Button 
            onClick={onContinue}
            disabled={selectedPagesCount === 0}
            className="flex-1"
          >
            Continue ({selectedPagesCount})
          </Button>
        </div>
      </div>
    </div>
  );
};
