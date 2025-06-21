
import React, { useState } from 'react';
import { PlaceholderImage } from '@/components/upload/PlaceholderImage';
import { AlertCircle } from 'lucide-react';

interface PlanPage {
  id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
}

interface PageImageProps {
  page: PlanPage;
  imageErrors: Set<string>;
  onImageError: (pageId: string) => void;
  onRetryImage: (pageId: string) => void;
}

export const PageImage = ({ 
  page, 
  imageErrors, 
  onImageError, 
  onRetryImage 
}: PageImageProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const hasError = imageErrors.has(page.id);

  // Check if the image URL looks valid
  const isValidImageUrl = page.img_url && 
    (page.img_url.includes('supabase') || page.img_url.startsWith('http'));

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Image failed to load for page ${page.page_no}:`, page.img_url);
    setImageLoading(false);
    onImageError(page.id);
  };

  // Show placeholder if no URL, invalid URL, or has error
  if (!page.img_url || !isValidImageUrl || hasError) {
    return (
      <PlaceholderImage
        pageNo={page.page_no}
        className="w-full h-full"
        error={hasError || (!page.img_url || !isValidImageUrl)}
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
        src={page.img_url} 
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
