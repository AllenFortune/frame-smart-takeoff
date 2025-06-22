
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import { GeoJsonData } from '@/components/canvas/types';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  pdfUrl: string;
  pageNumber: number;
  geojson?: GeoJsonData;
  onPolygonClick?: (featureId: string) => void;
  className?: string;
}

export const PdfViewer = ({ 
  pdfUrl, 
  pageNumber, 
  geojson, 
  onPolygonClick,
  className = '' 
}: PdfViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState<pdfjsLib.PDFPageProxy | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Loading PDF from:', pdfUrl);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdfDoc = await loadingTask.promise;
        
        setPdf(pdfDoc);
        console.log(`PDF loaded successfully. Total pages: ${pdfDoc.numPages}`);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF document');
      } finally {
        setIsLoading(false);
      }
    };

    if (pdfUrl) {
      loadPdf();
    }
  }, [pdfUrl]);

  // Load specific page
  useEffect(() => {
    const loadPage = async () => {
      if (!pdf || pageNumber < 1 || pageNumber > pdf.numPages) return;

      try {
        const pdfPage = await pdf.getPage(pageNumber);
        setPage(pdfPage);
        console.log(`Loaded page ${pageNumber}`);
      } catch (err) {
        console.error('Error loading page:', err);
        setError(`Failed to load page ${pageNumber}`);
      }
    };

    loadPage();
  }, [pdf, pageNumber]);

  // Render PDF page
  const renderPage = useCallback(async () => {
    if (!page || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    try {
      const viewport = page.getViewport({ scale, rotation });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      console.log('Page rendered successfully');
      
      // Render overlays after PDF page is rendered
      renderOverlays();
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render page');
    }
  }, [page, scale, rotation]);

  // Render GeoJSON overlays
  const renderOverlays = useCallback(() => {
    if (!geojson?.features || !overlayCanvasRef.current || !canvasRef.current) return;

    const overlayCanvas = overlayCanvasRef.current;
    const mainCanvas = canvasRef.current;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    // Match overlay canvas size to main canvas
    overlayCanvas.width = mainCanvas.width;
    overlayCanvas.height = mainCanvas.height;

    // Clear previous overlays
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Draw GeoJSON features
    geojson.features.forEach((feature) => {
      if (feature.geometry.type !== 'Polygon') return;

      const coords = feature.geometry.coordinates[0];
      const isIncluded = feature.properties.included;

      ctx.beginPath();
      ctx.moveTo(coords[0][0] * scale, coords[0][1] * scale);
      coords.forEach(([x, y]) => ctx.lineTo(x * scale, y * scale));
      ctx.closePath();

      // Fill with semi-transparent color
      ctx.fillStyle = isIncluded ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.fill();

      // Stroke
      ctx.strokeStyle = isIncluded ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add label
      const centerX = coords.reduce((sum, [x]) => sum + x, 0) / coords.length * scale;
      const centerY = coords.reduce((sum, [, y]) => sum + y, 0) / coords.length * scale;
      
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(feature.properties.id, centerX, centerY);
    });
  }, [geojson, scale]);

  // Re-render when dependencies change
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!geojson?.features || !onPolygonClick) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    // Check which polygon was clicked
    for (const feature of geojson.features) {
      if (feature.geometry.type !== 'Polygon') continue;
      
      const coords = feature.geometry.coordinates[0];
      const scaledCoords = coords.map(([px, py]) => [px * scale, py * scale]);
      
      if (isPointInPolygon([x, y], scaledCoords)) {
        onPolygonClick(feature.properties.id);
        return;
      }
    }
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

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 bg-muted rounded-lg ${className}`}>
        <div className="text-center space-y-2">
          <p className="text-red-600 font-medium">Error loading PDF</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`space-y-4 ${className}`}>
      {/* PDF Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleRotate}>
          <RotateCw className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* PDF Canvas Container */}
      <div className="relative border rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
        <canvas
          ref={canvasRef}
          className="block max-w-full h-auto"
        />
        <canvas
          ref={overlayCanvasRef}
          onClick={handleCanvasClick}
          className="absolute top-0 left-0 cursor-crosshair"
          style={{ pointerEvents: geojson ? 'auto' : 'none' }}
        />
      </div>

      {/* Page Info */}
      {pdf && (
        <div className="text-sm text-muted-foreground text-center">
          Page {pageNumber} of {pdf.numPages}
        </div>
      )}
    </div>
  );
};
