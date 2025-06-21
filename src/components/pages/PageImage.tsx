
import React from 'react';
import { PlaceholderImage } from '@/components/upload/PlaceholderImage';

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
  const hasError = imageErrors.has(page.id);

  if (!page.img_url || hasError) {
    return (
      <PlaceholderImage
        pageNo={page.page_no}
        className="w-full h-full"
        error={hasError}
        onRetry={() => onRetryImage(page.id)}
      />
    );
  }

  return (
    <img 
      src={page.img_url} 
      alt={`Page ${page.page_no}`}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => onImageError(page.id)}
    />
  );
};
