import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './config.ts';
import { validateEnvironment, validatePdfData } from './validation.ts';
import { generateActualThumbnails } from './thumbnailGenerator.ts';
import { uploadMultiResolutionImages } from './storage.ts';
import { generatePdfHash, checkThumbnailCache } from './cache.ts';
import { ProcessingResult } from './types.ts';

// Validate environment variables on startup
validateEnvironment();

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

    // Generate PDF hash for caching
    const pdfHash = await generatePdfHash(pdfArrayBuffer);

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
    const results: ProcessingResult[] = [];
    
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
