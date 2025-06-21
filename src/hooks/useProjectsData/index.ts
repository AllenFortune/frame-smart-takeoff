
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Project, UseProjectsDataReturn } from './types';
import { MAX_RETRIES, RETRY_DELAY_BASE } from './constants';
import { useNetworkMonitor } from './networkMonitor';
import { fetchProjectsWithRetry } from './projectsFetcher';
import { deleteProjectById } from './projectDeleter';

export const useProjectsData = (userId: string | undefined): UseProjectsDataReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [deletingProjects, setDeletingProjects] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setError(null);
      
      if (retryAttempt === 0) {
        setLoading(true);
      }

      const data = await fetchProjectsWithRetry(userId, retryAttempt, signal);
      
      if (signal.aborted) {
        return;
      }

      setProjects(data);
      setRetryCount(0); // Reset retry count on success
      
      if (retryAttempt > 0) {
        toast({
          title: "Connection Restored",
          description: "Successfully loaded your projects.",
        });
      }

    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
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

  const handleReconnect = useCallback(() => {
    if (error && userId) {
      console.log('Network: Attempting to refetch data after reconnection');
      fetchProjects();
    }
  }, [error, userId, fetchProjects]);

  const isOnline = useNetworkMonitor(handleReconnect);

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
      await deleteProjectById(projectId, userId);
      
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

export type { Project, UseProjectsDataReturn };
