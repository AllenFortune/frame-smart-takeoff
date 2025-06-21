import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeoJsonData } from '@/components/canvas/types';

export interface Detection {
  id: string;
  type: string;
  material?: string;
  quantity: number;
  length_ft?: number;
  area_sqft?: number;
  confidence: number;
  status: 'verified' | 'flagged' | 'pending';
  feature_id?: string;
}

export const useDetectionData = (projectId: string) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractDetectionsFromOverlays = (overlays: any[]): Detection[] => {
    const detections: Detection[] = [];
    
    overlays.forEach(overlay => {
      if (overlay.geojson?.features) {
        overlay.geojson.features.forEach((feature: any) => {
          if (feature.properties) {
            // Calculate area for polygon features
            let area = 0;
            if (feature.geometry?.coordinates?.[0]) {
              const coords = feature.geometry.coordinates[0];
              // Simple polygon area calculation (shoelace formula)
              for (let i = 0; i < coords.length - 1; i++) {
                area += (coords[i][0] * coords[i + 1][1] - coords[i + 1][0] * coords[i][1]);
              }
              area = Math.abs(area) / 2;
              // Convert to square feet (assuming coordinates are in feet)
              area = area / 144; 
            }

            const detection: Detection = {
              id: feature.properties.id || `det_${Math.random().toString(36).substr(2, 9)}`,
              type: feature.properties.type || 'Unknown',
              material: feature.properties.material,
              quantity: 1, // Default to 1, can be calculated based on area/length
              length_ft: feature.properties.length_ft,
              area_sqft: area > 0 ? Math.round(area * 100) / 100 : undefined,
              confidence: feature.properties.confidence || 0.8,
              status: feature.properties.included ? 'verified' : 'flagged',
              feature_id: feature.properties.id
            };

            // Calculate quantity based on type and dimensions
            if (detection.type.toLowerCase().includes('stud') && detection.length_ft) {
              detection.quantity = Math.ceil(detection.length_ft / 16); // Studs typically 16" on center
            } else if (detection.type.toLowerCase().includes('plate') && detection.length_ft) {
              detection.quantity = Math.ceil(detection.length_ft / 8); // Plates in 8ft sections
            } else if (detection.area_sqft) {
              detection.quantity = Math.ceil(detection.area_sqft / 32); // Sheathing in 4x8 sheets
            }

            detections.push(detection);
          }
        });
      }
    });

    return detections;
  };

  const fetchDetections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project pages and their overlays
      const { data: pages, error: pagesError } = await supabase
        .from('plan_pages')
        .select(`
          id,
          plan_overlays (
            id,
            geojson,
            step
          )
        `)
        .eq('project_id', projectId);

      if (pagesError) throw pagesError;

      // Extract all overlays
      const allOverlays = pages?.flatMap(page => page.plan_overlays || []) || [];
      
      // Convert overlays to detections
      const extractedDetections = extractDetectionsFromOverlays(allOverlays);
      
      // Group similar detections and sum quantities
      const groupedDetections = new Map<string, Detection>();
      
      extractedDetections.forEach(detection => {
        const key = `${detection.type}_${detection.material || 'default'}`;
        if (groupedDetections.has(key)) {
          const existing = groupedDetections.get(key)!;
          existing.quantity += detection.quantity;
          // Keep the highest confidence
          existing.confidence = Math.max(existing.confidence, detection.confidence);
          // Keep verified status if any are verified
          if (detection.status === 'verified') {
            existing.status = 'verified';
          }
        } else {
          groupedDetections.set(key, { ...detection });
        }
      });

      setDetections(Array.from(groupedDetections.values()));
    } catch (err) {
      console.error('Error fetching detections:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch detections');
    } finally {
      setLoading(false);
    }
  };

  const updateDetectionStatus = async (detectionId: string, status: Detection['status']) => {
    setDetections(prev => 
      prev.map(d => 
        d.id === detectionId ? { ...d, status } : d
      )
    );
  };

  useEffect(() => {
    if (projectId) {
      fetchDetections();
    }
  }, [projectId]);

  return {
    detections,
    loading,
    error,
    refreshDetections: fetchDetections,
    updateDetectionStatus
  };
};
