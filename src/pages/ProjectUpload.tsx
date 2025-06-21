
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useParams, useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { classifyPages } from "@/utils/edgeFunctions";
import { useJobPolling } from "@/hooks/useJobPolling";
import { useUploadProgress } from "@/hooks/useUploadProgress";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { FileList } from "@/components/upload/FileList";
import { UploadProgress } from "@/components/upload/UploadProgress";
import { UploadButton } from "@/components/upload/UploadButton";

const ProjectUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  
  const uploadProgress = useUploadProgress();
  
  const { currentJob, isPolling } = useJobPolling({
    projectId: id,
    jobType: 'classify-pages',
    autoStart: false
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      toast({
        title: "Invalid files",
        description: "Only PDF files are allowed",
        variant: "destructive",
      });
    }
    
    setFiles(pdfFiles);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== droppedFiles.length) {
      toast({
        title: "Invalid files",
        description: "Only PDF files are allowed",
        variant: "destructive",
      });
    }
    
    setFiles(pdfFiles);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const uploadFilesToStorage = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = `${user?.id}/${id}/${Date.now()}-${file.name}`;
      
      console.log(`Uploading file: ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from('plan-pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('plan-pdfs')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(urlData.publicUrl);
      
      // Update progress (upload is 50% of total)
      const progress = Math.round(((i + 1) / files.length) * 50);
      uploadProgress.updateProgress(progress);
    }
    
    return uploadedUrls;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select PDF files to upload",
        variant: "destructive",
      });
      return;
    }

    if (!user || !id) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting file upload process...');
      uploadProgress.startUpload();
      
      // Step 1: Upload files to storage
      const uploadedUrls = await uploadFilesToStorage(files);
      console.log('Files uploaded successfully:', uploadedUrls);
      
      uploadProgress.updateProgress(50);
      uploadProgress.startProcessing();
      
      // Step 2: Process each PDF
      for (let i = 0; i < uploadedUrls.length; i++) {
        const pdfUrl = uploadedUrls[i];
        console.log(`Processing PDF ${i + 1}/${uploadedUrls.length}: ${pdfUrl}`);
        
        try {
          const result = await classifyPages(id, pdfUrl);
          console.log('Classification result:', result);
          
          // Update progress
          const processingProgress = 50 + Math.round(((i + 1) / uploadedUrls.length) * 50);
          uploadProgress.updateProgress(processingProgress);
          
        } catch (classifyError) {
          console.error('Classification error for URL:', pdfUrl, classifyError);
          uploadProgress.failUpload(`Failed to process ${files[i]?.name || 'PDF'}: ${classifyError instanceof Error ? classifyError.message : 'Unknown error'}`);
          return;
        }
      }

      uploadProgress.completeUpload(`Successfully processed ${files.length} PDF file(s)`);

      // Navigate to preflight after a short delay
      setTimeout(() => {
        navigate(`/project/${id}/preflight`);
      }, 1500);

    } catch (error) {
      console.error('Upload process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      uploadProgress.failUpload(errorMessage);
    }
  };

  const isUploading = uploadProgress.uploading || uploadProgress.processing;

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
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
      </div>
    </div>
  );
};

export default ProjectUpload;
