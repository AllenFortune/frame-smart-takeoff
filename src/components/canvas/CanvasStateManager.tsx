
import { useRef, useEffect } from 'react';
import { CanvasDrawingRef } from './CanvasDrawing';
import { CanvasState } from './types';

interface CanvasStateManagerProps {
  canvasDrawingRef: React.RefObject<CanvasDrawingRef>;
  containerRef: React.RefObject<HTMLDivElement>;
  image: HTMLImageElement | null;
  onStateUpdate: (updates: Partial<CanvasState>) => void;
}

export const useCanvasStateManager = ({
  canvasDrawingRef,
  containerRef,
  image,
  onStateUpdate
}: CanvasStateManagerProps) => {
  const setupCanvasWithImage = (img: HTMLImageElement) => {
    const canvas = canvasDrawingRef.current?.getCanvas();
    const container = containerRef.current;
    
    console.log('CanvasStateManager: Setting up canvas with image');
    console.log('CanvasStateManager: Canvas available:', !!canvas);
    console.log('CanvasStateManager: Container available:', !!container);
    console.log('CanvasStateManager: Image dimensions:', img.width, 'x', img.height);
    console.log('CanvasStateManager: Image natural dimensions:', img.naturalWidth, 'x', img.naturalHeight);
    
    if (!canvas || !container) {
      console.error('CanvasStateManager: Canvas or container not available for setup');
      // Still mark as loaded even if canvas setup fails to prevent infinite loading
      onStateUpdate({ imageLoaded: true });
      return;
    }

    // Use natural dimensions for canvas size (actual image resolution)
    const imageWidth = img.naturalWidth || img.width;
    const imageHeight = img.naturalHeight || img.height;
    
    // Skip setup if image dimensions are invalid (like 1x1 placeholder)
    if (imageWidth <= 1 || imageHeight <= 1) {
      console.warn('CanvasStateManager: Invalid image dimensions, skipping setup');
      onStateUpdate({ imageLoaded: true });
      return;
    }
    
    // Set canvas size to match actual image dimensions
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    
    console.log('CanvasStateManager: Canvas size set to:', canvas.width, 'x', canvas.height);
    
    // Calculate scale to fit container while maintaining aspect ratio
    const containerWidth = container.clientWidth || 800;
    const containerHeight = Math.min(container.clientHeight || 600, 600);
    
    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;
    const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond original size
    
    console.log('CanvasStateManager: Calculated scale:', newScale);
    console.log('CanvasStateManager: Container dimensions:', containerWidth, 'x', containerHeight);
    
    onStateUpdate({ 
      scale: newScale,
      imageLoaded: true 
    });
    
    console.log('CanvasStateManager: Canvas setup complete');
  };

  const triggerCanvasRedraw = () => {
    if (image) {
      console.log('CanvasStateManager: Triggering canvas redraw');
      canvasDrawingRef.current?.drawCanvas();
    }
  };

  return { setupCanvasWithImage, triggerCanvasRedraw };
};
