
import React from 'react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Info, AlertTriangle } from "lucide-react";

interface RecommendationHeaderProps {
  essentialMissing: number;
}

export const RecommendationHeader = ({ essentialMissing }: RecommendationHeaderProps) => {
  return (
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Info className="w-5 h-5" />
        Framing Estimator Recommendations
      </CardTitle>
      {essentialMissing > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <p className="text-amber-800 text-sm font-medium">
              {essentialMissing} essential plan type{essentialMissing > 1 ? 's' : ''} missing for accurate framing estimate
            </p>
          </div>
        </div>
      )}
    </CardHeader>
  );
};
