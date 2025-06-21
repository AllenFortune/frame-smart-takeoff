
import { Button } from "@/components/ui/button";
import { CloudUpload } from "lucide-react";

interface FileDropZoneProps {
  files: File[];
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  isUploading: boolean;
  hasExistingPlans?: boolean;
}

export const FileDropZone = ({
  files,
  onFileSelect,
  onDrop,
  onDragOver,
  isUploading,
  hasExistingPlans = false
}: FileDropZoneProps) => {
  const getTitle = () => {
    if (isUploading) return "Processing...";
    if (hasExistingPlans) return "Add more PDF plans";
    return "Drag & drop your PDF plans";
  };

  const getDescription = () => {
    if (isUploading) return "Please wait while we process your files";
    if (hasExistingPlans) return "Upload additional plans to your existing project";
    return "or click to browse files";
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        isUploading 
          ? "border-muted bg-muted/10" 
          : "border-primary/30 hover:border-primary/50"
      }`}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <CloudUpload className={`w-16 h-16 mx-auto mb-4 ${isUploading ? "text-muted-foreground" : "text-primary"}`} />
      <h3 className="text-xl font-semibold mb-2">
        {getTitle()}
      </h3>
      <p className="text-muted-foreground mb-4">
        {getDescription()}
      </p>
      <input
        type="file"
        multiple
        accept=".pdf"
        onChange={onFileSelect}
        className="hidden"
        id="file-upload"
        disabled={isUploading}
      />
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={isUploading}
      >
        Browse files
      </Button>
    </div>
  );
};
