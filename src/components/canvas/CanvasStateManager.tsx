
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
    
    if (canvas && container) {
      console.log('CanvasStateManager: Setting up canvas dimensions');
      
      // Set canvas size to match image
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      
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
    } else {
      console.error('CanvasStateManager: Canvas or container not available for setup');
      onStateUpdate({ imageLoaded: true }); // Still mark as loaded even if canvas setup fails
    }
  };

  const triggerCanvasRedraw = () => {
    if (image) {
      console.log('CanvasStateManager: Triggering canvas redraw');
      canvasDrawingRef.current?.drawCanvas();
    }
  };

  return { setupCanvasWithImage, triggerCanvasRedraw };
};
