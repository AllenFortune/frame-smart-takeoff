
import { supabase } from '@/integrations/supabase/client';
import { generateThumbnails } from '@/utils/edgeFunctions';

export const debugThumbnailGeneration = async (projectId: string) => {
  console.log('=== DEBUGGING THUMBNAIL GENERATION ===');
  
  try {
    // First, check what pages exist in the database
    const { data: pages, error: pagesError } = await supabase
      .from('plan_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('page_no');

    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return { success: false, error: pagesError.message };
    }

    console.log(`Found ${pages?.length || 0} pages in database`);
    
    if (!pages || pages.length === 0) {
      return { success: false, error: 'No pages found for this project' };
    }

    // Check the current state of image URLs
    pages.forEach(page => {
      console.log(`Page ${page.page_no}:`, {
        id: page.id,
        thumbnail_url: page.thumbnail_url ? 'EXISTS' : 'MISSING',
        preview_url: page.preview_url ? 'EXISTS' : 'MISSING', 
        full_url: page.full_url ? 'EXISTS' : 'MISSING',
        img_url: page.img_url ? 'EXISTS' : 'MISSING',
        class: page.class
      });
    });

    // Find the original PDF URL from the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return { success: false, error: projectError.message };
    }

    // Look for PDF files in storage
    const { data: files, error: filesError } = await supabase.storage
      .from('plan-pdfs')
      .list(projectId);

    if (filesError) {
      console.error('Error listing PDF files:', filesError);
      return { success: false, error: filesError.message };
    }

    console.log(`Found ${files?.length || 0} PDF files in storage`);
    
    if (!files || files.length === 0) {
      return { success: false, error: 'No PDF files found in storage for this project' };
    }

    // Get the PDF URL
    const pdfFile = files[0]; // Assuming one PDF per project for now
    const { data: pdfUrlData } = supabase.storage
      .from('plan-pdfs')
      .getPublicUrl(`${projectId}/${pdfFile.name}`);

    if (!pdfUrlData?.publicUrl) {
      return { success: false, error: 'Could not get PDF public URL' };
    }

    console.log('PDF URL:', pdfUrlData.publicUrl);

    // Test PDF accessibility
    try {
      const pdfResponse = await fetch(pdfUrlData.publicUrl, { method: 'HEAD' });
      console.log('PDF accessibility check:', {
        status: pdfResponse.status,
        ok: pdfResponse.ok,
        contentType: pdfResponse.headers.get('content-type'),
        contentLength: pdfResponse.headers.get('content-length')
      });
    } catch (fetchError) {
      console.error('PDF fetch test failed:', fetchError);
      return { success: false, error: 'PDF file is not accessible' };
    }

    return {
      success: true,
      projectId,
      pagesCount: pages.length,
      pdfUrl: pdfUrlData.publicUrl,
      pages: pages.map(p => ({
        id: p.id,
        pageNo: p.page_no,
        hasUrls: {
          thumbnail: !!p.thumbnail_url,
          preview: !!p.preview_url,
          full: !!p.full_url,
          img: !!p.img_url
        }
      }))
    };

  } catch (error) {
    console.error('Debug process failed:', error);
    return { success: false, error: error.message };
  }
};

export const regenerateThumbnails = async (projectId: string) => {
  console.log('=== REGENERATING THUMBNAILS ===');
  
  try {
    // First debug to get the PDF URL
    const debugResult = await debugThumbnailGeneration(projectId);
    
    if (!debugResult.success) {
      return debugResult;
    }

    console.log('Starting thumbnail regeneration...');
    
    // Call the generate-thumbnails edge function
    const result = await generateThumbnails(projectId, debugResult.pdfUrl);
    
    console.log('Thumbnail regeneration result:', result);
    
    return {
      success: true,
      message: `Regenerated thumbnails for project ${projectId}`,
      result
    };

  } catch (error) {
    console.error('Thumbnail regeneration failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Helper function to check individual image URLs
export const checkImageUrl = async (url: string): Promise<{ accessible: boolean, dimensions?: string, error?: string }> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return { accessible: false, error: `HTTP ${response.status}` };
    }

    // Try to load the image to get dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ 
          accessible: true, 
          dimensions: `${img.naturalWidth}x${img.naturalHeight}` 
        });
      };
      img.onerror = () => {
        resolve({ accessible: false, error: 'Image load failed' });
      };
      img.src = url;
    });

  } catch (error) {
    return { accessible: false, error: error.message };
  }
};
