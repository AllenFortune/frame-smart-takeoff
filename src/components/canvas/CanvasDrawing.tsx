
import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { GeoJsonData, Tool } from './types';

interface CanvasDrawingProps {
  imageRef: React.RefObject<HTMLImageElement>;
  geojson?: GeoJsonData;
  selectedFeature: string | null;
  activeTool: Tool;
  isDrawing: boolean;
  currentPath: [number, number][];
  scale: number;
  pan: { x: number; y: number };
  imageLoaded: boolean;
  onCanvasMouseDown: (event: React.MouseEvent<HTMLCanvasElement>) => void;
}

export interface CanvasDrawingRef {
  getCanvas: () => HTMLCanvasElement | null;
  drawCanvas: () => void;
}

export const CanvasDrawing = forwardRef<CanvasDrawingRef, CanvasDrawingProps>(({
  imageRef,
  geojson,
  selectedFeature,
  activeTool,
  isDrawing,
  currentPath,
  scale,
  pan,
  imageLoaded,
  onCanvasMouseDown
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    console.log('CanvasDrawing: drawCanvas called');
    console.log('CanvasDrawing: canvas available:', !!canvas);
    console.log('CanvasDrawing: image available:', !!img);
    console.log('CanvasDrawing: imageLoaded:', imageLoaded);
    
    if (!canvas || !img || !imageLoaded) {
      console.log('CanvasDrawing: Skipping draw - missing requirements');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('CanvasDrawing: Could not get 2D context');
      return;
    }

    console.log('CanvasDrawing: Starting canvas draw');
    console.log('CanvasDrawing: Canvas dimensions:', canvas.width, 'x', canvas.height);
    console.log('CanvasDrawing: Image dimensions:', img.width, 'x', img.height, 'natural:', img.naturalWidth, 'x', img.naturalHeight);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      console.log('CanvasDrawing: Image drawn successfully');
    } catch (error) {
      console.error('CanvasDrawing: Error drawing image:', error);
      return;
    }

    // Draw GeoJSON features
    if (geojson?.features) {
      console.log('CanvasDrawing: Drawing', geojson.features.length, 'features');
      
      geojson.features.forEach((feature, index) => {
        try {
          const coords = feature.geometry.coordinates[0];
          const isSelected = selectedFeature === feature.properties.id;
          const isIncluded = feature.properties.included;

          ctx.beginPath();
          ctx.moveTo(coords[0][0], coords[0][1]);
          coords.forEach(([x, y]) => ctx.lineTo(x, y));
          ctx.closePath();

          // Fill
          if (isIncluded) {
            ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(34, 197, 94, 0.3)';
          } else {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          }
          ctx.fill();

          // Stroke
          ctx.strokeStyle = isSelected ? '#3b82f6' : (isIncluded ? '#22c55e' : '#ef4444');
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.stroke();

          // Label
          const centerX = coords.reduce((sum, [x]) => sum + x, 0) / coords.length;
          const centerY = coords.reduce((sum, [, y]) => sum + y, 0) / coords.length;
          
          ctx.fillStyle = '#000';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(feature.properties.id, centerX, centerY);

          // Draw vertices for selected feature in edit mode
          if (isSelected && activeTool === 'edit') {
            coords.forEach(([x, y]) => {
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, 2 * Math.PI);
              ctx.fillStyle = '#3b82f6';
              ctx.fill();
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2;
              ctx.stroke();
            });
          }
        } catch (error) {
          console.error(`CanvasDrawing: Error drawing feature ${index}:`, error);
        }
      });
    }

    // Draw current path while drawing
    if (isDrawing && currentPath.length > 0) {
      try {
        ctx.beginPath();
        ctx.moveTo(currentPath[0][0], currentPath[0][1]);
        currentPath.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
      } catch (error) {
        console.error('CanvasDrawing: Error drawing current path:', error);
      }
    }

    console.log('CanvasDrawing: Canvas draw complete');
  };

  // Trigger initial draw when image loads
  useEffect(() => {
    if (imageLoaded) {
      console.log('CanvasDrawing: Image loaded, triggering draw');
      drawCanvas();
    }
  }, [imageLoaded]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    drawCanvas
  }));

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onCanvasMouseDown}
      className="cursor-crosshair touch-none w-full h-auto"
      style={{ 
        transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
        transformOrigin: 'top left',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
});

CanvasDrawing.displayName = 'CanvasDrawing';
