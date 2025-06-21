
import React from 'react';
import { AlertCircle, RefreshCw, ZoomIn, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ImageResolution = 'thumbnail' | 'preview' | 'full';

interface ImageOverlaysProps {
  currentResolution: ImageResolution;
  hasHigherResolution: boolean;
  hasError: boolean;
  isRefreshing: boolean;
  manualRetryCount: number;
  projectId?: string;
  showResolutionControls: boolean;
  onRetry: () => void;
}

export const ImageOverlays = ({
  currentResolution,
  hasHigherResolution,
  hasError,
  isRefreshing,
  manualRetryCount,
  projectId,
  showResolutionControls,
  onRetry
}: ImageOverlaysProps) => {
  return (
    <>
      {/* Higher resolution indicator */}
      {hasHigherResolution && !showResolutionControls && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
            <ZoomIn className="w-3 h-3" />
            <span>HD Available</span>
          </div>
        </div>
      )}
      
      {/* Resolution indicator */}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        <div className="flex items-center gap-1">
          <Image className="w-3 h-3" />
          <span className="capitalize">{currentResolution}</span>
        </div>
      </div>
      
      {/* Error indicator and retry button */}
      {hasError && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          {projectId && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={isRefreshing}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      )}
      
      {/* Retry count indicator (for debugging) */}
      {manualRetryCount > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1 rounded">
          Retry {manualRetryCount}/3
        </div>
      )}
    </>
  );
};
