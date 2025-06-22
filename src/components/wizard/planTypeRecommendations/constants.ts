
export interface PlanTypeRequirement {
  type: string;
  name: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  stateSpecific?: string[];
  estimatorNotes: string;
}

export const FRAMING_PLAN_REQUIREMENTS: PlanTypeRequirement[] = [
  {
    type: 'floor_plan',
    name: 'Floor Plans',
    description: 'Room layouts, wall locations, dimensions',
    priority: 'essential',
    estimatorNotes: 'Required for wall framing, room dimensions, and layout understanding. Critical for accurate lumber counts.'
  },
  {
    type: 'structural',
    name: 'Structural Plans',
    description: 'Beam schedules, post locations, load paths',
    priority: 'essential',
    estimatorNotes: 'Essential for determining beam sizes, post requirements, and structural lumber specifications.'
  },
  {
    type: 'framing_plan',
    name: 'Framing Plans',
    description: 'Wall framing details, header schedules',
    priority: 'essential',
    estimatorNotes: 'Shows specific framing requirements, header sizes, and construction details. Most important for lumber take-offs.'
  },
  {
    type: 'foundation',
    name: 'Foundation Plans',
    description: 'Stem walls, footings, foundation details',
    priority: 'recommended',
    estimatorNotes: 'Needed for sill plate calculations and foundation-to-framing connections.'
  },
  {
    type: 'roof',
    name: 'Roof Plans',
    description: 'Rafter/truss layout, roof framing',
    priority: 'essential',
    estimatorNotes: 'Critical for roof framing lumber, rafter calculations, and truss specifications.'
  },
  {
    type: 'wall_sections',
    name: 'Wall Sections',
    description: 'Wall assembly details, heights',
    priority: 'recommended',
    estimatorNotes: 'Shows wall heights, assembly details, and specific framing requirements.'
  },
  {
    type: 'structural_details',
    name: 'Structural Details',
    description: 'Connection details, special framing',
    priority: 'recommended',
    stateSpecific: ['CA'],
    estimatorNotes: 'Important for special connections, hold-downs, and state-specific requirements like shear walls.'
  }
];
