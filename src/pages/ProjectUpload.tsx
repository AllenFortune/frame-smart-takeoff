
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AppNavbar } from "@/components/AppNavbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { classifyPages } from "@/utils/edgeFunctions";
import { useJobPolling } from "@/hooks/useJobPolling";

const ProjectUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  
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
      
      // Update progress
      const progress = Math.round(((i + 1) / files.length) * 50); // Upload is 50% of total
      setUploadProgress(progress);
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

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('Starting file upload process...');
      
      // Step 1: Upload files to storage
      const uploadedUrls = await uploadFilesToStorage(files);
      console.log('Files uploaded successfully:', uploadedUrls);
      
      setUploadProgress(50);
      setProcessing(true);
      
      // Step 2: Process each PDF
      for (let i = 0; i < uploadedUrls.length; i++) {
        const pdfUrl = uploadedUrls[i];
        console.log(`Processing PDF ${i + 1}/${uploadedUrls.length}: ${pdfUrl}`);
        
        try {
          const result = await classifyPages(id, pdfUrl);
          console.log('Classification result:', result);
          
          // Update progress
          const processingProgress = 50 + Math.round(((i + 1) / uploadedUrls.length) * 50);
          setUploadProgress(processingProgress);
          
        } catch (classifyError) {
          console.error('Classification error for URL:', pdfUrl, classifyError);
          toast({
            title: "Processing Error",
            description: `Failed to process ${files[i]?.name || 'PDF'}: ${classifyError instanceof Error ? classifyError.message : 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }

      setUploadProgress(100);
      
      toast({
        title: "Upload complete!",
        description: `Successfully processed ${files.length} PDF file(s)`,
      });

      // Navigate to preflight after a short delay
      setTimeout(() => {
        navigate(`/project/${id}/preflight`);
      }, 1500);

    } catch (error) {
      console.error('Upload process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setUploadProgress(0);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const getProgressLabel = () => {
    if (uploadProgress < 50) {
      return "Uploading files...";
    } else if (processing && uploadProgress < 100) {
      return "Processing and classifying pages...";
    } else if (uploadProgress === 100) {
      return "Complete!";
    }
    return "Ready to upload";
  };

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
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  uploading 
                    ? "border-muted bg-muted/10" 
                    : "border-primary/30 hover:border-primary/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <CloudUpload className={`w-16 h-16 mx-auto mb-4 ${uploading ? "text-muted-foreground" : "text-primary"}`} />
                <h3 className="text-xl font-semibold mb-2">
                  {uploading ? "Processing..." : "Drag & drop your PDF plans"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {uploading ? "Please wait while we process your files" : "or click to browse files"}
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  Browse files
                </Button>
              </div>

              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Selected files:</h4>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="flex-1 text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      {uploadProgress === 100 && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {uploading && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{getProgressLabel()}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  {processing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      Using AI to classify and analyze plan pages...
                    </div>
                  )}
                </div>
              )}

              {files.length > 0 && !uploading && uploadProgress < 100 && (
                <div className="mt-6">
                  <Button
                    onClick={handleUpload}
                    className="w-full rounded-full bg-primary hover:bg-primary/90"
                    size="lg"
                  >
                    Upload & Process Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectUpload;
