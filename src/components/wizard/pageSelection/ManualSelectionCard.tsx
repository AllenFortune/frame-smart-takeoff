
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lightbulb } from "lucide-react";
import { ConfidenceThresholdControl } from "./ConfidenceThresholdControl";
import { PageSelectionSummary } from "./PageSelectionSummary";

interface ManualSelectionCardProps {
  showRecommendations: boolean;
  onShowRecommendations: (show: boolean) => void;
  confidenceThreshold: number[];
  onThresholdChange: (value: number[]) => void;
  pages: any[];
  selectedPages: Set<string>;
  onSelectAllRelevant: () => void;
  onContinue: () => void;
}

export const ManualSelectionCard = ({
  showRecommendations,
  onShowRecommendations,
  confidenceThreshold,
  onThresholdChange,
  pages,
  selectedPages,
  onSelectAllRelevant,
  onContinue
}: ManualSelectionCardProps) => {
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Manual Plan Selection
          {!showRecommendations && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowRecommendations(true)}
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              Show Recommendations
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose additional plans or adjust the AI-recommended selection for your framing take-off.
        </p>
        
        <ConfidenceThresholdControl
          confidenceThreshold={confidenceThreshold}
          onThresholdChange={onThresholdChange}
          pages={pages}
          onSelectAllRelevant={onSelectAllRelevant}
        />
        
        <Button 
          onClick={onContinue}
          disabled={selectedPages.size === 0}
          className="w-full"
        >
          Continue with Selection ({selectedPages.size})
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <PageSelectionSummary
          selectedPages={selectedPages}
          pages={pages}
        />
      </CardContent>
    </Card>
  );
};
