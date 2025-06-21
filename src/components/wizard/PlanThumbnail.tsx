
import React from 'react';
import { PageImage } from '@/components/pages/PageImage';
import { PlanPage } from '@/hooks/useProjectData';
import { FileText } from 'lucide-react';

interface PlanThumbnailProps {
  page: PlanPage;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const PlanThumbnail = ({ 
  page, 
  className = '', 
  size = 'small' 
}: PlanThumbnailProps) => {
  const sizeClasses = {
    small: 'w-12 h-16',
    medium: 'w-16 h-20',
    large: 'w-20 h-24'
  };

  // For upload failed pages, show a simple icon
  if (page.class === 'upload_failed') {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`}>
        <FileText className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gray-100 rounded overflow-hidden border ${className}`}>
      <PageImage 
        page={page}
        imageErrors={new Set()}
        onImageError={() => {}}
        onRetryImage={() => {}}
        preferredResolution="thumbnail"
        showResolutionControls={false}
      />
    </div>
  );
};
