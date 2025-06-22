
export interface EnhancedStepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  selectedPages?: string[];
  overlay?: any;
  stateSpecific?: boolean;
  buildingCode?: string;
}

export interface EnhancedStepStateActions {
  updateStepPageSelection: (pageId: string) => void;
  updateStepPagesSelection: (pageIds: string[]) => void;
  updateStepStatus: (stepId: string, status: EnhancedStepData['status'], overlay?: any) => void;
}
