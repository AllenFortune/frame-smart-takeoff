
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

interface PlanCanvasProps {
  imageUrl: string;
  geojson?: GeoJsonData;
  onPolygonClick?: (featureId: string) => void;
  onPolygonToggle?: (featureId: string, included: boolean) => void;
}

export const PlanCanvas = ({ 
  imageUrl, 
  geojson, 
  onPolygonClick,
  onPolygonToggle 
}: PlanCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      drawCanvas();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [geojson, selectedFeature, imageLoaded]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw GeoJSON overlays
    if (geojson?.features) {
      geojson.features.forEach((feature) => {
        const coords = feature.geometry.coordinates[0];
        const isSelected = selectedFeature === feature.properties.id;
        const isIncluded = feature.properties.included;

        ctx.beginPath();
        ctx.moveTo(coords[0][0], coords[0][1]);
        coords.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.closePath();

        // Fill with semi-transparent color
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

        // Add label
        const centerX = coords.reduce((sum, [x]) => sum + x, 0) / coords.length;
        const centerY = coords.reduce((sum, [, y]) => sum + y, 0) / coords.length;
        
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(feature.properties.id, centerX, centerY);
      });
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!geojson?.features) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Check which polygon was clicked
    for (const feature of geojson.features) {
      const coords = feature.geometry.coordinates[0];
      if (isPointInPolygon([x, y], coords)) {
        setSelectedFeature(feature.properties.id);
        onPolygonClick?.(feature.properties.id);
        return;
      }
    }

    // Clear selection if clicked outside
    setSelectedFeature(null);
  };

  const isPointInPolygon = (point: number[], polygon: number[][]) => {
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

  const toggleSelectedFeature = () => {
    if (!selectedFeature || !geojson?.features) return;

    const feature = geojson.features.find(f => f.properties.id === selectedFeature);
    if (feature) {
      onPolygonToggle?.(selectedFeature, !feature.properties.included);
    }
  };

  const selectedFeatureData = geojson?.features.find(f => f.properties.id === selectedFeature);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-auto cursor-crosshair"
          style={{ maxHeight: '70vh' }}
        />
      </div>

      {selectedFeatureData && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
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
          
          <Button
            variant={selectedFeatureData.properties.included ? "destructive" : "default"}
            onClick={toggleSelectedFeature}
          >
            {selectedFeatureData.properties.included ? "Exclude" : "Include"}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Click on highlighted areas to select/deselect items</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500/30 border border-green-500 rounded"></div>
            <span>Included</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500/30 border border-red-500 rounded"></div>
            <span>Excluded</span>
          </div>
        </div>
      </div>
    </div>
  );
};
