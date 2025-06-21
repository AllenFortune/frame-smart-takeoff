
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, RefreshCw, ZoomIn } from 'lucide-react';

interface EnhancedCanvasContainerProps {
  imageUrl: string;
  geojson?: any;
  state: any;
  onStateUpdate: (updates: any) => void;
  onPolygonClick?: (featureId: string) => void;
  className?: string;
}

export const EnhancedCanvasContainer = ({
  imageUrl,
  geojson,
  state,
  onStateUpdate,
  onPolygonClick,
  className = ''
}: EnhancedCanvasContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [imageLoadState, setImageLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced image loading with retry logic
  const loadImage = useCallback((url: string, attempt = 1) => {
    if (!url) {
      console.error('No image URL provided');
      setImageLoadState('error');
      return;
    }

    console.log(`Loading image attempt ${attempt}:`, url.substring(0, 100) + '...');
    setImageLoadState('loading');
    
    const img = new Image();
    
    // Add timestamp to prevent caching issues
    const urlWithTimestamp = url.includes('?') 
      ? `${url}&t=${Date.now()}` 
      : `${url}?t=${Date.now()}`;
    
    img.onload = () => {
      console.log(`Image loaded successfully on attempt ${attempt}:`, {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        url: url.substring(0, 50) + '...'
      });
      
      // Validate image dimensions (PDF plans should be reasonably large)
      if (img.naturalWidth < 100 || img.naturalHeight < 100) {
        console.warn('Image dimensions seem too small for a plan sheet:', {
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
      
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoadState('loaded');
      setRetryCount(0);
      
      imageRef.current = img;
      onStateUpdate({ imageLoaded: true });
      
      // Trigger canvas redraw
      setTimeout(drawCanvas, 100);
    };
    
    img.onerror = (error) => {
      console.error(`Image load failed on attempt ${attempt}:`, error, url);
      
      if (attempt < 3) {
        // Retry with exponential backoff
        setTimeout(() => {
          loadImage(url, attempt + 1);
        }, Math.pow(2, attempt) * 1000);
      } else {
        setImageLoadState('error');
        setRetryCount(attempt);
        onStateUpdate({ imageLoaded: false });
      }
    };
    
    // Set crossOrigin to handle CORS issues
    img.crossOrigin = 'anonymous';
    img.src = urlWithTimestamp;
  }, [onStateUpdate]);

  // Load image when URL changes
  useEffect(() => {
    if (imageUrl) {
      loadImage(imageUrl);
    } else {
      setImageLoadState('error');
      onStateUpdate({ imageLoaded: false });
    }
  }, [imageUrl, loadImage, onStateUpdate]);

  // Canvas drawing function
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img || imageLoadState !== 'loaded') return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on container
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = Math.max(400, containerRect.height);

    // Calculate scale to fit image in container while maintaining aspect ratio
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let displayWidth, displayHeight;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspectRatio;
    } else {
      // Image is taller than container
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspectRatio;
    }

    // Apply zoom scale
    const scale = state.scale || 1;
    displayWidth *= scale;
    displayHeight *= scale;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Clear canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Draw image with high quality settings for PDF plans
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Apply pan offset if available
    const panX = state.panX || 0;
    const panY = state.panY || 0;
    
    ctx.drawImage(img, panX, panY, displayWidth, displayHeight);

    // Draw GeoJSON features if available
    if (geojson?.features) {
      drawGeoJsonFeatures(ctx, geojson.features, scale, panX, panY);
    }
  }, [imageLoadState, state.scale, state.panX, state.panY, geojson]);

  // GeoJSON drawing function
  const drawGeoJsonFeatures = useCallback((ctx: CanvasRenderingContext2D, features: any[], scale: number, panX: number, panY: number) => {
    features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        const coordinates = feature.geometry.coordinates[0]; // Assuming simple polygon
        
        ctx.beginPath();
        coordinates.forEach((coord: number[], index: number) => {
          const x = (coord[0] * scale) + panX;
          const y = (coord[1] * scale) + panY;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        
        // Style based on feature properties
        const isSelected = feature.properties.id === state.selectedFeature;
        const isIncluded = feature.properties.included !== false;
        
        if (isSelected) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        } else if (isIncluded) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
        } else {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        }
        
        ctx.fill();
        ctx.stroke();
      }
    });
  }, [state.selectedFeature]);

  // Redraw canvas when state changes
  useEffect(() => {
    if (imageLoadState === 'loaded') {
      drawCanvas();
    }
  }, [drawCanvas, imageLoadState]);

  // Handle manual retry
  const handleRetry = () => {
    if (imageUrl) {
      loadImage(imageUrl);
    }
  };

  // Render loading state
  if (imageLoadState === 'loading') {
    return (
      <div className={`border rounded-lg overflow-hidden bg-gray-50 relative ${className}`} style={{ minHeight: '400px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-muted-foreground">Loading plan sheet...</p>
            <p className="text-xs text-muted-foreground">
              High-resolution images may take a moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (imageLoadState === 'error') {
    return (
      <div className={`border rounded-lg overflow-hidden bg-red-50 relative ${className}`} style={{ minHeight: '400px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-red-700 font-medium">Failed to load plan sheet</p>
            <p className="text-sm text-red-600">
              {retryCount > 0 ? `Failed after ${retryCount} attempts` : 'Image could not be loaded'}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Try Again
            </button>
            <div className="text-xs text-muted-foreground mt-2">
              <p>Common issues:</p>
              <ul className="text-left inline-block">
                <li>• PDF conversion failed</li>
                <li>• Network connectivity</li>
                <li>• File format not supported</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render canvas
  return (
    <div 
      ref={containerRef}
      className={`border rounded-lg overflow-hidden bg-white relative ${className}`}
      style={{ minHeight: '400px' }}
    >
      <canvas
        ref={canvasRef}
        className="block mx-auto cursor-crosshair"
        onClick={(e) => {
          // Handle canvas clicks for polygon selection
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          console.log('Canvas clicked at:', { x, y });
          // Add polygon hit detection logic here
          onPolygonClick?.('clicked-feature');
        }}
      />
      
      {/* Image info overlay */}
      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
        {imageNaturalSize.width} × {imageNaturalSize.height}
        {state.scale !== 1 && ` (${Math.round(state.scale * 100)}%)`}
      </div>
      
      {/* Zoom hint for small images */}
      {imageNaturalSize.width > 0 && state.scale === 1 && (
        <div className="absolute bottom-2 right-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs flex items-center">
          <ZoomIn className="w-3 h-3 mr-1" />
          Use zoom for details
        </div>
      )}
    </div>
  );
};
