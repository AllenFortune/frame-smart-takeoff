
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadProgressProps {
  isUploading: boolean;
  progress: number;
  uploading: boolean;
  processing: boolean;
  completed: boolean;
  error: string | null;
  onReset: () => void;
}

export const UploadProgress = ({
  isUploading,
  progress,
  uploading,
  processing,
  completed,
  error,
  onReset
}: UploadProgressProps) => {
  const getProgressLabel = () => {
    if (uploading && progress < 50) {
      return "Uploading files...";
    } else if (processing) {
      return "Processing and classifying pages...";
    } else if (completed) {
      return "Complete!";
    } else if (error) {
      return "Upload failed";
    }
    return "Ready to upload";
  };

  if (!isUploading && !error) return null;

  return (
    <>
      {isUploading && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{getProgressLabel()}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {processing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              Using AI to classify and analyze plan pages...
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Upload Failed</p>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}
    </>
  );
};
