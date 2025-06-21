
import { Card, CardContent } from "@/components/ui/card";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { FileList } from "@/components/upload/FileList";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { UploadButton } from "@/components/upload/UploadButton";
import { ExistingPlansDisplay } from "@/components/upload/ExistingPlansDisplay";
import { useProjectUpload } from "@/hooks/useProjectUpload";
import { useProjectData } from "@/hooks/useProjectData";
import { useParams } from "react-router-dom";

export const ProjectUploadContent = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const {
    files,
    uploadProgress,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleUpload,
    isUploading
  } = useProjectUpload();

  // Fetch existing project data to show uploaded plans
  const { pages, loading: pagesLoading } = useProjectData(projectId || '');

  const hasExistingPlans = pages.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {hasExistingPlans ? 'Add More Plans' : 'Upload Plans'}
        </h1>
        <p className="text-muted-foreground">
          {hasExistingPlans 
            ? 'Upload additional PDF framing plans to your project'
            : 'Upload your PDF framing plans to get started with the estimate'
          }
        </p>
      </div>

      {/* Show existing plans if any */}
      {projectId && (
        <ExistingPlansDisplay 
          projectId={projectId}
          pages={pages}
          loading={pagesLoading}
        />
      )}

      <Card className="rounded-2xl shadow-lg p-6">
        <CardContent className="p-0">
          <FileDropZone
            files={files}
            onFileSelect={handleFileSelect}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            isUploading={isUploading}
            hasExistingPlans={hasExistingPlans}
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
            hasExistingPlans={hasExistingPlans}
          />
        </CardContent>
      </Card>
    </div>
  );
};
