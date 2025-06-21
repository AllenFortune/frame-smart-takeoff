
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

interface FileListProps {
  files: File[];
  uploadCompleted: boolean;
  uploadError: string | null;
}

export const FileList = ({ files, uploadCompleted, uploadError }: FileListProps) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      <h4 className="font-medium">Selected files:</h4>
      {files.map((file, index) => (
        <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
          <FileText className="w-5 h-5 text-primary" />
          <span className="flex-1 text-sm">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
          {uploadCompleted && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {uploadError && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
      ))}
    </div>
  );
};
