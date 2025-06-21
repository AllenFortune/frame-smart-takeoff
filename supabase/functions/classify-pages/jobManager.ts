
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { JobData } from './types.ts';

export class JobManager {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async createJob(projectId: string): Promise<JobData> {
    const { data: jobData, error: jobError } = await this.supabase
      .from('job_status')
      .insert({
        project_id: projectId,
        job_type: 'classify-pages',
        status: 'processing',
        progress: 0,
        total_steps: 100,
        current_step: 'Processing PDF pages'
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    return jobData;
  }

  async updateJobProgress(jobId: string, progress: number, currentStep: string): Promise<void> {
    await this.supabase
      .from('job_status')
      .update({ progress, current_step: currentStep })
      .eq('id', jobId);
  }

  async markJobFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.supabase
      .from('job_status')
      .update({ 
        status: 'failed', 
        error_message: errorMessage,
        progress: 0
      })
      .eq('id', jobId);
  }

  async markJobCompleted(jobId: string, resultData: any): Promise<void> {
    await this.supabase
      .from('job_status')
      .update({ 
        status: 'completed', 
        progress: 100,
        current_step: 'Classification and thumbnail generation complete',
        completed_at: new Date().toISOString(),
        result_data: resultData
      })
      .eq('id', jobId);
  }
}
