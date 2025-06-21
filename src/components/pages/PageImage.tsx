
import React, { useState } from 'react';
import { PlaceholderImage } from '@/components/upload/PlaceholderImage';
import { AlertCircle } from 'lucide-react';
import { refreshSignedUrl } from '@/lib/storage';

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
  const hasError = imageErrors.has(page.id);

  // Check if the image URL looks valid
  const isValidImageUrl = currentUrl && 
    (currentUrl.includes('supabase') || currentUrl.startsWith('http'));

  const handleImageLoad = () => {
    console.log(`Image loaded successfully for page ${page.page_no}: ${currentUrl}`);
    setImageLoading(false);
  };

  const handleImageError = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Image failed to load for page ${page.page_no}:`, {
      url: currentUrl,
      error: e,
      naturalWidth: (e.target as HTMLImageElement).naturalWidth,
      naturalHeight: (e.target as HTMLImageElement).naturalHeight
    });
    
    // Try to refresh the signed URL if we have a project ID
    if (projectId && currentUrl) {
      try {
        console.log(`Attempting to refresh signed URL for page ${page.page_no}`);
        const freshUrl = await refreshSignedUrl(projectId, page.page_no);
        setCurrentUrl(freshUrl);
        console.log(`Refreshed URL for page ${page.page_no}: ${freshUrl}`);
        return; // Don't set error state, let it retry with the new URL
      } catch (refreshError) {
        console.error(`Failed to refresh URL for page ${page.page_no}:`, refreshError);
      }
    }
    
    // Try to access the image directly to get more info
    if (currentUrl) {
      fetch(currentUrl, { method: 'HEAD' })
        .then(response => {
          console.log(`HEAD request for page ${page.page_no} image:`, {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          });
        })
        .catch(fetchError => {
          console.error(`HEAD request failed for page ${page.page_no}:`, fetchError);
        });
    }
    
    setImageLoading(false);
    onImageError(page.id);
  };

  // Show placeholder if no URL, invalid URL, or has error
  if (!currentUrl || !isValidImageUrl || hasError) {
    return (
      <PlaceholderImage
        pageNo={page.page_no}
        className="w-full h-full"
        error={hasError || (!currentUrl || !isValidImageUrl)}
        onRetry={() => onRetryImage(page.id)}
      />
    );
  }

  return (
    <div className="w-full h-full relative">
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
      <img 
        src={currentUrl} 
        alt={`Page ${page.page_no}`}
        className="w-full h-full object-cover"
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
      {hasError && (
        <div className="absolute top-2 right-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
      )}
    </div>
  );
};
