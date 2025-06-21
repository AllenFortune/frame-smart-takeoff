
import React, { useRef, useEffect, useState } from 'react';
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
  const [imageLoadError, setImageLoadError] = useState<string>('');
  const [imageLoadTimeout, setImageLoadTimeout] = useState<NodeJS.Timeout | null>(null);

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
      console.log('CanvasContainer: No image URL provided');
      return;
    }

    console.log('CanvasContainer: Starting image load process for:', imageUrl.substring(0, 100) + '...');
    
    // Clear any existing timeout
    if (imageLoadTimeout) {
      clearTimeout(imageLoadTimeout);
    }

    // Reset states
    setImageLoadError('');
    onStateUpdate({ imageLoaded: false });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    // Set up timeout for image loading (30 seconds)
    const timeout = setTimeout(() => {
      console.error('CanvasContainer: Image load timeout after 30 seconds');
      setImageLoadError('Image load timeout - the image is taking too long to load');
      onStateUpdate({ imageLoaded: false });
    }, 30000);
    
    setImageLoadTimeout(timeout);
    
    img.onload = () => {
      console.log('CanvasContainer: Image loaded successfully!');
      console.log('CanvasContainer: Image dimensions:', img.width, 'x', img.height);
      console.log('CanvasContainer: Image naturalWidth:', img.naturalWidth, 'naturalHeight:', img.naturalHeight);
      
      clearTimeout(timeout);
      setImageLoadTimeout(null);
      
      imageRef.current = img;
      setImageLoadError('');
      
      // Set up canvas dimensions and scale
      const canvas = canvasDrawingRef.current?.getCanvas();
      const container = containerRef.current;
      
      if (canvas && container) {
        console.log('CanvasContainer: Setting up canvas dimensions');
        
        // Set canvas size to match image
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        console.log('CanvasContainer: Canvas size set to:', canvas.width, 'x', canvas.height);
        
        // Calculate scale to fit container while maintaining aspect ratio
        const containerWidth = container.clientWidth || 800;
        const containerHeight = Math.min(container.clientHeight || 600, 600);
        
        const scaleX = containerWidth / canvas.width;
        const scaleY = containerHeight / canvas.height;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
        
        console.log('CanvasContainer: Calculated scale:', newScale);
        console.log('CanvasContainer: Container dimensions:', containerWidth, 'x', containerHeight);
        
        onStateUpdate({ 
          scale: newScale,
          imageLoaded: true 
        });
        
        console.log('CanvasContainer: Canvas setup complete');
      } else {
        console.error('CanvasContainer: Canvas or container not available for setup');
        onStateUpdate({ imageLoaded: true }); // Still mark as loaded even if canvas setup fails
      }
    };
    
    img.onerror = (error) => {
      console.error('CanvasContainer: Image load error:', error);
      console.error('CanvasContainer: Failed URL:', imageUrl);
      
      clearTimeout(timeout);
      setImageLoadTimeout(null);
      
      setImageLoadError('Failed to load image - check if the URL is accessible');
      onStateUpdate({ imageLoaded: false });
    };
    
    img.onabort = () => {
      console.warn('CanvasContainer: Image load aborted');
      clearTimeout(timeout);
      setImageLoadTimeout(null);
    };
    
    console.log('CanvasContainer: Setting image src to trigger load...');
    img.src = imageUrl;

    // Cleanup function
    return () => {
      if (imageLoadTimeout) {
        clearTimeout(imageLoadTimeout);
      }
    };
  }, [imageUrl, onStateUpdate]);

  // Draw canvas when dependencies change
  useEffect(() => {
    if (state.imageLoaded && imageRef.current) {
      console.log('CanvasContainer: Triggering canvas redraw');
      canvasDrawingRef.current?.drawCanvas();
    }
  }, [geojson, state.selectedFeature, state.activeTool, state.isDrawing, state.currentPath, state.imageLoaded]);

  // Show error state
  if (imageLoadError) {
    return (
      <div 
        ref={containerRef}
        className={`border rounded-lg overflow-hidden bg-gray-100 relative ${className}`}
        style={{ minHeight: '400px', maxHeight: '70vh' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2 p-4">
            <div className="text-red-500 text-lg">⚠️</div>
            <p className="text-muted-foreground font-medium">Image Load Error</p>
            <p className="text-sm text-muted-foreground">{imageLoadError}</p>
            <button 
              onClick={() => {
                setImageLoadError('');
                // Trigger a re-render by updating a state value
                onStateUpdate({ imageLoaded: false });
              }}
              className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
