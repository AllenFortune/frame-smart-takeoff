
import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { JobStatus, UseJobPollingOptions } from './types';
import { fetchJobs, cancelJobQuery, createJobQuery } from './jobQueries';
import { setupRealtimeSubscription } from './realtimeSubscription';

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
      await refreshJobs();
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
  const refreshJobs = async () => {
    try {
      setLoading(true);
      
      const jobsData = await fetchJobs(projectId, jobType, jobId);
      setJobs(jobsData);
      
      // Set current job if we have a specific job ID
      if (jobId && jobsData.length) {
        const job = jobsData.find(j => j.id === jobId) || jobsData[0];
        setCurrentJob(job as JobStatus);
        
        // Stop polling if job is completed or failed
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          stopPolling();
        }
      } else if (jobsData.length) {
        // Get the most recent job if no specific job ID
        const mostRecentJob = jobsData[0] as JobStatus;
        setCurrentJob(mostRecentJob);
        
        if (['completed', 'failed', 'cancelled'].includes(mostRecentJob.status)) {
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
      await cancelJobQuery(jobIdToCancel);

      // Update local state
      if (currentJob && currentJob.id === jobIdToCancel) {
        setCurrentJob({
          ...currentJob,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }

      // Refresh jobs
      await refreshJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  // Handle real-time job updates
  const handleJobUpdate = (updatedJob: JobStatus) => {
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
  };

  // Handle real-time job deletions
  const handleJobDelete = (deletedId: string) => {
    setJobs(prevJobs => prevJobs.filter(j => j.id !== deletedId));
    
    if (currentJob?.id === deletedId) {
      setCurrentJob(null);
    }
  };

  // Create a new job
  const createJob = async (projectId: string, jobType: string, totalSteps: number = 100) => {
    try {
      return await createJobQuery(projectId, jobType, totalSteps);
    } catch (error) {
      console.error('Error creating job:', error);
      return null;
    }
  };

  // Auto-start polling and set up realtime
  useEffect(() => {
    if (autoStart && (projectId || jobId)) {
      refreshJobs();
      
      if (projectId) {
        channelRef.current = setupRealtimeSubscription(
          projectId,
          handleJobUpdate,
          handleJobDelete
        );
      }
      
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
    refreshJobs
  };
};

// Re-export types for convenience
export type { JobStatus, UseJobPollingOptions };
