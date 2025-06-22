
import React, { useState } from 'react';
import { PageImage } from '@/components/pages/PageImage';
import { PdfPageRenderer } from '@/components/pdf/PdfPageRenderer';
import { PlanPage } from '@/hooks/useProjectData';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface PlanThumbnailProps {
  page: PlanPage;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean;
  onClick?: () => void;
  projectId?: string;
}

export const PlanThumbnail = ({ 
  page, 
  className = '', 
  size = 'small',
  showStatus = false,
  onClick,
  projectId
}: PlanThumbnailProps) => {
  const [imageError, setImageError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [usePdfFallback, setUsePdfFallback] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-16',
    medium: 'w-16 h-20',
    large: 'w-20 h-24'
  };

  const widthMap = {
    small: 60,
    medium: 80,
    large: 100
  };

  const handleImageError = () => {
    console.error(`Image load failed for page ${page.page_no}:`, page.id);
    setImageError(true);
    setIsRetrying(false);
    
    // Try PDF fallback if we have a project ID
    if (projectId) {
      setUsePdfFallback(true);
    }
  };

  const handleRetryImage = async () => {
    setIsRetrying(true);
    setImageError(false);
    setUsePdfFallback(false);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  const pdfUrl = projectId ? 
    `https://erfbmgcxpmtnmkffqsac.supabase.co/storage/v1/object/public/plan-pdfs/${projectId}/plan.pdf` : 
    null;

  // For upload failed pages, show error state
  if (page.class === 'upload_failed') {
    return (
      <div 
        className={`${sizeClasses[size]} bg-red-50 rounded border-2 border-dashed border-red-300 flex items-center justify-center ${onClick ? 'cursor-pointer hover:bg-red-100' : ''} ${className}`}
        onClick={onClick}
      >
        <AlertCircle className="w-4 h-4 text-red-400" />
      </div>
    );
  }

  // Use PDF fallback if enabled and available
  if (usePdfFallback && pdfUrl) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-gray-100 rounded overflow-hidden border relative group ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''} ${className}`}
        onClick={onClick}
      >
        <PdfPageRenderer
          pdfUrl={pdfUrl}
          pageNumber={page.page_no}
          width={widthMap[size]}
          className="w-full h-full"
          onLoadError={() => setUsePdfFallback(false)}
        />
        
        {/* PDF indicator */}
        <div className="absolute top-0 right-0 bg-blue-500/80 text-white text-xs px-1 rounded-bl">
          PDF
        </div>
        
        {/* Status indicators */}
        {showStatus && (
          <div className="absolute top-1 left-1 flex gap-1">
            {page.confidence && page.confidence < 0.8 && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full" title={`${Math.round(page.confidence * 100)}% confidence`} />
            )}
            {page.plan_type && (
              <div className="w-2 h-2 bg-blue-400 rounded-full" title={page.plan_type} />
            )}
          </div>
        )}
        
        {/* Hover overlay for click indication */}
        {onClick && (
          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-xs text-blue-600 font-medium bg-white/90 px-2 py-1 rounded">
              View
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show error state with retry option
  if (imageError && !pdfUrl) {
    return (
      <div 
        className={`${sizeClasses[size]} bg-gray-100 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-1 ${onClick ? 'cursor-pointer hover:bg-gray-200' : ''} ${className}`}
        onClick={onClick}
      >
        <AlertCircle className="w-3 h-3 text-gray-400 mb-1" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRetryImage();
          }}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          disabled={isRetrying}
        >
          <RefreshCw className={`w-2 h-2 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} bg-gray-100 rounded overflow-hidden border relative group ${onClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      <PageImage 
        page={page}
        imageErrors={new Set()}
        onImageError={handleImageError}
        onRetryImage={handleRetryImage}
        projectId={projectId}
        preferredResolution="thumbnail"
        showResolutionControls={false}
      />
      
      {/* Loading overlay while retrying */}
      {isRetrying && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <RefreshCw className="w-3 h-3 animate-spin text-gray-500" />
        </div>
      )}
      
      {/* Status indicators */}
      {showStatus && (
        <div className="absolute top-1 right-1 flex gap-1">
          {page.confidence && page.confidence < 0.8 && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title={`${Math.round(page.confidence * 100)}% confidence`} />
          )}
          {page.plan_type && (
            <div className="w-2 h-2 bg-blue-400 rounded-full" title={page.plan_type} />
          )}
        </div>
      )}
      
      {/* Hover overlay for click indication */}
      {onClick && (
        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-xs text-blue-600 font-medium bg-white/90 px-2 py-1 rounded">
            View
          </div>
        </div>
      )}
    </div>
  );
};
