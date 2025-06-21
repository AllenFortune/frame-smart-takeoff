
import React from 'react';

interface CanvasErrorStateProps {
  error: string;
  onRetry: () => void;
  className?: string;
}

export const CanvasErrorState = ({ error, onRetry, className = '' }: CanvasErrorStateProps) => {
  return (
    <div 
      className={`border rounded-lg overflow-hidden bg-gray-100 relative ${className}`}
      style={{ minHeight: '400px', maxHeight: '70vh' }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-2 p-4">
          <div className="text-red-500 text-lg">⚠️</div>
          <p className="text-muted-foreground font-medium">Image Load Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={onRetry}
            className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};
