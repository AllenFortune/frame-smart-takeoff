
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, healthCheck, checkNetworkConnectivity } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

interface UseProjectsDataReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  retryCount: number;
  retry: () => void;
  refetch: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

export const useProjectsData = (userId: string | undefined): UseProjectsDataReturn => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(checkNetworkConnectivity());
  const [retryCount, setRetryCount] = useState(0);
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

      // Make the actual request with timeout
      const requestPromise = supabase
        .from('projects')
        .select('*')
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

      console.log(`useProjectsData: Successfully fetched ${data?.length || 0} projects`);
      setProjects(data || []);
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
    refetch
  };
};
