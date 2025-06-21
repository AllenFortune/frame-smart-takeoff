
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadProgressState {
  progress: number;
  uploading: boolean;
  processing: boolean;
  completed: boolean;
  error: string | null;
}

export const useUploadProgress = () => {
  const [state, setState] = useState<UploadProgressState>({
    progress: 0,
    uploading: false,
    processing: false,
    completed: false,
    error: null
  });
  
  const { toast } = useToast();

  const startUpload = useCallback(() => {
    setState({
      progress: 0,
      uploading: true,
      processing: false,
      completed: false,
      error: null
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }));
  }, []);

  const startProcessing = useCallback(() => {
    setState(prev => ({
      ...prev,
      processing: true
    }));
  }, []);

  const completeUpload = useCallback((message?: string) => {
    setState(prev => ({
      ...prev,
      progress: 100,
      uploading: false,
      processing: false,
      completed: true
    }));
    
    if (message) {
      toast({
        title: "Success!",
        description: message,
      });
    }
  }, [toast]);

  const failUpload = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      uploading: false,
      processing: false,
      error
    }));
    
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const reset = useCallback(() => {
    setState({
      progress: 0,
      uploading: false,
      processing: false,
      completed: false,
      error: null
    });
  }, []);

  return {
    ...state,
    startUpload,
    updateProgress,
    startProcessing,
    completeUpload,
    failUpload,
    reset
  };
};
