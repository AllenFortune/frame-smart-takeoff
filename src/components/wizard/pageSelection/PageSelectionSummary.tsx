
import React from 'react';

interface PageSelectionSummaryProps {
  selectedPages: Set<string>;
  pages: any[];
}

export const PageSelectionSummary = ({
  selectedPages,
  pages
}: PageSelectionSummaryProps) => {
  const getSelectedPlanNames = () => {
    return Array.from(selectedPages)
      .map(pageId => {
        const page = pages.find(p => p.id === pageId);
        if (!page) return '';
        
        if (page.sheet_number && page.description) {
          return `${page.sheet_number} - ${page.description}`;
        } else if (page.sheet_number) {
          return `${page.sheet_number}`;
        } else {
          return `Page ${page.page_no}`;
        }
      })
      .filter(Boolean)
      .slice(0, 3) // Show first 3
      .join(', ');
  };

  const selectedNames = getSelectedPlanNames();
  const hasMoreSelected = selectedPages.size > 3;

  if (selectedPages.size === 0) return null;

  return (
    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
      <p className="text-sm font-medium mb-1">Selected Plans:</p>
      <p className="text-sm text-muted-foreground">
        {selectedNames}
        {hasMoreSelected && ` and ${selectedPages.size - 3} more`}
      </p>
    </div>
  );
};
