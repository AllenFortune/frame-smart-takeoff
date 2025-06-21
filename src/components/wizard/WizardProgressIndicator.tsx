
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Save } from "lucide-react";
import { StepData } from "@/hooks/useWizardSteps";

interface WizardProgressIndicatorProps {
  steps: StepData[];
  saving?: boolean;
}

export const WizardProgressIndicator = ({ steps, saving }: WizardProgressIndicatorProps) => {
  const completedSteps = steps.filter(step => step.status === 'complete').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="bg-card rounded-lg p-4 border mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Wizard Progress</h3>
          <p className="text-sm text-muted-foreground">
            {completedSteps} of {totalSteps} steps completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Save className="w-3 h-3" />
              Saving...
            </Badge>
          )}
          <Badge variant="outline">
            {Math.round(progressPercentage)}% Complete
          </Badge>
        </div>
      </div>
      
      <Progress value={progressPercentage} className="mb-4" />
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2 text-sm">
            {step.status === 'complete' && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            {step.status === 'running' && (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
            {step.status === 'pending' && (
              <Clock className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={step.status === 'complete' ? 'text-green-600' : 'text-muted-foreground'}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
