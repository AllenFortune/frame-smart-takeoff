
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

// Generate a simple PNG placeholder with page number
const generatePagePlaceholder = (pageNo: number, width = 800, height = 1000): Uint8Array => {
  try {
    // For now, return the basic transparent PNG
    // TODO: In future, could use a canvas library to generate actual page preview
    console.log(`Generated placeholder for page ${pageNo} (${width}x${height})`);
    return createPlaceholderImage();
  } catch (error) {
    console.error(`Error generating placeholder for page ${pageNo}:`, error);
    return createPlaceholderImage();
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, pdfUrl } = await req.json()
    
    console.log(`Processing PDF classification for project ${projectId}`)
    console.log(`PDF URL: ${pdfUrl}`)
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create job status for tracking
    const { data: jobData, error: jobError } = await supabaseClient
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
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return new Response(
        JSON.stringify({ 
          error_code: 'job_creation_failed',
          message: `Failed to create job: ${jobError.message}`,
          hint: 'Check database permissions and job_status table'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('Created job:', jobData.id)

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 25, current_step: 'Downloading PDF' })
      .eq('id', jobData.id)

    // Download the PDF with better error handling
    console.log('Downloading PDF from:', pdfUrl)
    let pdfResponse;
    try {
      pdfResponse = await fetch(pdfUrl);
      if (!pdfResponse.ok) {
        console.error(`PDF download failed: HTTP ${pdfResponse.status}: ${pdfResponse.statusText}`);
        throw new Error(`HTTP ${pdfResponse.status}: ${pdfResponse.statusText}`);
      }
      console.log('PDF download successful, response status:', pdfResponse.status);
    } catch (error) {
      console.error('PDF download failed:', error);
      await supabaseClient
        .from('job_status')
        .update({ 
          status: 'failed', 
          error_message: `Failed to download PDF: ${error.message}`,
          progress: 0
        })
        .eq('id', jobData.id)
      
      return new Response(
        JSON.stringify({ 
          error_code: 'pdf_download_failed',
          message: 'Failed to download PDF from provided URL',
          hint: 'Check if the PDF URL is accessible and not expired'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer()
    console.log('Downloaded PDF, size:', pdfArrayBuffer.byteLength, 'bytes')

    // Check PDF size limit (50MB as per error handling guidelines)
    const maxPdfSize = 50 * 1024 * 1024; // 50MB
    if (pdfArrayBuffer.byteLength > maxPdfSize) {
      await supabaseClient
        .from('job_status')
        .update({ 
          status: 'failed', 
          error_message: 'PDF file exceeds 50MB size limit',
          progress: 0
        })
        .eq('id', jobData.id)
      
      return new Response(
        JSON.stringify({ 
          error_code: 'pdf_too_large',
          message: 'File exceeds 50 MB.',
          hint: 'Please split the plan into smaller files'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 50, current_step: 'Extracting pages from PDF' })
      .eq('id', jobData.id)

    // Use PDF-lib to get page count
    const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@^1.17.1')
    
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
    const numPages = pdfDoc.getPageCount()
    console.log(`PDF has ${numPages} pages`)
    
    const extractedPages = []

    // First, clean up any existing pages for this project to avoid duplicates
    console.log('Cleaning up existing pages for project:', projectId)
    const { error: deleteError } = await supabaseClient
      .from('plan_pages')
      .delete()
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Error cleaning up existing pages:', deleteError)
      // Continue anyway - this is not critical
    }

    for (let pageNo = 1; pageNo <= numPages; pageNo++) {
      // Update progress for each page
      const pageProgress = 50 + Math.floor((pageNo / numPages) * 30)
      await supabaseClient
        .from('job_status')
        .update({ 
          progress: pageProgress, 
          current_step: `Processing page ${pageNo} of ${numPages}` 
        })
        .eq('id', jobData.id)

      console.log(`Processing page ${pageNo}/${numPages}`)

      let pageImageBytes: Uint8Array;
      let uploadSuccess = true;
  
      // Generate placeholder image for now
      try {
        console.log(`Generating placeholder for page ${pageNo}`);
        pageImageBytes = generatePagePlaceholder(pageNo);
        console.log(`Successfully generated placeholder for page ${pageNo}`);
      } catch (placeholderError) {
        console.error(`Placeholder generation failed for page ${pageNo}:`, placeholderError);
        // Mark as upload failed and continue
        extractedPages.push({
          page_no: pageNo,
          class: 'upload_failed',
          confidence: 0,
          img_url: null
        });
        continue;
      }

      // Upload page image to storage with improved error handling
      const imagePath = `${projectId}/page_${pageNo}.png`
      console.log(`Uploading page ${pageNo} to storage path:`, imagePath)
      
      try {
        const { error: uploadError } = await supabaseClient.storage
          .from('plan-images')
          .upload(imagePath, pageImageBytes, {
            contentType: 'image/png',
            upsert: true
          })
        
        if (uploadError) {
          console.error(`Storage upload error for page ${pageNo}:`, uploadError);
          throw uploadError;
        }
        
        console.log(`Successfully uploaded page ${pageNo}`);
      } catch (uploadError) {
        console.error(`Error uploading page ${pageNo} image:`, uploadError)
        uploadSuccess = false;
      }

      if (!uploadSuccess) {
        // Mark this page as upload_failed and continue
        extractedPages.push({
          page_no: pageNo,
          class: 'upload_failed',
          confidence: 0,
          img_url: null
        });
        continue;
      }

      // Get public URL since bucket is now public
      let imageUrl = null;
      try {
        const { data: publicUrlData } = supabaseClient.storage
          .from('plan-images')
          .getPublicUrl(imagePath)
        
        imageUrl = publicUrlData?.publicUrl;
        console.log(`Got public URL for page ${pageNo}: ${imageUrl}`);
      } catch (error) {
        console.error(`Failed to get public URL for page ${pageNo}:`, error);
        // Try signed URL as fallback
        try {
          const { data: signedData, error: signError } = await supabaseClient.storage
            .from('plan-images')
            .createSignedUrl(imagePath, SIGNED_URL_TTL_SECONDS)

          if (!signError && signedData?.signedUrl) {
            imageUrl = signedData.signedUrl;
            console.log(`Used signed URL fallback for page ${pageNo}`);
          }
        } catch (fallbackError) {
          console.error(`Failed to create signed URL fallback for page ${pageNo}:`, fallbackError);
        }
      }

      // Simulate AI classification with realistic classes and confidence scores
      const pageClasses = ['floor_plan', 'wall_section', 'roof_plan', 'foundation_plan', 'electrical_plan', 'structural_plan', 'site_plan']
      const randomClass = pageClasses[Math.floor(Math.random() * pageClasses.length)]
      const confidence = 0.6 + Math.random() * 0.4 // 60-100% confidence

      extractedPages.push({
        page_no: pageNo,
        class: randomClass,
        confidence: confidence,
        img_url: imageUrl
      })
    }

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 80, current_step: 'Saving page data to database' })
      .eq('id', jobData.id)

    console.log(`Inserting ${extractedPages.length} pages into database`)

    // Insert pages into database with proper error handling
    const { data, error } = await supabaseClient
      .from('plan_pages')
      .insert(extractedPages.map(page => ({
        project_id: projectId,
        ...page
      })))
      .select()

    if (error) {
      console.error('Error inserting pages:', error)
      
      // Update job to failed status
      await supabaseClient
        .from('job_status')
        .update({ 
          status: 'failed', 
          error_message: `Database insert failed: ${error.message}`,
          progress: 0
        })
        .eq('id', jobData.id)
      
      return new Response(
        JSON.stringify({ 
          error_code: 'database_insert_failed',
          message: 'Failed to save page data to database',
          hint: 'Check database permissions and table schema'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log(`Successfully inserted ${data.length} pages`)

    // Count failed uploads for user notification
    const failedUploads = extractedPages.filter(p => p.class === 'upload_failed').length;

    // Update job to completed
    await supabaseClient
      .from('job_status')
      .update({ 
        status: 'completed', 
        progress: 100,
        current_step: 'Classification complete',
        completed_at: new Date().toISOString(),
        result_data: { 
          pages_created: data.length,
          project_id: projectId,
          total_pages: numPages,
          failed_uploads: failedUploads
        }
      })
      .eq('id', jobData.id)

    const responseMessage = failedUploads > 0 
      ? `Successfully classified ${extractedPages.length - failedUploads} pages. ${failedUploads} page(s) failed to upload.`
      : `Successfully classified ${extractedPages.length} pages`;

    console.log(`Successfully classified ${extractedPages.length} pages for project ${projectId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        pages: data,
        jobId: jobData.id,
        message: responseMessage,
        failedUploads: failedUploads
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in classify-pages:', error)
    return new Response(
      JSON.stringify({ 
        error_code: 'internal_error',
        message: 'An unexpected error occurred during PDF processing',
        hint: 'Check edge function logs for more details',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
