
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Image } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'pdf' | 'image';
  onViewChange: (view: 'pdf' | 'image') => void;
  pdfAvailable: boolean;
  imageAvailable?: boolean;
}

export const ViewToggle = ({ 
  currentView, 
  onViewChange, 
  pdfAvailable, 
  imageAvailable = false 
}: ViewToggleProps) => {
  // Don't show toggle if neither or only one option is available
  if (!pdfAvailable && !imageAvailable) {
    return null;
  }
  
  // If only one option is available, show it as info rather than toggle
  if (!pdfAvailable || !imageAvailable) {
    const availableMode = pdfAvailable ? 'pdf' : 'image';
    const Icon = pdfAvailable ? FileText : Image;
    const label = pdfAvailable ? 'PDF' : 'Image';
    
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span>{label} View</span>
      </div>
    );
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
