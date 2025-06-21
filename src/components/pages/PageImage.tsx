
import React, { useState, useCallback } from 'react';
import { PlaceholderImage } from '@/components/upload/PlaceholderImage';
import { AlertCircle, RefreshCw, ZoomIn, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMultiResolutionImage } from '@/hooks/useMultiResolutionImage';

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  full_url: string | null;
  project_id?: string;
}

interface PageImageProps {
  page: PlanPage;
  imageErrors: Set<string>;
  onImageError: (pageId: string) => void;
  onRetryImage: (pageId: string) => void;
  projectId?: string;
  preferredResolution?: 'thumbnail' | 'preview' | 'full';
  showResolutionControls?: boolean;
}

export const PageImage = ({ 
  page, 
  imageErrors, 
  onImageError, 
  onRetryImage,
  projectId,
  preferredResolution = 'preview',
  showResolutionControls = false
}: PageImageProps) => {
  const [manualRetryCount, setManualRetryCount] = useState(0);
  
  const {
    currentUrl,
    currentResolution,
    isLoading,
    error,
    isRefreshing,
    handleImageLoad,
    handleImageError,
    switchResolution,
    hasHigherResolution,
    refreshUrl,
    availableResolutions
  } = useMultiResolutionImage({
    page,
    preferredResolution,
    projectId,
    onError: (pageId) => {
      onImageError(pageId);
    }
  });

  const hasError = imageErrors.has(page.id) || !!error;
  const isUploadFailed = page.class === 'upload_failed';

  const handleManualRetry = useCallback(() => {
    console.log(`Manual retry requested for page ${page.page_no}`);
    setManualRetryCount(prev => prev + 1);
    onRetryImage(page.id);
    
    if (projectId && !isUploadFailed) {
      refreshUrl();
    }
  }, [page.page_no, page.id, projectId, isUploadFailed, refreshUrl, onRetryImage]);

  const handleResolutionSwitch = useCallback((resolution: 'thumbnail' | 'preview' | 'full') => {
    switchResolution(resolution);
  }, [switchResolution]);

  // Show placeholder for upload failed pages
  if (isUploadFailed) {
    return (
      <PlaceholderImage
        pageNo={page.page_no}
        className="w-full h-full"
        error={true}
        onRetry={handleManualRetry}
      />
    );
  }

  // Show placeholder if no URL or has persistent error
  if (!currentUrl || (hasError && manualRetryCount >= 3)) {
    return (
      <PlaceholderImage
        pageNo={page.page_no}
        className="w-full h-full"
        error={hasError}
        onRetry={handleManualRetry}
      />
    );
  }

  return (
    <div className="w-full h-full relative group">
      {/* Loading spinner */}
      {(isLoading || isRefreshing) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-xs text-muted-foreground">
              {isRefreshing ? 'Refreshing...' : 'Loading...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Main image */}
      <img 
        src={currentUrl} 
        alt={`Page ${page.page_no}`}
        className="w-full h-full object-cover"
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: (isLoading || isRefreshing) ? 'none' : 'block' }}
      />
      
      {/* Resolution controls */}
      {showResolutionControls && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex gap-1">
            {availableResolutions.thumbnail && (
              <Button
                size="sm"
                variant={currentResolution === 'thumbnail' ? 'default' : 'outline'}
                onClick={() => handleResolutionSwitch('thumbnail')}
                className="h-6 px-2 text-xs"
              >
                S
              </Button>
            )}
            {availableResolutions.preview && (
              <Button
                size="sm"
                variant={currentResolution === 'preview' ? 'default' : 'outline'}
                onClick={() => handleResolutionSwitch('preview')}
                className="h-6 px-2 text-xs"
              >
                M
              </Button>
            )}
            {availableResolutions.full && (
              <Button
                size="sm"
                variant={currentResolution === 'full' ? 'default' : 'outline'}
                onClick={() => handleResolutionSwitch('full')}
                className="h-6 px-2 text-xs"
              >
                L
              </Button>
            )}
          </div>
        </div>
      )}
      
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
              onClick={handleManualRetry}
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
    </div>
  );
};
