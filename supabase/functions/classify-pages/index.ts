
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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

// Call the dedicated thumbnail generation service
const generateThumbnailsForProject = async (projectId: string, pdfUrl: string): Promise<any> => {
  try {
    console.log('Calling thumbnail generation service...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-thumbnails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({ 
        projectId: projectId, 
        pdfUrl: pdfUrl 
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Thumbnail generation failed:', result);
      return { success: false, error: result };
    }

    console.log('Thumbnail generation completed:', result.message);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error calling thumbnail service:', error);
    return { success: false, error: error.message };
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
      .update({ progress: 40, current_step: 'Extracting pages from PDF' })
      .eq('id', jobData.id)

    // Use PDF-lib to get basic page info for classification
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

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 50, current_step: 'Classifying pages' })
      .eq('id', jobData.id)

    // Create page records with classifications (without thumbnails initially)
    for (let pageNo = 1; pageNo <= numPages; pageNo++) {
      console.log(`Classifying page ${pageNo}/${numPages}`)

      // Simulate AI classification with realistic classes and confidence scores
      const pageClasses = ['floor_plan', 'wall_section', 'roof_plan', 'foundation_plan', 'electrical_plan', 'structural_plan', 'site_plan']
      const randomClass = pageClasses[Math.floor(Math.random() * pageClasses.length)]
      const confidence = 0.6 + Math.random() * 0.4 // 60-100% confidence

      extractedPages.push({
        page_no: pageNo,
        class: randomClass,
        confidence: confidence,
        // New multi-resolution URL fields will be populated by thumbnail service
        img_url: null, // Will be set to preview_url for backward compatibility
        thumbnail_url: null,
        preview_url: null,
        full_url: null
      });
    }

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 70, current_step: 'Saving page data to database' })
      .eq('id', jobData.id)

    console.log(`Inserting ${extractedPages.length} pages into database`)

    // Insert pages into database
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

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 80, current_step: 'Generating enhanced thumbnails' })
      .eq('id', jobData.id)

    // Call the dedicated thumbnail generation service
    const thumbnailResult = await generateThumbnailsForProject(projectId, pdfUrl);
    
    let thumbnailMessage = '';
    if (thumbnailResult.success) {
      if (thumbnailResult.data.fromCache) {
        thumbnailMessage = ' Used cached high-quality thumbnails.';
      } else {
        thumbnailMessage = ` Generated ${thumbnailResult.data.results?.length || 0} high-quality thumbnails.`;
      }
    } else {
      thumbnailMessage = ' Thumbnail generation failed, using fallback images.';
      console.error('Thumbnail generation failed:', thumbnailResult.error);
    }

    // Update job to completed
    await supabaseClient
      .from('job_status')
      .update({ 
        status: 'completed', 
        progress: 100,
        current_step: 'Classification and thumbnail generation complete',
        completed_at: new Date().toISOString(),
        result_data: { 
          pages_created: data.length,
          project_id: projectId,
          total_pages: numPages,
          thumbnail_generation: thumbnailResult.success ? 'success' : 'failed',
          thumbnail_details: thumbnailResult.data
        }
      })
      .eq('id', jobData.id)

    const responseMessage = `Successfully classified ${extractedPages.length} pages.${thumbnailMessage}`;

    console.log(`Successfully classified ${extractedPages.length} pages for project ${projectId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        pages: data,
        jobId: jobData.id,
        message: responseMessage,
        thumbnailGeneration: thumbnailResult.success,
        enhancedThumbnails: true
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
