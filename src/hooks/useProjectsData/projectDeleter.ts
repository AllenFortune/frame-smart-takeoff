
import { supabase } from '@/integrations/supabase/client';

export const deleteProjectById = async (projectId: string, userId: string): Promise<void> => {
  console.log(`deleteProject: Deleting project ${projectId} for user ${userId}`);
  
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('owner', userId); // Extra safety check

  if (deleteError) {
    console.error('deleteProject: Supabase error:', deleteError);
    throw new Error(`Failed to delete project: ${deleteError.message}`);
  }

  console.log('deleteProject: Successfully deleted project:', projectId);
};
