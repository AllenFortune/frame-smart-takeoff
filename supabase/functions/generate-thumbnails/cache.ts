
export const generatePdfHash = async (pdfArrayBuffer: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', pdfArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const checkThumbnailCache = async (
  supabaseClient: any, 
  pdfHash: string, 
  projectId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabaseClient
      .from('thumbnail_cache')
      .select('id, expires_at')
      .eq('pdf_hash', pdfHash)
      .eq('project_id', projectId)
      .maybeSingle();

    if (error) {
      console.error('Cache check error:', error);
      return false;
    }

    if (!data) {
      console.log('No cache entry found');
      return false;
    }

    const isExpired = new Date(data.expires_at) < new Date();
    if (isExpired) {
      console.log('Cache entry expired');
      // Clean up expired entry
      await supabaseClient
        .from('thumbnail_cache')
        .delete()
        .eq('id', data.id);
      return false;
    }

    console.log('Valid cache entry found');
    // Update hit count and last accessed
    await supabaseClient
      .from('thumbnail_cache')
      .update({ 
        cache_hit_count: supabaseClient.rpc('increment', { x: 1 }),
        last_accessed: new Date().toISOString()
      })
      .eq('id', data.id);

    return true;
  } catch (error) {
    console.error('Cache check failed:', error);
    return false;
  }
};

export const storeThumbnailMetadata = async (
  supabaseClient: any,
  pageId: string,
  thumbnails: { [key: string]: { data: Uint8Array; dimensions: { w: number; h: number } } },
  generationTime: number
): Promise<void> => {
  try {
    const fileSizes: { [key: string]: number } = {};
    const dimensions: { [key: string]: { w: number; h: number } } = {};
    
    for (const [resolution, thumbnail] of Object.entries(thumbnails)) {
      fileSizes[resolution] = thumbnail.data.length;
      dimensions[resolution] = thumbnail.dimensions;
    }
    
    const { error } = await supabaseClient
      .from('thumbnail_metadata')
      .upsert({
        page_id: pageId,
        generation_time_ms: generationTime,
        file_sizes: fileSizes,
        dimensions: dimensions,
        format: 'png',
        compression_level: 80
      });
    
    if (error) {
      console.error('Error storing thumbnail metadata:', error);
    } else {
      console.log('Successfully stored thumbnail metadata');
    }
  } catch (error) {
    console.error('Failed to store thumbnail metadata:', error);
  }
};
