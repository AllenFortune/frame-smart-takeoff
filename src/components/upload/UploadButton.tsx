
import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  files: File[];
  isUploading: boolean;
  completed: boolean;
  error: string | null;
  onUpload: () => void;
}

export const UploadButton = ({
  files,
  isUploading,
  completed,
  error,
  onUpload
}: UploadButtonProps) => {
  if (files.length === 0 || isUploading || completed || error) {
    return null;
  }

  return (
    <div className="mt-6">
      <Button
        onClick={onUpload}
        className="w-full rounded-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        Upload & Process Plans
      </Button>
    </div>
  );
};
