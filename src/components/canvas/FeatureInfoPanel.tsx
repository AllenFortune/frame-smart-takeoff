
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { GeoJsonFeature } from './types';

interface FeatureInfoPanelProps {
  selectedFeature: GeoJsonFeature;
  onToggleInclusion: (featureId: string, included: boolean) => void;
  onDeleteFeature: (featureId: string) => void;
}

export const FeatureInfoPanel = ({
  selectedFeature,
  onToggleInclusion,
  onDeleteFeature
}: FeatureInfoPanelProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={selectedFeature.properties.included ? "default" : "destructive"}>
                {selectedFeature.properties.id}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedFeature.properties.type}
              </span>
            </div>
            {selectedFeature.properties.material && (
              <p className="text-sm">Material: {selectedFeature.properties.material}</p>
            )}
            {selectedFeature.properties.length_ft && (
              <p className="text-sm">Length: {selectedFeature.properties.length_ft} ft</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={selectedFeature.properties.included ? "destructive" : "default"}
              size="sm"
              onClick={() => onToggleInclusion(
                selectedFeature.properties.id, 
                !selectedFeature.properties.included
              )}
            >
              {selectedFeature.properties.included ? "Exclude" : "Include"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteFeature(selectedFeature.properties.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
