
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { JobStatus } from './types';

export const setupRealtimeSubscription = (
  projectId: string,
  onJobUpdate: (job: JobStatus) => void,
  onJobDelete: (jobId: string) => void
): RealtimeChannel => {
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
          onJobUpdate(updatedJob);
        }
        
        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          onJobDelete(deletedId);
        }
      }
    )
    .subscribe();

  return channel;
};
