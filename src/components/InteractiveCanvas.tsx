
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { CanvasDrawing, CanvasDrawingRef } from './canvas/CanvasDrawing';
import { FeatureInfoPanel } from './canvas/FeatureInfoPanel';
import { GeoJsonData, Tool, CanvasState } from './canvas/types';
import { getCanvasCoordinates, isPointInPolygon, fitImageToContainer } from './canvas/utils';

interface InteractiveCanvasProps {
  imageUrl: string;
  geojson?: GeoJsonData;
  onPolygonClick?: (featureId: string) => void;
  onPolygonToggle?: (featureId: string, included: boolean) => void;
  onGeojsonUpdate?: (geojson: GeoJsonData) => void;
  className?: string;
}

export const InteractiveCanvas = ({ 
  imageUrl, 
  geojson, 
  onPolygonClick,
  onPolygonToggle,
  onGeojsonUpdate,
  className = ''
}: InteractiveCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasDrawingRef = useRef<CanvasDrawingRef>(null);
  
  const [state, setState] = useState<CanvasState>({
    selectedFeature: null,
    activeTool: 'select',
    imageLoaded: false,
    scale: 1,
    pan: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    isDrawing: false,
    currentPath: [],
    undoStack: [],
    redoStack: []
  });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setState(prev => ({ ...prev, imageLoaded: true }));
      handleFitImageToContainer();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Fit image to container
  const handleFitImageToContainer = useCallback(() => {
    const canvas = canvasDrawingRef.current?.getCanvas();
    const container = containerRef.current;
    const img = imageRef.current;
    
    if (!canvas || !container || !img) return;

    const newScale = fitImageToContainer(canvas, container, img);
    setState(prev => ({ ...prev, scale: newScale }));
  }, []);

  // Draw canvas when dependencies change
  useEffect(() => {
    canvasDrawingRef.current?.drawCanvas();
  }, [geojson, state.selectedFeature, state.activeTool, state.isDrawing, state.currentPath, state.imageLoaded]);

  // Handle canvas interactions
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasDrawingRef.current?.getCanvas();
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);

    if (state.activeTool === 'pan') {
      setState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: coords
      }));
      return;
    }

    if (state.activeTool === 'polygon') {
      if (!state.isDrawing) {
        setState(prev => ({
          ...prev,
          isDrawing: true,
          currentPath: [[coords.x, coords.y]]
        }));
      } else {
        setState(prev => ({
          ...prev,
          currentPath: [...prev.currentPath, [coords.x, coords.y]]
        }));
      }
      return;
    }

    if (state.activeTool === 'select' && geojson?.features) {
      // Check for polygon click
      for (const feature of geojson.features) {
        const polygonCoords = feature.geometry.coordinates[0];
        if (isPointInPolygon([coords.x, coords.y], polygonCoords)) {
          setState(prev => ({ ...prev, selectedFeature: feature.properties.id }));
          onPolygonClick?.(feature.properties.id);
          return;
        }
      }
      setState(prev => ({ ...prev, selectedFeature: null }));
    }
  };

  // Tool handlers
  const handleToolChange = (tool: Tool) => {
    setState(prev => ({ ...prev, activeTool: tool }));
  };

  const handleZoomIn = () => {
    setState(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }));
  };

  const handleZoomOut = () => {
    setState(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }));
  };

  const handleUndo = () => {
    if (state.undoStack.length === 0) return;
    const previous = state.undoStack[state.undoStack.length - 1];
    setState(prev => ({
      ...prev,
      redoStack: [...prev.redoStack, geojson!],
      undoStack: prev.undoStack.slice(0, -1)
    }));
    onGeojsonUpdate?.(previous);
  };

  const handleRedo = () => {
    if (state.redoStack.length === 0) return;
    const next = state.redoStack[state.redoStack.length - 1];
    setState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack, geojson!],
      redoStack: prev.redoStack.slice(0, -1)
    }));
    onGeojsonUpdate?.(next);
  };

  const handleToggleInclusion = (featureId: string, included: boolean) => {
    onPolygonToggle?.(featureId, included);
  };

  const handleDeleteFeature = (featureId: string) => {
    console.log('Delete feature:', featureId);
    // Delete feature logic would go here
  };

  const selectedFeatureData = geojson?.features.find(f => f.properties.id === state.selectedFeature);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      <CanvasToolbar
        activeTool={state.activeTool}
        scale={state.scale}
        undoStackLength={state.undoStack.length}
        redoStackLength={state.redoStack.length}
        onToolChange={handleToolChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="border rounded-lg overflow-hidden bg-gray-100 relative touch-pan-x touch-pan-y"
        style={{ minHeight: '400px' }}
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

      {/* Selected Feature Info */}
      {selectedFeatureData && (
        <FeatureInfoPanel
          selectedFeature={selectedFeatureData}
          onToggleInclusion={handleToggleInclusion}
          onDeleteFeature={handleDeleteFeature}
        />
      )}

      {/* Touch Instructions for Mobile */}
      <div className="block sm:hidden text-xs text-muted-foreground text-center space-y-1">
        <p>Tap to select • Pinch to zoom • Two-finger drag to pan</p>
        <p>Use toolbar buttons for drawing tools</p>
      </div>
    </div>
  );
};
