
export interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  selectedPages?: string[];
  overlay?: any;
}

export interface StepStateActions {
  updateStepPageSelection: (pageId: string) => void;
  updateStepPagesSelection: (pageIds: string[]) => void;
  updateStepStatus: (stepId: string, status: StepData['status'], overlay?: any) => void;
}
