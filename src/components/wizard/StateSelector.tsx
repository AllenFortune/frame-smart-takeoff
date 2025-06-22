
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

export interface BuildingCodeRequirements {
  shearWalls: boolean;
  windLoadRequirements: string[];
  seismicRequirements: string[];
  minimumLumberGrades: string[];
  nailingSchedules: string[];
  snowLoadRequirements: string[];
  specialRequirements: string[];
}

export const BUILDING_CODES: Record<string, BuildingCodeRequirements> = {
  CA: {
    shearWalls: true,
    windLoadRequirements: ['Wind Zone 2-4', 'Exposure Category C'],
    seismicRequirements: ['Seismic Design Category D-F', 'Shear wall panels required'],
    minimumLumberGrades: ['Douglas Fir-Larch No.2', 'Southern Pine No.2'],
    nailingSchedules: ['8d @ 6" o.c. edges, 12" o.c. field'],
    snowLoadRequirements: ['Varies by elevation'],
    specialRequirements: ['Shear wall panels', 'Hold-down anchors', 'Seismic connections']
  },
  FL: {
    shearWalls: false,
    windLoadRequirements: ['Wind Zone 3-5', 'Hurricane strapping required'],
    seismicRequirements: ['Minimal seismic requirements'],
    minimumLumberGrades: ['Southern Pine No.2', 'Douglas Fir-Larch No.2'],
    nailingSchedules: ['8d @ 6" o.c. edges, 12" o.c. field', 'Hurricane clips required'],
    snowLoadRequirements: ['Not applicable'],
    specialRequirements: ['Hurricane strapping', 'Wind-resistant connections', 'Flood-resistant materials']
  },
  TX: {
    shearWalls: false,
    windLoadRequirements: ['Wind Zone 2-4', 'Tornado considerations'],
    seismicRequirements: ['Minimal seismic requirements'],
    minimumLumberGrades: ['Southern Pine No.2', 'Douglas Fir-Larch No.2'],
    nailingSchedules: ['8d @ 6" o.c. edges, 12" o.c. field'],
    snowLoadRequirements: ['Minimal snow loads'],
    specialRequirements: ['Expansive soil considerations', 'High wind connections']
  },
  NY: {
    shearWalls: false,
    windLoadRequirements: ['Wind Zone 1-2'],
    seismicRequirements: ['Minimal seismic requirements'],
    minimumLumberGrades: ['Douglas Fir-Larch No.2', 'Southern Pine No.2'],
    nailingSchedules: ['8d @ 6" o.c. edges, 12" o.c. field'],
    snowLoadRequirements: ['40-60 psf ground snow load'],
    specialRequirements: ['Snow load calculations', 'Frost protection']
  }
};

export const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

interface StateSelectorProps {
  selectedState?: string;
  onStateChange: (state: string) => void;
}

export const StateSelector = ({ selectedState, onStateChange }: StateSelectorProps) => {
  const selectedStateData = selectedState ? BUILDING_CODES[selectedState] : null;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="state-select" className="text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Building Location (State)
        </Label>
        <Select value={selectedState} onValueChange={onStateChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select your state for building code requirements" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedStateData && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium text-sm mb-2">Building Code Requirements for {US_STATES.find(s => s.code === selectedState)?.name}</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              {selectedStateData.shearWalls && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2">
                  <strong className="text-amber-800">⚠️ Shear Walls Required</strong>
                  <p className="text-amber-700">This state requires shear wall panels for lateral force resistance.</p>
                </div>
              )}
              {selectedStateData.specialRequirements.length > 0 && (
                <div>
                  <strong>Special Requirements:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {selectedStateData.specialRequirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
