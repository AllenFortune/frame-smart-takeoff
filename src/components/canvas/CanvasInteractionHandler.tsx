
import React from 'react';
import { CanvasState, GeoJsonData } from './types';
import { getCanvasCoordinates, isPointInPolygon } from './utils';
import { CanvasDrawingRef } from './CanvasDrawing';

interface CanvasInteractionHandlerProps {
  canvasDrawingRef: React.RefObject<CanvasDrawingRef>;
  state: CanvasState;
  geojson?: GeoJsonData;
  onStateUpdate: (updates: Partial<CanvasState>) => void;
  onPolygonClick?: (featureId: string) => void;
}

export const useCanvasInteractions = ({
  canvasDrawingRef,
  state,
  geojson,
  onStateUpdate,
  onPolygonClick
}: CanvasInteractionHandlerProps) => {
  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasDrawingRef.current?.getCanvas();
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);

    if (state.activeTool === 'pan') {
      onStateUpdate({
        isDragging: true,
        dragStart: coords
      });
      return;
    }

    if (state.activeTool === 'polygon') {
      if (!state.isDrawing) {
        onStateUpdate({
          isDrawing: true,
          currentPath: [[coords.x, coords.y]]
        });
      } else {
        onStateUpdate({
          currentPath: [...state.currentPath, [coords.x, coords.y]]
        });
      }
      return;
    }

    if (state.activeTool === 'select' && geojson?.features) {
      // Check for polygon click
      for (const feature of geojson.features) {
        const polygonCoords = feature.geometry.coordinates[0];
        if (isPointInPolygon([coords.x, coords.y], polygonCoords)) {
          onStateUpdate({ selectedFeature: feature.properties.id });
          onPolygonClick?.(feature.properties.id);
          return;
        }
      }
      onStateUpdate({ selectedFeature: null });
    }
  };

  return { handleCanvasMouseDown };
};
