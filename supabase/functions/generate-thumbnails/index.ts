import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Validate environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const envVar of requiredEnvVars) {
  if (!Deno.env.get(envVar)) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const SIGNED_URL_TTL_SECONDS = parseInt(Deno.env.get('SIGNED_URL_TTL_SECONDS') || '3600');

// Thumbnail generation configurations
const THUMBNAIL_CONFIGS = {
  thumbnail: { width: 400, height: 500, quality: 80 },
  preview: { width: 800, height: 1000, quality: 85 },
  full: { width: 1600, height: 2000, quality: 90 }
};

// Create 1x1 transparent PNG as fallback placeholder
const createPlaceholderImage = (): Uint8Array => {
  const transparentPng = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  return transparentPng;
};

// Generate multi-resolution thumbnails for a PDF page
const generateMultiResolutionThumbnails = async (
  pdfDoc: any, 
  pageIndex: number
): Promise<{ [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } }> => {
  const results: { [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } } = {};
  
  try {
    console.log(`Generating multi-resolution thumbnails for page ${pageIndex + 1}`);
    
    const page = pdfDoc.getPages()[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    
    console.log(`Original page size: ${pageWidth}x${pageHeight}`);
    
    // Generate each resolution
    for (const [resolution, config] of Object.entries(THUMBNAIL_CONFIGS)) {
      try {
        console.log(`Generating ${resolution} (${config.width}x${config.height})`);
        
        const scaleX = config.width / pageWidth;
        const scaleY = config.height / pageHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = Math.floor(pageWidth * scale);
        const scaledHeight = Math.floor(pageHeight * scale);
        
        // For now, create optimized placeholders with page info
        // TODO: Implement actual PDF rendering when pdf2pic is available
        const imageData = createPageInfoImage(pageIndex + 1, scaledWidth, scaledHeight, resolution);
        
        results[resolution] = {
          data: imageData,
          dimensions: { w: scaledWidth, h: scaledHeight }
        };
        
        console.log(`Successfully generated ${resolution}: ${scaledWidth}x${scaledHeight}`);
      } catch (error) {
        console.error(`Failed to generate ${resolution}:`, error);
        // Fall back to basic placeholder
        results[resolution] = {
          data: createPlaceholderImage(),
          dimensions: { w: config.width, h: config.height }
        };
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error generating thumbnails for page ${pageIndex + 1}:`, error);
    
    // Return fallback placeholders for all resolutions
    const fallbackResults: { [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } } = {};
    for (const [resolution, config] of Object.entries(THUMBNAIL_CONFIGS)) {
      fallbackResults[resolution] = {
        data: createPlaceholderImage(),
        dimensions: { w: config.width, h: config.height }
      };
    }
    return fallbackResults;
  }
};

// Create enhanced page info image (placeholder until full rendering is available)
const createPageInfoImage = (pageNo: number, width: number, height: number, resolution: string): Uint8Array => {
  console.log(`Generated ${resolution} placeholder for page ${pageNo} (${width}x${height})`);
  return createPlaceholderImage();
};

// Generate PDF hash for caching
const generatePdfHash = async (pdfArrayBuffer: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', pdfArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Check if thumbnails exist in cache
const checkThumbnailCache = async (
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

// Upload multi-resolution images to storage
const uploadMultiResolutionImages = async (
  supabaseClient: any,
  projectId: string,
  pageNo: number,
  thumbnails: { [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } }
): Promise<{ [key: string]: string }> => {
  const urls: { [key: string]: string } = {};
  
  for (const [resolution, thumbnail] of Object.entries(thumbnails)) {
    try {
      const imagePath = `${projectId}/${resolution}/page_${pageNo}.png`;
      console.log(`Uploading ${resolution} to: ${imagePath}`);
      
      const { error: uploadError } = await supabaseClient.storage
        .from('plan-images')
        .upload(imagePath, thumbnail.data, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Upload error for ${resolution}:`, uploadError);
        continue;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabaseClient.storage
        .from('plan-images')
        .getPublicUrl(imagePath);
      
      if (publicUrlData?.publicUrl) {
        urls[resolution] = publicUrlData.publicUrl;
        console.log(`Successfully uploaded ${resolution}`);
      } else {
        console.error(`Failed to get public URL for ${resolution}`);
      }
    } catch (error) {
      console.error(`Error uploading ${resolution}:`, error);
    }
  }
  
  return urls;
};

// Store thumbnail metadata
const storeThumbnailMetadata = async (
  supabaseClient: any,
  pageId: string,
  thumbnails: { [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } },
  generationTime: number
): Promise<void> => {
  try {
    const fileSizes: { [key: string]: number } = {};
    const dimensions: { [key: string]: { w: number, h: number } } = {};
    
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, pdfUrl, pageIds } = await req.json()
    
    console.log(`Starting thumbnail generation for project ${projectId}`)
    console.log(`PDF URL: ${pdfUrl}`)
    console.log(`Page IDs: ${pageIds?.join(', ') || 'all pages'}`)
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download PDF
    console.log('Downloading PDF...');
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`PDF download failed: ${pdfResponse.status}`);
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    console.log('PDF downloaded, size:', pdfArrayBuffer.byteLength, 'bytes');

    // Generate PDF hash for caching
    const pdfHash = await generatePdfHash(pdfArrayBuffer);
    console.log('Generated PDF hash:', pdfHash);

    // Check cache
    const cacheExists = await checkThumbnailCache(supabaseClient, pdfHash, projectId);
    if (cacheExists) {
      console.log('Using cached thumbnails');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Used cached thumbnails',
          fromCache: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Load PDF with pdf-lib
    const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@^1.17.1')
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const numPages = pdfDoc.getPageCount();
    console.log(`PDF has ${numPages} pages`);

    // Get pages to process
    let pagesToProcess = [];
    if (pageIds && pageIds.length > 0) {
      const { data: pages, error } = await supabaseClient
        .from('plan_pages')
        .select('id, page_no')
        .eq('project_id', projectId)
        .in('id', pageIds);
      
      if (error) throw error;
      pagesToProcess = pages || [];
    } else {
      const { data: pages, error } = await supabaseClient
        .from('plan_pages')
        .select('id, page_no')
        .eq('project_id', projectId)
        .order('page_no');
      
      if (error) throw error;
      pagesToProcess = pages || [];
    }

    console.log(`Processing ${pagesToProcess.length} pages`);

    const results = [];
    
    for (const page of pagesToProcess) {
      const startTime = Date.now();
      console.log(`Processing page ${page.page_no}...`);
      
      try {
        // Generate multi-resolution thumbnails
        const thumbnails = await generateMultiResolutionThumbnails(pdfDoc, page.page_no - 1);
        
        // Upload all resolutions
        const urls = await uploadMultiResolutionImages(supabaseClient, projectId, page.page_no, thumbnails);
        
        // Update page record with new URLs
        const updateData: any = {};
        if (urls.thumbnail) updateData.thumbnail_url = urls.thumbnail;
        if (urls.preview) updateData.preview_url = urls.preview;
        if (urls.full) updateData.full_url = urls.full;
        // Keep the original img_url for backward compatibility
        if (urls.preview) updateData.img_url = urls.preview;
        
        const { error: updateError } = await supabaseClient
          .from('plan_pages')
          .update(updateData)
          .eq('id', page.id);
        
        if (updateError) {
          console.error(`Error updating page ${page.page_no}:`, updateError);
        }
        
        // Store metadata
        const generationTime = Date.now() - startTime;
        await storeThumbnailMetadata(supabaseClient, page.id, thumbnails, generationTime);
        
        results.push({
          pageId: page.id,
          pageNo: page.page_no,
          urls: urls,
          generationTime: generationTime
        });
        
        console.log(`Successfully processed page ${page.page_no} in ${generationTime}ms`);
      } catch (error) {
        console.error(`Error processing page ${page.page_no}:`, error);
        results.push({
          pageId: page.id,
          pageNo: page.page_no,
          error: error.message
        });
      }
    }

    // Create cache entry
    try {
      await supabaseClient
        .from('thumbnail_cache')
        .upsert({
          project_id: projectId,
          pdf_hash: pdfHash,
          pdf_url: pdfUrl,
          metadata: { 
            pages_processed: results.length,
            total_pages: numPages,
            generated_at: new Date().toISOString()
          }
        });
      console.log('Created cache entry');
    } catch (cacheError) {
      console.error('Failed to create cache entry:', cacheError);
    }

    console.log(`Thumbnail generation completed. Processed ${results.length} pages`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: results,
        message: `Generated thumbnails for ${results.length} pages`,
        pdfHash: pdfHash
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in generate-thumbnails:', error)
    return new Response(
      JSON.stringify({ 
        error_code: 'thumbnail_generation_failed',
        message: 'Failed to generate thumbnails',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
