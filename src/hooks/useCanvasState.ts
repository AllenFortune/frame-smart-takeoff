
import { useState, useCallback } from 'react';
import { CanvasState, Tool, GeoJsonData } from '@/components/canvas/types';

export const useCanvasState = () => {
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

  const updateState = useCallback((updates: Partial<CanvasState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleToolChange = useCallback((tool: Tool) => {
    setState(prev => ({ ...prev, activeTool: tool }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setState(prev => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.1) }));
  }, []);

  const handleUndo = useCallback((geojson: GeoJsonData | undefined, onGeojsonUpdate?: (geojson: GeoJsonData) => void) => {
    if (state.undoStack.length === 0 || !geojson) return;
    const previous = state.undoStack[state.undoStack.length - 1];
    setState(prev => ({
      ...prev,
      redoStack: [...prev.redoStack, geojson],
      undoStack: prev.undoStack.slice(0, -1)
    }));
    onGeojsonUpdate?.(previous);
  }, [state.undoStack]);

  const handleRedo = useCallback((geojson: GeoJsonData | undefined, onGeojsonUpdate?: (geojson: GeoJsonData) => void) => {
    if (state.redoStack.length === 0 || !geojson) return;
    const next = state.redoStack[state.redoStack.length - 1];
    setState(prev => ({
      ...prev,
      undoStack: [...prev.undoStack, geojson],
      redoStack: prev.redoStack.slice(0, -1)
    }));
    onGeojsonUpdate?.(next);
  }, [state.redoStack]);

  return {
    state,
    updateState,
    handleToolChange,
    handleZoomIn,
    handleZoomOut,
    handleUndo,
    handleRedo
  };
};
