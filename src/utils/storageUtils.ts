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
    console.log(`Image access check for ${imageUrl}:`, {
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });
    return response.ok;
  } catch (error) {
    console.error(`Failed to access image ${imageUrl}:`, error);
    return false;
  }
};

export const debugStorageIssues = async (projectId: string) => {
  console.log('=== Storage Debug Info ===');
  
  // Check if plan-images bucket exists and is accessible
  const bucketExists = await checkStorageBucket('plan-images');
  console.log('plan-images bucket accessible:', bucketExists);
  
  // List files in the project folder
  try {
    const { data: files, error } = await supabase.storage
      .from('plan-images')
      .list(projectId);
    
    if (error) {
      console.error('Error listing files in plan-images bucket:', error);
    } else {
      console.log(`Files in plan-images/${projectId}:`, files?.map(f => ({
        name: f.name,
        size: f.metadata?.size,
        contentType: f.metadata?.mimetype,
        lastModified: f.updated_at
      })) || []);
      
      // Test access to each image
      if (files && files.length > 0) {
        for (const file of files) {
          const { data: urlData } = supabase.storage
            .from('plan-images')
            .getPublicUrl(`${projectId}/${file.name}`);
          
          console.log(`Testing access to ${file.name}:`, urlData.publicUrl);
          await checkImageAccess(urlData.publicUrl);
        }
      }
    }
  } catch (error) {
    console.error('Failed to list files in plan-images bucket:', error);
  }
  
  // Also check plan-pdfs bucket for completeness
  try {
    const { data: pdfFiles, error: pdfError } = await supabase.storage
      .from('plan-pdfs')
      .list(`${projectId}`);
    
    if (pdfError) {
      console.error('Error listing files in plan-pdfs bucket:', pdfError);
    } else {
      console.log(`Files in plan-pdfs/${projectId}:`, pdfFiles?.map(f => f.name) || []);
    }
  } catch (error) {
    console.error('Failed to list files in plan-pdfs bucket:', error);
  }
  
  console.log('=== End Storage Debug ===');
};

// New function to cleanup duplicate plan pages
export const cleanupDuplicatePages = async (projectId: string) => {
  console.log('=== Cleaning up duplicate plan pages ===');
  
  try {
    // Get all pages for the project
    const { data: allPages, error } = await supabase
      .from('plan_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('page_no')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pages for cleanup:', error);
      return;
    }

    if (!allPages || allPages.length === 0) {
      console.log('No pages found to cleanup');
      return;
    }

    console.log(`Found ${allPages.length} total page entries`);

    // Group by page_no and identify duplicates
    const pageGroups = allPages.reduce((acc: { [key: number]: any[] }, page) => {
      if (!acc[page.page_no]) {
        acc[page.page_no] = [];
      }
      acc[page.page_no].push(page);
      return acc;
    }, {});

    const pagesToDelete: string[] = [];

    Object.entries(pageGroups).forEach(([pageNo, pages]) => {
      if (pages.length > 1) {
        console.log(`Page ${pageNo} has ${pages.length} duplicate entries`);
        // Keep the most recent (first in the sorted array), mark others for deletion
        const [keep, ...duplicates] = pages;
        console.log(`Keeping page ${pageNo} with ID ${keep.id} (created: ${keep.created_at})`);
        duplicates.forEach(dup => {
          console.log(`Marking for deletion: page ${pageNo} with ID ${dup.id} (created: ${dup.created_at})`);
          pagesToDelete.push(dup.id);
        });
      }
    });

    if (pagesToDelete.length > 0) {
      console.log(`Deleting ${pagesToDelete.length} duplicate page entries`);
      const { error: deleteError } = await supabase
        .from('plan_pages')
        .delete()
        .in('id', pagesToDelete);

      if (deleteError) {
        console.error('Error deleting duplicate pages:', deleteError);
      } else {
        console.log('Successfully cleaned up duplicate pages');
      }
    } else {
      console.log('No duplicate pages found to cleanup');
    }

  } catch (error) {
    console.error('Failed to cleanup duplicate pages:', error);
  }
  
  console.log('=== End Cleanup ===');
};
