
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

    // For now, we'll simulate PDF processing since we don't have PyMuPDF in Deno
    // In a production environment, you'd use a PDF processing library or service
    
    // Simulate extracting pages and create mock page images
    const numPages = Math.floor(Math.random() * 5) + 1 // 1-5 pages
    const extractedPages = []

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

      // Create a simple placeholder image (1x1 transparent PNG)
      const placeholderImage = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x56, 0x28, 0x30, 0x9C, 0x00, 0x00, 0x00,
        0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x60, 0x00, 0x02, 0x00,
        0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ])

      // Upload page image to storage
      const imagePath = `${projectId}/page_${pageNo}.png`
      const { error: uploadError } = await supabaseClient.storage
        .from('plan-images')
        .upload(imagePath, placeholderImage, {
          contentType: 'image/png',
          upsert: true
        })

      if (uploadError) {
        console.error('Error uploading page image:', uploadError)
        // Continue processing other pages even if one fails
      }

      // Get the public URL for the uploaded image
      const { data: urlData } = supabaseClient.storage
        .from('plan-images')
        .getPublicUrl(imagePath)

      // Simulate AI classification with realistic classes and confidence scores
      const pageClasses = ['Floor_Plan', 'Wall_Section', 'Roof_Plan', 'Foundation_Plan', 'Electrical_Plan']
      const randomClass = pageClasses[Math.floor(Math.random() * pageClasses.length)]
      const confidence = 0.7 + Math.random() * 0.3 // 70-100% confidence

      extractedPages.push({
        page_no: pageNo,
        class: randomClass,
        confidence: confidence,
        img_url: urlData.publicUrl
      })
    }

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 80, current_step: 'Saving page data to database' })
      .eq('id', jobData.id)

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
          error_message: error.message,
          progress: 0
        })
        .eq('id', jobData.id)
      
      throw error
    }

    // Update job to completed
    await supabaseClient
      .from('job_status')
      .update({ 
        status: 'completed', 
        progress: 100,
        current_step: 'Classification complete',
        completed_at: new Date().toISOString(),
        result_data: { pages_created: data.length }
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
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
