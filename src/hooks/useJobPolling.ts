
import { useState, useEffect, useRef } from 'react';

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

  // Mock job status for now since the table doesn't exist yet
  const mockJob: JobStatus = {
    id: 'mock-job-1',
    project_id: projectId || '',
    job_type: jobType || 'extract_summary',
    status: 'processing',
    progress: 65,
    total_steps: 100,
    current_step: 'extract',
    result_data: {},
    error_message: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: null
  };

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

  // Fetch jobs - using mock data for now
  const fetchJobs = async () => {
    try {
      // Mock data until job_status table is available
      const mockJobs = [mockJob];
      setJobs(mockJobs);
      
      if (jobId && mockJobs.length > 0) {
        setCurrentJob(mockJobs[0]);
        
        // Stop polling if job is completed or failed
        if (['completed', 'failed', 'cancelled'].includes(mockJobs[0].status)) {
          stopPolling();
        }
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // Cancel job - mock implementation
  const cancelJob = async (jobIdToCancel: string) => {
    try {
      console.log('Cancelling job:', jobIdToCancel);
      // Mock implementation
      if (currentJob && currentJob.id === jobIdToCancel) {
        setCurrentJob({
          ...currentJob,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

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
