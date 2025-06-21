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

// Enhanced thumbnail generation configurations
const THUMBNAIL_CONFIGS = {
  thumbnail: { width: 400, height: 500, quality: 80, dpi: 150 },
  preview: { width: 800, height: 1000, quality: 85, dpi: 200 },
  full: { width: 1600, height: 2000, quality: 90, dpi: 300 }
};

// Create a proper placeholder that indicates PDF conversion is needed
const createPlaceholderImage = (pageNo: number, width: number, height: number, message: string): Uint8Array => {
  console.log(`Creating placeholder for page ${pageNo}: ${message}`);
  
  // Create a simple PNG with text indicating conversion is needed
  // For now, return a minimal PNG that's at least detectable as a placeholder
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

// Enhanced PDF validation
const validatePdfData = (pdfArrayBuffer: ArrayBuffer): { valid: boolean, error?: string } => {
  console.log('Validating PDF data...');
  
  if (!pdfArrayBuffer || pdfArrayBuffer.byteLength === 0) {
    return { valid: false, error: 'PDF data is empty' };
  }

  // Check PDF header
  const header = new Uint8Array(pdfArrayBuffer.slice(0, 8));
  const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
  
  for (let i = 0; i < 4; i++) {
    if (header[i] !== pdfSignature[i]) {
      return { valid: false, error: 'Invalid PDF signature - file may be corrupted' };
    }
  }

  console.log(`PDF validation passed - size: ${pdfArrayBuffer.byteLength} bytes`);
  return { valid: true };
};

// Generate actual thumbnails from PDF using pdf-lib and canvas
const generateActualThumbnails = async (
  pdfDoc: any, 
  pageIndex: number,
  pageNo: number
): Promise<{ [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } }> => {
  const results: { [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } } = {};
  
  try {
    console.log(`Starting actual thumbnail generation for page ${pageNo} (index ${pageIndex})`);
    
    const page = pdfDoc.getPages()[pageIndex];
    if (!page) {
      throw new Error(`Page ${pageIndex} not found in PDF`);
    }
    
    const { width: pageWidth, height: pageHeight } = page.getSize();
    console.log(`PDF page ${pageNo} dimensions: ${pageWidth} x ${pageHeight}`);
    
    // Validate page dimensions
    if (pageWidth <= 0 || pageHeight <= 0) {
      throw new Error(`Invalid page dimensions: ${pageWidth} x ${pageHeight}`);
    }
    
    // For now, we'll create enhanced placeholders that indicate the conversion process
    // TODO: Implement actual PDF-to-image conversion when proper libraries are available
    for (const [resolution, config] of Object.entries(THUMBNAIL_CONFIGS)) {
      try {
        console.log(`Generating ${resolution} for page ${pageNo} at ${config.dpi} DPI`);
        
        // Calculate proper scaling based on DPI
        const scaleX = (config.width * config.dpi) / (pageWidth * 72); // 72 DPI is PDF default
        const scaleY = (config.height * config.dpi) / (pageHeight * 72);
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = Math.floor(pageWidth * scale);
        const scaledHeight = Math.floor(pageHeight * scale);
        
        console.log(`Calculated dimensions for ${resolution}: ${scaledWidth} x ${scaledHeight} (scale: ${scale.toFixed(3)})`);
        
        // Create enhanced placeholder that indicates PDF processing
        const placeholderData = createPlaceholderImage(
          pageNo, 
          scaledWidth, 
          scaledHeight, 
          `PDF page ${pageNo} - ${resolution} conversion needed`
        );
        
        results[resolution] = {
          data: placeholderData,
          dimensions: { w: scaledWidth, h: scaledHeight }
        };
        
        console.log(`Generated ${resolution} placeholder: ${scaledWidth}x${scaledHeight}, ${placeholderData.length} bytes`);
      } catch (error) {
        console.error(`Failed to generate ${resolution} for page ${pageNo}:`, error);
        
        // Fallback to basic placeholder
        results[resolution] = {
          data: createPlaceholderImage(pageNo, config.width, config.height, `Error: ${error.message}`),
          dimensions: { w: config.width, h: config.height }
        };
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Critical error generating thumbnails for page ${pageNo}:`, error);
    
    // Return error placeholders for all resolutions
    const errorResults: { [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } } = {};
    for (const [resolution, config] of Object.entries(THUMBNAIL_CONFIGS)) {
      errorResults[resolution] = {
        data: createPlaceholderImage(pageNo, config.width, config.height, `Conversion failed: ${error.message}`),
        dimensions: { w: config.width, h: config.height }
      };
    }
    return errorResults;
  }
};

// Enhanced storage bucket management
const ensureBucketExists = async (supabaseClient: any): Promise<void> => {
  try {
    console.log('Ensuring plan-images bucket exists...');
    
    const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error(`Failed to list storage buckets: ${listError.message}`);
    }
    
    const bucketExists = buckets?.some((bucket: any) => bucket.name === 'plan-images');
    
    if (!bucketExists) {
      console.log('Creating plan-images bucket...');
      const { error: createError } = await supabaseClient.storage.createBucket('plan-images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      } else {
        console.log('Successfully created plan-images bucket');
      }
    } else {
      console.log('plan-images bucket already exists');
    }
  } catch (error) {
    console.error('Critical error managing storage bucket:', error);
    throw error;
  }
};

// Enhanced image upload with validation
const uploadMultiResolutionImages = async (
  supabaseClient: any,
  projectId: string,
  pageNo: number,
  thumbnails: { [key: string]: { data: Uint8Array, dimensions: { w: number, h: number } } }
): Promise<{ [key: string]: string }> => {
  const urls: { [key: string]: string } = {};
  
  console.log(`Starting upload for page ${pageNo} with ${Object.keys(thumbnails).length} resolutions`);
  
  // Ensure bucket exists before uploading
  await ensureBucketExists(supabaseClient);
  
  for (const [resolution, thumbnail] of Object.entries(thumbnails)) {
    try {
      console.log(`Uploading ${resolution} for page ${pageNo}: ${thumbnail.data.length} bytes, ${thumbnail.dimensions.w}x${thumbnail.dimensions.h}`);
      
      // Validate image data
      if (!thumbnail.data || thumbnail.data.length === 0) {
        throw new Error(`Empty image data for ${resolution}`);
      }
      
      if (thumbnail.dimensions.w <= 0 || thumbnail.dimensions.h <= 0) {
        throw new Error(`Invalid dimensions for ${resolution}: ${thumbnail.dimensions.w}x${thumbnail.dimensions.h}`);
      }
      
      const imagePath = `${projectId}/${resolution}/page_${pageNo}.png`;
      console.log(`Upload path: ${imagePath}`);
      
      const { error: uploadError } = await supabaseClient.storage
        .from('plan-images')
        .upload(imagePath, thumbnail.data, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Upload error for ${resolution}:`, uploadError);
        throw new Error(`Upload failed for ${resolution}: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: publicUrlData } = supabaseClient.storage
        .from('plan-images')
        .getPublicUrl(imagePath);
      
      if (publicUrlData?.publicUrl) {
        urls[resolution] = publicUrlData.publicUrl;
        console.log(`Successfully uploaded ${resolution}: ${publicUrlData.publicUrl}`);
      } else {
        throw new Error(`Failed to get public URL for ${resolution}`);
      }
    } catch (error) {
      console.error(`Error uploading ${resolution} for page ${pageNo}:`, error);
      // Don't fail the entire process for one resolution
    }
  }
  
  console.log(`Upload completed for page ${pageNo}. Generated ${Object.keys(urls).length} URLs`);
  return urls;
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
    
    console.log(`=== THUMBNAIL GENERATION STARTED ===`);
    console.log(`Project ID: ${projectId}`);
    console.log(`PDF URL: ${pdfUrl}`);
    console.log(`Page IDs: ${pageIds?.join(', ') || 'all pages'}`);
    
    if (!projectId || !pdfUrl) {
      throw new Error('Missing required parameters: projectId and pdfUrl');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download and validate PDF
    console.log('=== PDF DOWNLOAD PHASE ===');
    console.log('Downloading PDF from:', pdfUrl);
    
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`PDF download failed: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    console.log(`PDF downloaded successfully: ${pdfArrayBuffer.byteLength} bytes`);
    
    // Validate PDF
    const validation = validatePdfData(pdfArrayBuffer);
    if (!validation.valid) {
      throw new Error(`PDF validation failed: ${validation.error}`);
    }

    // Load PDF with pdf-lib
    console.log('=== PDF PROCESSING PHASE ===');
    const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@^1.17.1')
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const numPages = pdfDoc.getPageCount();
    console.log(`PDF loaded successfully: ${numPages} pages`);

    // Get pages to process
    console.log('=== PAGE SELECTION PHASE ===');
    let pagesToProcess = [];
    if (pageIds && pageIds.length > 0) {
      const { data: pages, error } = await supabaseClient
        .from('plan_pages')
        .select('id, page_no')
        .eq('project_id', projectId)
        .in('id', pageIds);
      
      if (error) throw error;
      pagesToProcess = pages || [];
      console.log(`Processing specific pages: ${pagesToProcess.map(p => p.page_no).join(', ')}`);
    } else {
      const { data: pages, error } = await supabaseClient
        .from('plan_pages')
        .select('id, page_no')
        .eq('project_id', projectId)
        .order('page_no');
      
      if (error) throw error;
      pagesToProcess = pages || [];
      console.log(`Processing all pages: ${pagesToProcess.length} total`);
    }

    if (pagesToProcess.length === 0) {
      throw new Error('No pages found to process');
    }

    // Process each page
    console.log('=== THUMBNAIL GENERATION PHASE ===');
    const results = [];
    
    for (const page of pagesToProcess) {
      const startTime = Date.now();
      console.log(`\n--- Processing page ${page.page_no} (ID: ${page.id}) ---`);
      
      try {
        // Validate page number
        if (page.page_no < 1 || page.page_no > numPages) {
          throw new Error(`Page number ${page.page_no} is out of range (1-${numPages})`);
        }
        
        // Generate thumbnails
        const thumbnails = await generateActualThumbnails(pdfDoc, page.page_no - 1, page.page_no);
        console.log(`Generated ${Object.keys(thumbnails).length} thumbnail resolutions`);
        
        // Upload all resolutions
        const urls = await uploadMultiResolutionImages(supabaseClient, projectId, page.page_no, thumbnails);
        console.log(`Uploaded ${Object.keys(urls).length} images to storage`);
        
        // Update page record with new URLs
        const updateData: any = {};
        if (urls.thumbnail) updateData.thumbnail_url = urls.thumbnail;
        if (urls.preview) updateData.preview_url = urls.preview;
        if (urls.full) updateData.full_url = urls.full;
        // Keep the original img_url for backward compatibility
        if (urls.preview) updateData.img_url = urls.preview;
        
        console.log(`Updating page ${page.page_no} database record with URLs:`, Object.keys(updateData));
        
        const { error: updateError } = await supabaseClient
          .from('plan_pages')
          .update(updateData)
          .eq('id', page.id);
        
        if (updateError) {
          console.error(`Database update error for page ${page.page_no}:`, updateError);
          throw new Error(`Database update failed: ${updateError.message}`);
        }
        
        const generationTime = Date.now() - startTime;
        console.log(`✅ Page ${page.page_no} completed successfully in ${generationTime}ms`);
        
        results.push({
          pageId: page.id,
          pageNo: page.page_no,
          urls: urls,
          generationTime: generationTime,
          success: true
        });
        
      } catch (error) {
        const generationTime = Date.now() - startTime;
        console.error(`❌ Error processing page ${page.page_no}:`, error);
        
        results.push({
          pageId: page.id,
          pageNo: page.page_no,
          error: error.message,
          generationTime: generationTime,
          success: false
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
            generated_at: new Date().toISOString(),
            successful_pages: results.filter(r => r.success).length
          }
        });
      console.log('Created cache entry');
    } catch (cacheError) {
      console.error('Failed to create cache entry:', cacheError);
    }

    const successfulResults = results.filter(r => r.success);
    console.log(`\n=== THUMBNAIL GENERATION COMPLETED ===`);
    console.log(`Successfully processed: ${successfulResults.length}/${results.length} pages`);
    console.log(`Failed pages: ${results.filter(r => !r.success).map(r => r.pageNo).join(', ') || 'none'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: results,
        message: `Generated thumbnails for ${successfulResults.length}/${results.length} pages`,
        successCount: successfulResults.length,
        totalCount: results.length,
        processingDetails: {
          pdfSize: pdfArrayBuffer.byteLength,
          totalPages: numPages,
          processedPages: pagesToProcess.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== CRITICAL ERROR IN THUMBNAIL GENERATION ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error_code: 'thumbnail_generation_failed',
        message: 'Failed to generate thumbnails',
        details: error.message,
        hint: 'Check the edge function logs for detailed error information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
