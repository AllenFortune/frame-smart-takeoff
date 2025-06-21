
import { supabase } from '@/integrations/supabase/client';

export const checkStorageBucket = async (bucketName: string) => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      console.error(`Storage bucket ${bucketName} error:`, error);
      return false;
    }
    console.log(`Storage bucket ${bucketName} exists and is public:`, data?.public);
    return true;
  } catch (error) {
    console.error(`Failed to check storage bucket ${bucketName}:`, error);
    return false;
  }
};

export const checkImageAccess = async (imageUrl: string) => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Failed to access image ${imageUrl}:`, error);
    return false;
  }
};

export const debugStorageIssues = async (projectId: string) => {
  console.log('=== Storage Debug Info ===');
  
  // Check if plan-images bucket exists
  const bucketExists = await checkStorageBucket('plan-images');
  console.log('plan-images bucket accessible:', bucketExists);
  
  // List files in the project folder
  try {
    const { data: files, error } = await supabase.storage
      .from('plan-images')
      .list(projectId);
    
    if (error) {
      console.error('Error listing files:', error);
    } else {
      console.log(`Files in ${projectId}:`, files?.map(f => f.name) || []);
    }
  } catch (error) {
    console.error('Failed to list files:', error);
  }
  
  console.log('=== End Storage Debug ===');
};
