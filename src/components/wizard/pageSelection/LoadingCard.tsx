
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export const LoadingCard = () => {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading plan information...</p>
        </CardContent>
      </Card>
    </div>
  );
};
