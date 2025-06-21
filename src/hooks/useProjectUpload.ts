
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { classifyPages } from "@/utils/edgeFunctions";
import { useUploadProgress } from "@/hooks/useUploadProgress";

export const useProjectUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const uploadProgress = useUploadProgress();

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

      console.log('Upload and processing complete, navigating to wizard...');
      
      // Navigate to wizard after a short delay
      setTimeout(() => {
        navigate(`/project/${id}/wizard`);
      }, 1500);

    } catch (error) {
      console.error('Upload process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Full error details:', error);
      uploadProgress.failUpload(errorMessage);
      
      // Additional error logging for debugging
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
    }
  };

  return {
    files,
    uploadProgress,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleUpload,
    isUploading: uploadProgress.uploading || uploadProgress.processing
  };
};
