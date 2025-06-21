
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Move, 
  Square, 
  Circle, 
  Pen, 
  Undo2, 
  Redo2, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  Hand,
  Edit3
} from 'lucide-react';

interface GeoJsonFeature {
  type: 'Feature';
  properties: {
    id: string;
    type: string;
    material?: string;
    length_ft?: number;
    included: boolean;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface GeoJsonData {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

interface InteractiveCanvasProps {
  imageUrl: string;
  geojson?: GeoJsonData;
  onPolygonClick?: (featureId: string) => void;
  onPolygonToggle?: (featureId: string, included: boolean) => void;
  onGeojsonUpdate?: (geojson: GeoJsonData) => void;
  className?: string;
}

type Tool = 'select' | 'pan' | 'rectangle' | 'polygon' | 'edit';

export const InteractiveCanvas = ({ 
  imageUrl, 
  geojson, 
  onPolygonClick,
  onPolygonToggle,
  onGeojsonUpdate,
  className = ''
}: InteractiveCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const [undoStack, setUndoStack] = useState<GeoJsonData[]>([]);
  const [redoStack, setRedoStack] = useState<GeoJsonData[]>([]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      fitImageToContainer();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Fit image to container
  const fitImageToContainer = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imageRef.current;
    
    if (!canvas || !container || !img) return;

    const containerRect = container.getBoundingClientRect();
    const scaleX = containerRect.width / img.width;
    const scaleY = containerRect.height / img.height;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    setScale(newScale);
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.style.width = `${img.width * newScale}px`;
    canvas.style.height = `${img.height * newScale}px`;
  }, []);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw GeoJSON features
    if (geojson?.features) {
      geojson.features.forEach((feature) => {
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
      });
    }

    // Draw current path while drawing
    if (isDrawing && currentPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPath[0][0], currentPath[0][1]);
      currentPath.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [geojson, selectedFeature, activeTool, isDrawing, currentPath, imageLoaded]);

  // Redraw when dependencies change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get mouse coordinates relative to canvas
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  // Handle canvas interactions
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);

    if (activeTool === 'pan') {
      setIsDragging(true);
      setDragStart(coords);
      return;
    }

    if (activeTool === 'polygon') {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPath([[coords.x, coords.y]]);
      } else {
        setCurrentPath(prev => [...prev, [coords.x, coords.y]]);
      }
      return;
    }

    if (activeTool === 'select' && geojson?.features) {
      // Check for polygon click
      for (const feature of geojson.features) {
        const coords = feature.geometry.coordinates[0];
        if (isPointInPolygon([coords.x, coords.y], coords)) {
          setSelectedFeature(feature.properties.id);
          onPolygonClick?.(feature.properties.id);
          return;
        }
      }
      setSelectedFeature(null);
    }
  };

  // Point in polygon test
  const isPointInPolygon = (point: [number, number], polygon: number[][]) => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  };

  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.1));

  // Undo/Redo functions
  const undo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, geojson!]);
    setUndoStack(prev => prev.slice(0, -1));
    onGeojsonUpdate?.(previous);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, geojson!]);
    setRedoStack(prev => prev.slice(0, -1));
    onGeojsonUpdate?.(next);
  };

  // Save state for undo
  const saveState = () => {
    if (geojson) {
      setUndoStack(prev => [...prev.slice(-9), geojson]);
      setRedoStack([]);
    }
  };

  const selectedFeatureData = geojson?.features.find(f => f.properties.id === selectedFeature);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tool Selection */}
            <div className="flex items-center gap-1">
              {[
                { tool: 'select', icon: Move, label: 'Select' },
                { tool: 'pan', icon: Hand, label: 'Pan' },
                { tool: 'rectangle', icon: Square, label: 'Rectangle' },
                { tool: 'polygon', icon: Pen, label: 'Polygon' },
                { tool: 'edit', icon: Edit3, label: 'Edit' }
              ].map(({ tool, icon: Icon, label }) => (
                <Button
                  key={tool}
                  variant={activeTool === tool ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool(tool as Tool)}
                  className="touch-target-large"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{label}</span>
                </Button>
              ))}
            </div>

            <div className="h-6 w-px bg-border mx-2" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border mx-2" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={undo}
                disabled={undoStack.length === 0}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={redo}
                disabled={redoStack.length === 0}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="border rounded-lg overflow-hidden bg-gray-100 relative touch-pan-x touch-pan-y"
        style={{ minHeight: '400px' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          className="cursor-crosshair touch-none"
          style={{ 
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'top left'
          }}
        />
      </div>

      {/* Selected Feature Info */}
      {selectedFeatureData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedFeatureData.properties.included ? "default" : "destructive"}>
                    {selectedFeatureData.properties.id}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {selectedFeatureData.properties.type}
                  </span>
                </div>
                {selectedFeatureData.properties.material && (
                  <p className="text-sm">Material: {selectedFeatureData.properties.material}</p>
                )}
                {selectedFeatureData.properties.length_ft && (
                  <p className="text-sm">Length: {selectedFeatureData.properties.length_ft} ft</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedFeatureData.properties.included ? "destructive" : "default"}
                  size="sm"
                  onClick={() => onPolygonToggle?.(selectedFeature!, !selectedFeatureData.properties.included)}
                >
                  {selectedFeatureData.properties.included ? "Exclude" : "Include"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Delete feature logic would go here
                    console.log('Delete feature:', selectedFeature);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Touch Instructions for Mobile */}
      <div className="block sm:hidden text-xs text-muted-foreground text-center space-y-1">
        <p>Tap to select • Pinch to zoom • Two-finger drag to pan</p>
        <p>Use toolbar buttons for drawing tools</p>
      </div>
    </div>
  );
};
