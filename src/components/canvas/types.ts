
export interface GeoJsonFeature {
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

export interface GeoJsonData {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export type Tool = 'select' | 'pan' | 'rectangle' | 'polygon' | 'edit';

export interface CanvasState {
  selectedFeature: string | null;
  activeTool: Tool;
  imageLoaded: boolean;
  scale: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
  isDrawing: boolean;
  currentPath: [number, number][];
  undoStack: GeoJsonData[];
  redoStack: GeoJsonData[];
}
