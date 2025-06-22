
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbnailDebugPanel } from "../ThumbnailDebugPanel";

interface PageSelectionDebugCardProps {
  projectId: string;
  onRefresh?: () => void;
}

export const PageSelectionDebugCard = ({ projectId, onRefresh }: PageSelectionDebugCardProps) => {
  return (
    <Card className="rounded-2xl shadow-lg border-orange-200 bg-orange-50/30">
      <CardHeader>
        <CardTitle className="text-lg text-orange-800">Debug Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <ThumbnailDebugPanel projectId={projectId} onRefresh={onRefresh} />
      </CardContent>
    </Card>
  );
};
