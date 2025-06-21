
import { Card, CardContent } from "@/components/ui/card";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { FileList } from "@/components/upload/FileList";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { UploadButton } from "@/components/upload/UploadButton";
import { useProjectUpload } from "@/hooks/useProjectUpload";

export const ProjectUploadContent = () => {
  const {
    files,
    uploadProgress,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleUpload,
    isUploading
  } = useProjectUpload();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Plans</h1>
        <p className="text-muted-foreground">
          Upload your PDF framing plans to get started with the estimate
        </p>
      </div>

      <Card className="rounded-2xl shadow-lg p-6">
        <CardContent className="p-0">
          <FileDropZone
            files={files}
            onFileSelect={handleFileSelect}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            isUploading={isUploading}
          />

          <FileList
            files={files}
            uploadCompleted={uploadProgress.completed}
            uploadError={uploadProgress.error}
          />

          <UploadProgress
            isUploading={isUploading}
            progress={uploadProgress.progress}
            uploading={uploadProgress.uploading}
            processing={uploadProgress.processing}
            completed={uploadProgress.completed}
            error={uploadProgress.error}
            onReset={uploadProgress.reset}
          />

          <UploadButton
            files={files}
            isUploading={isUploading}
            completed={uploadProgress.completed}
            error={uploadProgress.error}
            onUpload={handleUpload}
          />
        </CardContent>
      </Card>
    </div>
  );
};
