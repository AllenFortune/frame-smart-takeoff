
import React, { useRef, useEffect } from 'react';
import { CanvasDrawing, CanvasDrawingRef } from './CanvasDrawing';
import { useCanvasInteractions } from './CanvasInteractionHandler';
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
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasDrawingRef = useRef<CanvasDrawingRef>(null);

  const { handleCanvasMouseDown } = useCanvasInteractions({
    canvasDrawingRef,
    state,
    geojson,
    onStateUpdate,
    onPolygonClick
  });

  // Load image and setup canvas when imageUrl changes
  useEffect(() => {
    if (!imageUrl) {
      console.log('No image URL provided to CanvasContainer');
      return;
    }

    console.log('Loading image:', imageUrl);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      imageRef.current = img;
      onStateUpdate({ imageLoaded: true });
      
      // Set up canvas dimensions and scale
      const canvas = canvasDrawingRef.current?.getCanvas();
      const container = containerRef.current;
      
      if (canvas && container) {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Calculate scale to fit container while maintaining aspect ratio
        const containerWidth = container.clientWidth || 800;
        const containerHeight = Math.min(container.clientHeight || 600, 600);
        
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
        
        onStateUpdate({ scale: newScale });
        console.log('Canvas setup complete, scale:', newScale);
      }
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', imageUrl, error);
      onStateUpdate({ imageLoaded: false });
    };
    
    img.src = imageUrl;
  }, [imageUrl, onStateUpdate]);

  // Draw canvas when dependencies change
  useEffect(() => {
    if (state.imageLoaded) {
      canvasDrawingRef.current?.drawCanvas();
    }
  }, [geojson, state.selectedFeature, state.activeTool, state.isDrawing, state.currentPath, state.imageLoaded]);

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
