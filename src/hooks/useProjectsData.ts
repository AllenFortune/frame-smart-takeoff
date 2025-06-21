
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, healthCheck, checkNetworkConnectivity } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
  sheet_count: number;
}

interface UseProjectsDataReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  retryCount: number;
  retry: () => void;
  refetch: () => void;
  deleteProject: (projectId: string) => Promise<void>;
  deletingProjects: Set<string>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

export const useProjectsData = (userId: string | undefined): UseProjectsDataReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(checkNetworkConnectivity());
  const [retryCount, setRetryCount] = useState(0);
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setIsOnline(true);
      if (error && userId) {
        console.log('Network: Attempting to refetch data after reconnection');
        fetchProjects();
      }
    };

    const handleOffline = () => {
      console.log('Network: Gone offline');
      setIsOnline(false);
      setError('No internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error, userId]);

  const fetchProjects = useCallback(async (retryAttempt = 0) => {
    if (!userId) {
      console.log('useProjectsData: No user ID provided');
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      console.log(`useProjectsData: Fetching projects for user ${userId} (attempt ${retryAttempt + 1})`);
      setError(null);
      
      if (retryAttempt === 0) {
        setLoading(true);
      }

      // Check network connectivity first
      if (!checkNetworkConnectivity()) {
        throw new Error('No internet connection');
      }

      // Perform health check on first attempt
      if (retryAttempt === 0) {
        console.log('useProjectsData: Performing health check...');
        const isHealthy = await healthCheck();
        if (!isHealthy) {
          throw new Error('Supabase service unavailable');
        }
        console.log('useProjectsData: Health check passed');
      }

      // Set up request timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 10000); // 10 second timeout
      });

      // Make the actual request with timeout - now including sheet count
      const requestPromise = supabase
        .from('projects')
        .select(`
          *,
          sheet_count:plan_pages(count)
        `)
        .eq('owner', userId)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      const { data, error: supabaseError } = await Promise.race([
        requestPromise,
        timeoutPromise
      ]) as any;

      // Clear timeout if request completed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (signal.aborted) {
        console.log('useProjectsData: Request was aborted');
        return;
      }

      if (supabaseError) {
        console.error('useProjectsData: Supabase error:', supabaseError);
        throw new Error(`Database error: ${supabaseError.message}`);
      }

      // Transform the data to flatten the sheet_count
      const transformedData = data?.map((project: any) => ({
        ...project,
        sheet_count: project.sheet_count?.[0]?.count || 0
      })) || [];

      console.log(`useProjectsData: Successfully fetched ${transformedData?.length || 0} projects`);
      setProjects(transformedData);
      setRetryCount(0); // Reset retry count on success
      
      if (retryAttempt > 0) {
        toast({
          title: "Connection Restored",
          description: "Successfully loaded your projects.",
        });
      }

    } catch (err) {
      if (signal.aborted) {
        console.log('useProjectsData: Request was aborted, ignoring error');
        return;
      }

      console.error(`useProjectsData: Error on attempt ${retryAttempt + 1}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Retry logic with exponential backoff
      if (retryAttempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, retryAttempt);
        console.log(`useProjectsData: Retrying in ${delay}ms...`);
        
        setRetryCount(retryAttempt + 1);
        
        timeoutRef.current = setTimeout(() => {
          fetchProjects(retryAttempt + 1);
        }, delay);
        
        return;
      }

      // Max retries exceeded
      setError(errorMessage);
      setRetryCount(retryAttempt + 1);
      
      toast({
        title: "Connection Error",
        description: `Failed to load projects: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const deleteProject = useCallback(async (projectId: string) => {
    if (!userId) {
      console.log('deleteProject: No user ID provided');
      toast({
        title: "Authentication Required",
        description: "Please log in to delete projects.",
        variant: "destructive",
      });
      return;
    }

    // Add project to deleting set
    setDeletingProjects(prev => new Set(prev).add(projectId));
    
    try {
      console.log(`deleteProject: Deleting project ${projectId} for user ${userId}`);
      
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('owner', userId); // Extra safety check

      if (deleteError) {
        console.error('deleteProject: Supabase error:', deleteError);
        throw new Error(`Failed to delete project: ${deleteError.message}`);
      }

      console.log('deleteProject: Successfully deleted project:', projectId);
      
      // Remove project from local state immediately
      setProjects(prev => prev.filter(project => project.id !== projectId));
      
      toast({
        title: "Success",
        description: "Project deleted successfully!",
      });

    } catch (error) {
      console.error('deleteProject: Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Remove project from deleting set
      setDeletingProjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(projectId);
        return newSet;
      });
    }
  }, [userId, toast]);

  // Manual retry function
  const retry = useCallback(() => {
    console.log('useProjectsData: Manual retry triggered');
    setRetryCount(0);
    fetchProjects(0);
  }, [fetchProjects]);

  // Refetch function (alias for retry)
  const refetch = useCallback(() => {
    retry();
  }, [retry]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchProjects();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userId, fetchProjects]);

  return {
    projects,
    loading,
    error,
    isOnline,
    retryCount,
    retry,
    refetch,
    deleteProject,
    deletingProjects
  };
};
