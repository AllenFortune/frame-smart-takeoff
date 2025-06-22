
import React, { useState, useCallback } from 'react';
import { PlaceholderImage } from '@/components/upload/PlaceholderImage';
import { PdfPageRenderer } from '@/components/pdf/PdfPageRenderer';
import { useMultiResolutionImage } from '@/hooks/useMultiResolutionImage';
import { ImageLoadingSpinner } from './ImageLoadingSpinner';
import { ResolutionControls } from './ResolutionControls';
import { ImageOverlays } from './ImageOverlays';

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
  const [usePdfFallback, setUsePdfFallback] = useState(false);
  
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
      // After 2 failed attempts, try PDF fallback
      if (manualRetryCount >= 2) {
        setUsePdfFallback(true);
      }
    }
  });

  const hasError = imageErrors.has(page.id) || !!error;
  const isUploadFailed = page.class === 'upload_failed';

  // Construct PDF URL for fallback rendering
  const pdfUrl = projectId ? 
    `https://erfbmgcxpmtnmkffqsac.supabase.co/storage/v1/object/public/plan-pdfs/${projectId}/plan.pdf` : 
    null;

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

  const handlePdfLoadSuccess = useCallback(() => {
    console.log(`PDF fallback loaded successfully for page ${page.page_no}`);
  }, [page.page_no]);

  const handlePdfLoadError = useCallback((error: Error) => {
    console.error(`PDF fallback failed for page ${page.page_no}:`, error);
    setUsePdfFallback(false);
  }, [page.page_no]);

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

  // Use PDF fallback if no image URL or too many errors and PDF is available
  if ((usePdfFallback || (!currentUrl && pdfUrl)) && pdfUrl) {
    const width = preferredResolution === 'thumbnail' ? 150 : 
                 preferredResolution === 'preview' ? 300 : 600;
    
    return (
      <div className="w-full h-full relative group">
        <PdfPageRenderer
          pdfUrl={pdfUrl}
          pageNumber={page.page_no}
          width={width}
          className="w-full h-full"
          onLoadSuccess={handlePdfLoadSuccess}
          onLoadError={handlePdfLoadError}
        />
        
        {/* PDF fallback indicator */}
        <div className="absolute top-2 left-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
          PDF
        </div>
      </div>
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
        <ImageLoadingSpinner isRefreshing={isRefreshing} />
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
        <ResolutionControls
          currentResolution={currentResolution}
          availableResolutions={availableResolutions}
          onResolutionChange={handleResolutionSwitch}
        />
      )}
      
      {/* Image overlays */}
      <ImageOverlays
        currentResolution={currentResolution}
        hasHigherResolution={hasHigherResolution}
        hasError={hasError}
        isRefreshing={isRefreshing}
        manualRetryCount={manualRetryCount}
        projectId={projectId}
        showResolutionControls={showResolutionControls}
        onRetry={handleManualRetry}
      />
    </div>
  );
};
