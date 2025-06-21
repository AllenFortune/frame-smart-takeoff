
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Move, 
  Square, 
  Circle, 
  Pen, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut,
  Hand,
  Edit3
} from 'lucide-react';
import { Tool } from './types';

interface CanvasToolbarProps {
  activeTool: Tool;
  scale: number;
  undoStackLength: number;
  redoStackLength: number;
  onToolChange: (tool: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const CanvasToolbar = ({
  activeTool,
  scale,
  undoStackLength,
  redoStackLength,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo
}: CanvasToolbarProps) => {
  const tools = [
    { tool: 'select' as Tool, icon: Move, label: 'Select' },
    { tool: 'pan' as Tool, icon: Hand, label: 'Pan' },
    { tool: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
    { tool: 'polygon' as Tool, icon: Pen, label: 'Polygon' },
    { tool: 'edit' as Tool, icon: Edit3, label: 'Edit' }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tool Selection */}
          <div className="flex items-center gap-1">
            {tools.map(({ tool, icon: Icon, label }) => (
              <Button
                key={tool}
                variant={activeTool === tool ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToolChange(tool)}
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
            <Button variant="outline" size="sm" onClick={onZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-mono w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={onZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUndo}
              disabled={undoStackLength === 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRedo}
              disabled={redoStackLength === 0}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
