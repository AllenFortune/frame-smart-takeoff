
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JobStatus {
  id: string;
  project_id: string;
  job_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_steps: number;
  current_step: string | null;
  result_data: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface UseJobPollingOptions {
  jobId?: string;
  projectId?: string;
  jobType?: string;
  pollInterval?: number;
  autoStart?: boolean;
}

export const useJobPolling = ({
  jobId,
  projectId,
  jobType,
  pollInterval = 2000,
  autoStart = true
}: UseJobPollingOptions = {}) => {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  // Start polling
  const startPolling = () => {
    if (isPolling) return;
    setIsPolling(true);

    intervalRef.current = setInterval(async () => {
      await fetchJobs();
    }, pollInterval);
  };

  // Stop polling
  const stopPolling = () => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      let query = supabase.from('job_status').select('*');

      if (jobId) {
        query = query.eq('id', jobId);
      } else if (projectId) {
        query = query.eq('project_id', projectId);
        if (jobType) {
          query = query.eq('job_type', jobType);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setJobs(data || []);
      
      if (jobId && data && data.length > 0) {
        setCurrentJob(data[0]);
        
        // Stop polling if job is completed or failed
        if (['completed', 'failed', 'cancelled'].includes(data[0].status)) {
          stopPolling();
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // Cancel job
  const cancelJob = async (jobIdToCancel: string) => {
    try {
      const { error } = await supabase
        .from('job_status')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobIdToCancel);

      if (error) throw error;
      await fetchJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId && !jobId) return;

    const channel = supabase
      .channel('job-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_status',
          filter: jobId ? `id=eq.${jobId}` : `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Job status update:', payload);
          fetchJobs();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [projectId, jobId]);

  // Auto-start polling
  useEffect(() => {
    if (autoStart && (projectId || jobId)) {
      fetchJobs();
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [projectId, jobId, autoStart]);

  return {
    jobs,
    currentJob,
    isPolling,
    startPolling,
    stopPolling,
    cancelJob,
    refreshJobs: fetchJobs
  };
};
