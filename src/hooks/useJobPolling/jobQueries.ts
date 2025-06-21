
import { supabase } from '@/integrations/supabase/client';
import { JobStatus } from './types';

export const fetchJobs = async (
  projectId?: string,
  jobType?: string,
  jobId?: string
): Promise<JobStatus[]> => {
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
    throw error;
  }
  
  return (data || []) as JobStatus[];
};

export const cancelJobQuery = async (jobId: string): Promise<void> => {
  const { error } = await supabase
    .from('job_status')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    console.error('Error cancelling job:', error);
    throw error;
  }
};

export const createJobQuery = async (
  projectId: string, 
  jobType: string, 
  totalSteps: number = 100
): Promise<JobStatus | null> => {
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

  return data as JobStatus;
};
