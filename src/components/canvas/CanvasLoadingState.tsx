
import React from 'react';

interface CanvasLoadingStateProps {
  imageUrl: string;
  className?: string;
}

export const CanvasLoadingState = ({ imageUrl, className = '' }: CanvasLoadingStateProps) => {
  return (
    <div 
      className={`border rounded-lg overflow-hidden bg-gray-100 relative ${className}`}
      style={{ minHeight: '400px', maxHeight: '70vh' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-2 p-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground font-medium">Loading plan sheet...</p>
          <p className="text-xs text-muted-foreground">Loading: {imageUrl.substring(0, 50)}...</p>
        </div>
      </div>
    </div>
  );
};
