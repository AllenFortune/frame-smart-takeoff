
import { useState, useEffect, useCallback } from 'react';
import { refreshSignedUrl, isSignedUrlExpired, isPublicUrl } from '@/lib/storage';

interface PlanPage {
  id: string;
  page_no: number;
  thumbnail_url: string | null;
  preview_url: string | null;
  full_url: string | null;
  img_url: string | null; // fallback
}

type ImageResolution = 'thumbnail' | 'preview' | 'full';

interface UseMultiResolutionImageProps {
  page: PlanPage;
  preferredResolution?: ImageResolution;
  projectId?: string;
  onError?: (pageId: string, resolution: ImageResolution) => void;
}

export const useMultiResolutionImage = ({
  page,
  preferredResolution = 'preview',
  projectId,
  onError
}: UseMultiResolutionImageProps) => {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentResolution, setCurrentResolution] = useState<ImageResolution>('preview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get the best available URL for the requested resolution with better fallback logic
  const getBestUrl = useCallback((resolution: ImageResolution): string | null => {
    console.log(`Getting best URL for resolution: ${resolution}`, {
      thumbnail_url: !!page.thumbnail_url,
      preview_url: !!page.preview_url,
      full_url: !!page.full_url,
      img_url: !!page.img_url
    });

    switch (resolution) {
      case 'thumbnail':
        return page.thumbnail_url || page.preview_url || page.img_url || page.full_url;
      case 'preview':
        return page.preview_url || page.img_url || page.full_url || page.thumbnail_url;
      case 'full':
        return page.full_url || page.preview_url || page.img_url || page.thumbnail_url;
      default:
        return page.preview_url || page.img_url || page.full_url || page.thumbnail_url;
    }
  }, [page]);

  // Initialize URL based on preferred resolution
  useEffect(() => {
    const bestUrl = getBestUrl(preferredResolution);
    console.log(`Setting URL for page ${page.page_no}:`, {
      preferredResolution,
      bestUrl: bestUrl?.substring(0, 50) + '...'
    });
    
    setCurrentUrl(bestUrl);
    
    // Determine actual resolution being used
    if (bestUrl === page.thumbnail_url) {
      setCurrentResolution('thumbnail');
    } else if (bestUrl === page.preview_url || bestUrl === page.img_url) {
      setCurrentResolution('preview');
    } else if (bestUrl === page.full_url) {
      setCurrentResolution('full');
    }
    
    setError(null);
    setIsLoading(!!bestUrl);
  }, [page, preferredResolution, getBestUrl]);

  // Refresh expired signed URLs (skip for public URLs)
  const refreshUrl = useCallback(async () => {
    if (!projectId || !currentUrl || isRefreshing) return;

    // Don't try to refresh public URLs - they don't expire
    if (isPublicUrl(currentUrl)) {
      console.log(`Skipping refresh for public URL: ${currentUrl.substring(0, 50)}...`);
      return;
    }

    setIsRefreshing(true);
    try {
      console.log(`Refreshing URL for page ${page.page_no}, resolution: ${currentResolution}`);
      
      // For signed URLs, use existing refresh logic
      const freshUrl = await refreshSignedUrl(projectId, page.page_no);
      setCurrentUrl(freshUrl);
      setError(null);
      
      console.log(`Successfully refreshed URL for page ${page.page_no}`);
    } catch (error) {
      console.error(`Failed to refresh URL for page ${page.page_no}:`, error);
      setError(error instanceof Error ? error.message : 'Failed to refresh URL');
      onError?.(page.id, currentResolution);
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, currentUrl, isRefreshing, page.page_no, page.id, currentResolution, onError]);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  // Handle image load error
  const handleImageError = useCallback(async () => {
    setIsLoading(false);
    
    // Check if URL is expired and try to refresh (only for signed URLs)
    if (currentUrl && isSignedUrlExpired(currentUrl) && projectId && !isPublicUrl(currentUrl)) {
      await refreshUrl();
    } else {
      const errorMsg = `Failed to load ${currentResolution} image`;
      setError(errorMsg);
      onError?.(page.id, currentResolution);
    }
  }, [currentUrl, currentResolution, page.id, projectId, refreshUrl, onError]);

  // Switch to different resolution
  const switchResolution = useCallback((newResolution: ImageResolution) => {
    const newUrl = getBestUrl(newResolution);
    if (newUrl && newUrl !== currentUrl) {
      setCurrentUrl(newUrl);
      setCurrentResolution(newResolution);
      setIsLoading(true);
      setError(null);
    }
  }, [getBestUrl, currentUrl]);

  // Check if higher resolution is available
  const hasHigherResolution = useCallback((): boolean => {
    switch (currentResolution) {
      case 'thumbnail':
        return !!(page.preview_url || page.full_url);
      case 'preview':
        return !!page.full_url;
      case 'full':
        return false;
      default:
        return false;
    }
  }, [currentResolution, page]);

  return {
    currentUrl,
    currentResolution,
    isLoading: isLoading || isRefreshing,
    error,
    isRefreshing,
    handleImageLoad,
    handleImageError,
    switchResolution,
    hasHigherResolution: hasHigherResolution(),
    refreshUrl,
    availableResolutions: {
      thumbnail: !!page.thumbnail_url,
      preview: !!(page.preview_url || page.img_url),
      full: !!page.full_url
    }
  };
};
