
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Image } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'pdf' | 'image';
  onViewChange: (view: 'pdf' | 'image') => void;
  pdfAvailable: boolean;
}

export const ViewToggle = ({ currentView, onViewChange, pdfAvailable }: ViewToggleProps) => {
  if (!pdfAvailable) {
    return null; // Don't show toggle if PDF is not available
  }

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={currentView === 'pdf' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('pdf')}
        className="h-8 px-3"
      >
        <FileText className="w-4 h-4 mr-1" />
        PDF
      </Button>
      <Button
        variant={currentView === 'image' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('image')}
        className="h-8 px-3"
      >
        <Image className="w-4 h-4 mr-1" />
        Image
      </Button>
    </div>
  );
};
