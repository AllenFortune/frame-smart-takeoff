
import React from 'react';
import { CanvasToolbar } from './canvas/CanvasToolbar';
import { EnhancedCanvasContainer } from './canvas/EnhancedCanvasContainer';
import { FeatureInfoPanel } from './canvas/FeatureInfoPanel';
import { GeoJsonData } from './canvas/types';
import { useCanvasState } from '@/hooks/useCanvasState';

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
  const {
    state,
    updateState,
    handleToolChange,
    handleZoomIn,
    handleZoomOut,
    handleUndo,
    handleRedo
  } = useCanvasState();

  console.log('InteractiveCanvas: Rendering with imageUrl:', imageUrl?.substring(0, 50) + '...');
  console.log('InteractiveCanvas: Current state:', {
    imageLoaded: state.imageLoaded,
    scale: state.scale,
    activeTool: state.activeTool
  });

  const handleToggleInclusion = (featureId: string, included: boolean) => {
    onPolygonToggle?.(featureId, included);
  };

  const handleDeleteFeature = (featureId: string) => {
    console.log('Delete feature:', featureId);
    // Delete feature logic would go here
  };

  const selectedFeatureData = geojson?.features.find(f => f.properties.id === state.selectedFeature);

  // Show error state if no image URL provided
  if (!imageUrl) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="border rounded-lg overflow-hidden bg-gray-100 relative" style={{ minHeight: '400px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">No plan sheet selected</p>
              <p className="text-sm text-muted-foreground">Select a page to view the plan</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar - show once image is loaded */}
      {state.imageLoaded && (
        <CanvasToolbar
          activeTool={state.activeTool}
          scale={state.scale}
          undoStackLength={state.undoStack.length}
          redoStackLength={state.redoStack.length}
          onToolChange={handleToolChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onUndo={() => handleUndo(geojson, onGeojsonUpdate)}
          onRedo={() => handleRedo(geojson, onGeojsonUpdate)}
        />
      )}

      {/* Enhanced Canvas Container */}
      <EnhancedCanvasContainer
        imageUrl={imageUrl}
        geojson={geojson}
        state={state}
        onStateUpdate={updateState}
        onPolygonClick={onPolygonClick}
        className="h-96"
      />

      {/* Selected Feature Info */}
      {selectedFeatureData && state.imageLoaded && (
        <FeatureInfoPanel
          selectedFeature={selectedFeatureData}
          onToggleInclusion={handleToggleInclusion}
          onDeleteFeature={handleDeleteFeature}
        />
      )}

      {/* Touch Instructions for Mobile */}
      {state.imageLoaded && (
        <div className="block sm:hidden text-xs text-muted-foreground text-center space-y-1">
          <p>Tap to select • Pinch to zoom • Two-finger drag to pan</p>
          <p>Use toolbar buttons for drawing tools</p>
        </div>
      )}
    </div>
  );
};
