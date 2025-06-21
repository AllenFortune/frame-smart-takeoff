
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, FileText } from "lucide-react";

interface StepData {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  selectedPageId?: string;
  selectedPages?: string[];
  overlay?: any;
}

interface WizardTabsProps {
  steps: StepData[];
  activeStep: string;
  onStepChange: (step: string) => void;
}

export const WizardTabs = ({ steps, activeStep, onStepChange }: WizardTabsProps) => {
  return (
    <Tabs value={activeStep} onValueChange={onStepChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-6">
        {steps.map((step) => (
          <TabsTrigger key={step.id} value={step.id} className="text-sm">
            <div className="flex items-center gap-2">
              {step.id === "pages" && <FileText className="w-4 h-4" />}
              {step.status === "complete" && <CheckCircle className="w-4 h-4 text-green-500" />}
              {step.status === "running" && <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
              <span className="hidden sm:inline">{step.name}</span>
              <span className="sm:hidden">{step.name.split(' ')[0]}</span>
            </div>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
