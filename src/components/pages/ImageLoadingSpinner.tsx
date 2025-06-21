
import React from 'react';

interface ImageLoadingSpinnerProps {
  isRefreshing?: boolean;
}

export const ImageLoadingSpinner = ({ isRefreshing = false }: ImageLoadingSpinnerProps) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="text-xs text-muted-foreground">
          {isRefreshing ? 'Refreshing...' : 'Loading...'}
        </span>
      </div>
    </div>
  );
};
