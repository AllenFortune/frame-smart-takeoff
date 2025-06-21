
import React, { useRef, useEffect, useState } from 'react';
import { CanvasDrawing, CanvasDrawingRef } from './CanvasDrawing';
import { useCanvasInteractions } from './CanvasInteractionHandler';
import { useImageLoader } from './ImageLoader';
import { useCanvasStateManager } from './CanvasStateManager';
import { CanvasLoadingState } from './CanvasLoadingState';
import { CanvasErrorState } from './CanvasErrorState';
import { CanvasState, GeoJsonData } from './types';

interface CanvasContainerProps {
  imageUrl: string;
  geojson?: GeoJsonData;
  state: CanvasState;
  onStateUpdate: (updates: Partial<CanvasState>) => void;
  onPolygonClick?: (featureId: string) => void;
  className?: string;
}

export const CanvasContainer = ({
  imageUrl,
  geojson,
  state,
  onStateUpdate,
  onPolygonClick,
  className = ''
}: CanvasContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasDrawingRef = useRef<CanvasDrawingRef>(null);
  const [imageLoadError, setImageLoadError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { handleCanvasMouseDown } = useCanvasInteractions({
    canvasDrawingRef,
    state,
    geojson,
    onStateUpdate,
    onPolygonClick
  });

  const { setupCanvasWithImage, triggerCanvasRedraw } = useCanvasStateManager({
    canvasDrawingRef,
    containerRef,
    image: loadedImage,
    onStateUpdate
  });

  const { imageRef } = useImageLoader({
    imageUrl: imageUrl + `?retry=${retryCount}`, // Add retry parameter to bypass cache
    onImageLoad: (img) => {
      console.log('CanvasContainer: Image loaded successfully');
      setLoadedImage(img);
      setupCanvasWithImage(img);
    },
    onLoadingChange: setIsLoading,
    onError: (error) => {
      console.error('CanvasContainer: Image load error:', error);
      setImageLoadError(error);
    }
  });

  // Draw canvas when dependencies change
  useEffect(() => {
    if (state.imageLoaded && loadedImage) {
      console.log('CanvasContainer: Triggering redraw due to state change');
      triggerCanvasRedraw();
    }
  }, [geojson, state.selectedFeature, state.activeTool, state.isDrawing, state.currentPath, state.imageLoaded]);

  const handleRetry = () => {
    console.log('CanvasContainer: Retrying image load');
    setImageLoadError('');
    setIsLoading(true);
    setRetryCount(prev => prev + 1);
    onStateUpdate({ imageLoaded: false });
  };

  // Show loading state
  if (isLoading && !imageLoadError) {
    return <CanvasLoadingState imageUrl={imageUrl} className={className} />;
  }

  // Show error state
  if (imageLoadError) {
    return (
      <CanvasErrorState 
        error={imageLoadError} 
        onRetry={handleRetry} 
        className={className} 
      />
    );
  }

  // Show canvas when loaded
  return (
    <div 
      ref={containerRef}
      className={`border rounded-lg overflow-hidden bg-gray-100 relative touch-pan-x touch-pan-y ${className}`}
      style={{ minHeight: '400px', maxHeight: '70vh' }}
    >
      <CanvasDrawing
        ref={canvasDrawingRef}
        imageRef={imageRef}
        geojson={geojson}
        selectedFeature={state.selectedFeature}
        activeTool={state.activeTool}
        isDrawing={state.isDrawing}
        currentPath={state.currentPath}
        scale={state.scale}
        pan={state.pan}
        imageLoaded={state.imageLoaded}
        onCanvasMouseDown={handleCanvasMouseDown}
      />
    </div>
  );
};
