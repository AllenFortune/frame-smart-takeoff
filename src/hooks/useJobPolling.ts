
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

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

  // Fetch jobs from Supabase
  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('job_status').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      if (jobType) {
        query = query.eq('job_type', jobType);
      }
      
      if (jobId) {
        query = query.eq('id', jobId);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }
      
      setJobs(data || []);
      
      // Set current job if we have a specific job ID
      if (jobId && data?.length) {
        const job = data.find(j => j.id === jobId) || data[0];
        setCurrentJob(job);
        
        // Stop polling if job is completed or failed
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          stopPolling();
        }
      } else if (data?.length) {
        // Get the most recent job if no specific job ID
        setCurrentJob(data[0]);
        
        if (['completed', 'failed', 'cancelled'].includes(data[0].status)) {
          stopPolling();
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
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

      if (error) {
        console.error('Error cancelling job:', error);
        return;
      }

      // Update local state
      if (currentJob && currentJob.id === jobIdToCancel) {
        setCurrentJob({
          ...currentJob,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }

      // Refresh jobs
      await fetchJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  // Set up real-time subscription
  const setupRealtimeSubscription = () => {
    if (!projectId) return;

    const channel = supabase
      .channel('job_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_status',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Job status update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedJob = payload.new as JobStatus;
            
            // Update jobs list
            setJobs(prevJobs => {
              const existingIndex = prevJobs.findIndex(j => j.id === updatedJob.id);
              if (existingIndex >= 0) {
                const newJobs = [...prevJobs];
                newJobs[existingIndex] = updatedJob;
                return newJobs;
              } else {
                return [updatedJob, ...prevJobs];
              }
            });
            
            // Update current job if it matches
            if (currentJob?.id === updatedJob.id || jobId === updatedJob.id) {
              setCurrentJob(updatedJob);
              
              // Stop polling if job is completed
              if (['completed', 'failed', 'cancelled'].includes(updatedJob.status)) {
                stopPolling();
              }
            }
          }
          
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setJobs(prevJobs => prevJobs.filter(j => j.id !== deletedId));
            
            if (currentJob?.id === deletedId) {
              setCurrentJob(null);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  // Create a new job
  const createJob = async (projectId: string, jobType: string, totalSteps: number = 100) => {
    try {
      const { data, error } = await supabase
        .from('job_status')
        .insert({
          project_id: projectId,
          job_type: jobType,
          status: 'pending',
          progress: 0,
          total_steps: totalSteps
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating job:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating job:', error);
      return null;
    }
  };

  // Auto-start polling and set up realtime
  useEffect(() => {
    if (autoStart && (projectId || jobId)) {
      fetchJobs();
      setupRealtimeSubscription();
      startPolling();
    }

    return () => {
      stopPolling();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [projectId, jobId, autoStart]);

  return {
    jobs,
    currentJob,
    isPolling,
    loading,
    startPolling,
    stopPolling,
    cancelJob,
    createJob,
    refreshJobs: fetchJobs
  };
};
