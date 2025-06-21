
import React, { useState, useCallback, useEffect } from 'react';
import { PlaceholderImage } from '@/components/upload/PlaceholderImage';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { refreshSignedUrl, isSignedUrlExpired, checkImageHealth, retryWithExponentialBackoff, ensureSignedUrl } from '@/lib/storage';

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
  project_id?: string;
}

interface PageImageProps {
  page: PlanPage;
  imageErrors: Set<string>;
  onImageError: (pageId: string) => void;
  onRetryImage: (pageId: string) => void;
  projectId?: string;
}

export const PageImage = ({ 
  page, 
  imageErrors, 
  onImageError, 
  onRetryImage,
  projectId 
}: PageImageProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(page.img_url);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const hasError = imageErrors.has(page.id);
  const maxRetries = 3;

  // Check if this is an upload failed page
  const isUploadFailed = page.class === 'upload_failed';

  // Auto-refresh expired URLs on component mount
  useEffect(() => {
    const initializeUrl = async () => {
      if (!currentUrl || !projectId || isUploadFailed) return;
      
      if (isSignedUrlExpired(currentUrl)) {
        console.log(`URL expired for page ${page.page_no}, refreshing on mount...`);
        await handleUrlRefresh();
      }
    };
    
    initializeUrl();
  }, []);

  const handleUrlRefresh = async () => {
    if (!projectId || isRefreshing || isUploadFailed) return;
    
    setIsRefreshing(true);
    
    try {
      console.log(`Refreshing signed URL for page ${page.page_no}`);
      
      const freshUrl = await retryWithExponentialBackoff(
        () => refreshSignedUrl(projectId, page.page_no),
        2,
        500
      );
      
      setCurrentUrl(freshUrl);
      setRetryCount(prev => prev + 1);
      
      console.log(`Successfully refreshed URL for page ${page.page_no}`);
      
      // Clear any existing errors since we have a fresh URL
      if (hasError) {
        onRetryImage(page.id);
      }
      
    } catch (error) {
      console.error(`Failed to refresh URL for page ${page.page_no}:`, error);
      
      if (retryCount >= maxRetries) {
        console.error(`Max retries exceeded for page ${page.page_no}`);
        onImageError(page.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleImageLoad = useCallback(() => {
    console.log(`Image loaded successfully for page ${page.page_no}`);
    setImageLoading(false);
    setRetryCount(0); // Reset retry count on successful load
  }, [page.page_no]);

  const handleImageError = useCallback(async (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Image failed to load for page ${page.page_no}:`, {
      url: currentUrl,
      naturalWidth: (e.target as HTMLImageElement).naturalWidth,
      naturalHeight: (e.target as HTMLImageElement).naturalHeight,
      retryCount
    });
    
    setImageLoading(false);
    
    // If we haven't hit max retries, try to refresh the URL
    if (retryCount < maxRetries && projectId && !isRefreshing && !isUploadFailed) {
      console.log(`Attempting URL refresh for page ${page.page_no} (attempt ${retryCount + 1})`);
      await handleUrlRefresh();
    } else {
      // Mark as error if we've exhausted retries
      onImageError(page.id);
    }
  }, [currentUrl, page.page_no, page.id, retryCount, projectId, isRefreshing, onImageError, isUploadFailed]);

  const handleManualRetry = () => {
    console.log(`Manual retry requested for page ${page.page_no}`);
    setRetryCount(0);
    onRetryImage(page.id);
    
    if (projectId && !isUploadFailed) {
      handleUrlRefresh();
    }
  };

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

  // Show placeholder if no URL, has error, or exceeded retries
  if (!currentUrl || (hasError && retryCount >= maxRetries)) {
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
    <div className="w-full h-full relative">
      {/* Loading spinner */}
      {(imageLoading || isRefreshing) && (
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
        style={{ display: (imageLoading || isRefreshing) ? 'none' : 'block' }}
      />
      
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
      {retryCount > 0 && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-1 rounded">
          Retry {retryCount}/{maxRetries}
        </div>
      )}
    </div>
  );
};
