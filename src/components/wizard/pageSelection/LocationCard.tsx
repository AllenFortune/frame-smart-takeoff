
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StateSelector } from "../StateSelector";

interface LocationCardProps {
  selectedState: string;
  onStateChange: (state: string) => void;
}

export const LocationCard = ({ selectedState, onStateChange }: LocationCardProps) => {
  return (
    <Card className="rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Building Location & Code Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <StateSelector 
          selectedState={selectedState}
          onStateChange={onStateChange}
        />
      </CardContent>
    </Card>
  );
};
