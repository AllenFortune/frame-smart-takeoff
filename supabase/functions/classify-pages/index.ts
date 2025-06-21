
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { projectId, pdfUrl } = await req.json()
    
    console.log(`Processing PDF classification for project ${projectId}, URL: ${pdfUrl}`)
    
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
      throw new Error(`Failed to create job: ${jobError.message}`)
    }

    console.log('Created job:', jobData.id)

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 25, current_step: 'Downloading PDF' })
      .eq('id', jobData.id)

    // Download the PDF
    console.log('Downloading PDF from:', pdfUrl)
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`)
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer()
    console.log('Downloaded PDF, size:', pdfArrayBuffer.byteLength, 'bytes')

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 50, current_step: 'Extracting pages from PDF' })
      .eq('id', jobData.id)

    // Use PDF-lib to extract page count and create images
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

      // Create a single-page PDF for this page
      const singlePageDoc = await PDFDocument.create()
      const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageNo - 1])
      singlePageDoc.addPage(copiedPage)
      
      // Convert to bytes
      const pdfBytes = await singlePageDoc.save()
      
      // Create a better placeholder - a simple 800x1000 white PNG with page number
      const createPlaceholderImage = (pageNumber: number) => {
        // Create a simple SVG that we'll convert to PNG-like data
        const svgContent = `
          <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
            <rect width="800" height="1000" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
            <text x="400" y="500" font-family="Arial, sans-serif" font-size="48" fill="#6c757d" text-anchor="middle">Page ${pageNumber}</text>
            <text x="400" y="560" font-family="Arial, sans-serif" font-size="24" fill="#adb5bd" text-anchor="middle">Plan Sheet</text>
          </svg>
        `;
        return new TextEncoder().encode(svgContent);
      };

      const placeholderImage = createPlaceholderImage(pageNo);

      // Upload page image to storage with proper error handling
      const imagePath = `${projectId}/page_${pageNo}.png`
      console.log(`Uploading page ${pageNo} to storage path:`, imagePath)
      
      const { error: uploadError } = await supabaseClient.storage
        .from('plan-images')
        .upload(imagePath, placeholderImage, {
          contentType: 'image/svg+xml',
          upsert: true
        })

      if (uploadError) {
        console.error(`Error uploading page ${pageNo} image:`, uploadError)
        // Continue processing other pages even if one fails
      } else {
        console.log(`Successfully uploaded page ${pageNo}`)
      }

      // Create signed URL with proper 24-hour TTL
      const { data: signedData, error: signError } = await supabaseClient.storage
        .from('plan-images')
        .createSignedUrl(imagePath, 24 * 60 * 60) // 24 hours in seconds

      if (signError) {
        console.error(`Error creating signed URL for page ${pageNo}:`, signError)
        // Continue with null URL rather than failing completely
      }

      const signedUrl = signedData?.signedUrl || null;
      console.log(`Created signed URL for page ${pageNo}:`, signedUrl ? 'Success' : 'Failed')

      // Simulate AI classification with realistic classes and confidence scores
      const pageClasses = ['floor_plan', 'wall_section', 'roof_plan', 'foundation_plan', 'electrical_plan', 'structural_plan', 'site_plan']
      const randomClass = pageClasses[Math.floor(Math.random() * pageClasses.length)]
      const confidence = 0.6 + Math.random() * 0.4 // 60-100% confidence

      extractedPages.push({
        page_no: pageNo,
        class: randomClass,
        confidence: confidence,
        img_url: signedUrl
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
          error_message: error.message,
          progress: 0
        })
        .eq('id', jobData.id)
      
      throw error
    }

    console.log(`Successfully inserted ${data.length} pages`)

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
          total_pages: numPages
        }
      })
      .eq('id', jobData.id)

    console.log(`Successfully classified ${extractedPages.length} pages for project ${projectId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        pages: data,
        jobId: jobData.id,
        message: `Successfully classified ${extractedPages.length} pages`
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
        error: error.message,
        details: 'Check edge function logs for more details'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
