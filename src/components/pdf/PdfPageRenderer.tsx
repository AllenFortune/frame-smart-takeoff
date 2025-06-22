
import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfPageRendererProps {
  pdfUrl: string;
  pageNumber: number;
  width?: number;
  height?: number;
  className?: string;
  onLoadSuccess?: () => void;
  onLoadError?: (error: Error) => void;
}

export const PdfPageRenderer = ({
  pdfUrl,
  pageNumber,
  width = 300,
  height,
  className = '',
  onLoadSuccess,
  onLoadError
}: PdfPageRendererProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded successfully: ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);
    onLoadSuccess?.();
  }, [onLoadSuccess]);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError(error.message);
    setLoading(false);
    onLoadError?.(error);
  }, [onLoadError]);

  const onPageLoadSuccess = useCallback(() => {
    setLoading(false);
  }, []);

  const onPageLoadError = useCallback((error: Error) => {
    console.error('Page load error:', error);
    setError(`Failed to load page ${pageNumber}: ${error.message}`);
    setLoading(false);
  }, [pageNumber]);

  // Check if page number is valid
  if (numPages && pageNumber > numPages) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`} style={{ width, height }}>
        <div className="text-center text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Page {pageNumber} not found</p>
          <p className="text-xs">Document has {numPages} pages</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded border border-red-200 ${className}`} style={{ width, height }}>
        <div className="text-center text-red-600 p-4">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-medium">Failed to load PDF</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`} style={{ width, height }}>
        <div className="text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading page {pageNumber}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded shadow-sm overflow-hidden ${className}`}>
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center p-4" style={{ width, height }}>
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        }
        error={
          <div className="flex items-center justify-center p-4 text-red-600" style={{ width, height }}>
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Failed to load PDF</p>
            </div>
          </div>
        }
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          height={height}
          onLoadSuccess={onPageLoadSuccess}
          onLoadError={onPageLoadError}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div className="flex items-center justify-center bg-gray-100" style={{ width, height }}>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          }
        />
      </Document>
    </div>
  );
};
