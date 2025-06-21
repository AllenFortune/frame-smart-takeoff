
import React from 'react';
import { Button } from '@/components/ui/button';

type ImageResolution = 'thumbnail' | 'preview' | 'full';

interface AvailableResolutions {
  thumbnail: boolean;
  preview: boolean;
  full: boolean;
}

interface ResolutionControlsProps {
  currentResolution: ImageResolution;
  availableResolutions: AvailableResolutions;
  onResolutionChange: (resolution: ImageResolution) => void;
}

export const ResolutionControls = ({
  currentResolution,
  availableResolutions,
  onResolutionChange
}: ResolutionControlsProps) => {
  return (
    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div className="flex gap-1">
        {availableResolutions.thumbnail && (
          <Button
            size="sm"
            variant={currentResolution === 'thumbnail' ? 'default' : 'outline'}
            onClick={() => onResolutionChange('thumbnail')}
            className="h-6 px-2 text-xs"
          >
            S
          </Button>
        )}
        {availableResolutions.preview && (
          <Button
            size="sm"
            variant={currentResolution === 'preview' ? 'default' : 'outline'}
            onClick={() => onResolutionChange('preview')}
            className="h-6 px-2 text-xs"
          >
            M
          </Button>
        )}
        {availableResolutions.full && (
          <Button
            size="sm"
            variant={currentResolution === 'full' ? 'default' : 'outline'}
            onClick={() => onResolutionChange('full')}
            className="h-6 px-2 text-xs"
          >
            L
          </Button>
        )}
      </div>
    </div>
  );
};
