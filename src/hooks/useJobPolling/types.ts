
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

export interface UseJobPollingOptions {
  jobId?: string;
  projectId?: string;
  jobType?: string;
  pollInterval?: number;
  autoStart?: boolean;
}
