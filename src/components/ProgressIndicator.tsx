
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, X, Loader2 } from 'lucide-react';
import { JobStatus } from '@/hooks/useJobPolling';

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  estimatedDuration: number; // in seconds
}

interface ProgressIndicatorProps {
  job: JobStatus | null;
  steps?: ProgressStep[];
  onCancel?: () => void;
  className?: string;
}

const defaultSteps: ProgressStep[] = [
  { id: 'upload', label: 'Uploading', description: 'Uploading PDF files', estimatedDuration: 10 },
  { id: 'split', label: 'Processing', description: 'Splitting PDF into pages', estimatedDuration: 15 },
  { id: 'classify', label: 'Analyzing', description: 'Classifying page types with AI', estimatedDuration: 30 },
  { id: 'extract', label: 'Extracting', description: 'Extracting summary data', estimatedDuration: 25 },
  { id: 'complete', label: 'Complete', description: 'Processing complete', estimatedDuration: 0 }
];

export const ProgressIndicator = ({ 
  job, 
  steps = defaultSteps, 
  onCancel,
  className = ''
}: ProgressIndicatorProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      case 'processing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getCurrentStepIndex = () => {
    if (!job || !job.current_step) return 0;
    return steps.findIndex(step => step.id === job.current_step) || 0;
  };

  const getEstimatedTimeRemaining = () => {
    if (!job || job.status !== 'processing') return null;
    
    const currentStepIndex = getCurrentStepIndex();
    const remainingSteps = steps.slice(currentStepIndex + 1);
    const remainingTime = remainingSteps.reduce((total, step) => total + step.estimatedDuration, 0);
    
    if (remainingTime <= 0) return null;
    
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    
    if (minutes > 0) {
      return `~${minutes}m ${seconds}s remaining`;
    }
    return `~${seconds}s remaining`;
  };

  if (!job) return null;

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(job.status)}
              <div>
                <h3 className="font-medium capitalize">{job.job_type.replace('_', ' ')}</h3>
                <p className="text-sm text-muted-foreground">
                  {job.current_step ? steps.find(s => s.id === job.current_step)?.description : 'Initializing...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                {job.status}
              </Badge>
              {onCancel && job.status === 'processing' && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="w-full" />
            {getEstimatedTimeRemaining() && (
              <p className="text-xs text-muted-foreground text-right">
                {getEstimatedTimeRemaining()}
              </p>
            )}
          </div>

          {/* Step Progress */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = job.current_step === step.id;
              const isCompleted = getCurrentStepIndex() > index;
              const isPending = getCurrentStepIndex() < index;

              return (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isCompleted ? getStatusColor('completed') : 
                    isActive ? getStatusColor('processing') : 
                    'bg-gray-200'
                  }`}>
                    {isActive && (
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                  {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {isActive && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </div>
              );
            })}
          </div>

          {/* Error Message */}
          {job.status === 'failed' && job.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{job.error_message}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
