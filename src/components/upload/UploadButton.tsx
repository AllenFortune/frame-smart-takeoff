
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle } from "lucide-react";

interface UploadButtonProps {
  files: File[];
  isUploading: boolean;
  completed: boolean;
  error: string | null;
  onUpload: () => void;
  hasExistingPlans?: boolean;
}

export const UploadButton = ({
  files,
  isUploading,
  completed,
  error,
  onUpload,
  hasExistingPlans = false
}: UploadButtonProps) => {
  if (files.length === 0) return null;

  const getButtonText = () => {
    if (completed) return "Upload Complete";
    if (isUploading) return "Uploading...";
    if (hasExistingPlans) return `Add ${files.length} More File${files.length > 1 ? 's' : ''}`;
    return `Upload ${files.length} File${files.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="mt-6 pt-6 border-t">
      <Button
        onClick={onUpload}
        disabled={isUploading || completed}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        {completed ? (
          <CheckCircle className="w-5 h-5 mr-2" />
        ) : (
          <Upload className="w-5 h-5 mr-2" />
        )}
        {getButtonText()}
      </Button>
      
      {error && (
        <p className="text-sm text-red-600 mt-2 text-center">
          {error}
        </p>
      )}
    </div>
  );
};
