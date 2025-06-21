
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
      .update({ progress: 25, current_step: 'Extracting pages from PDF' })
      .eq('id', jobData.id)

    // Simulate PDF processing and page classification
    // In a real implementation, this would use PyMuPDF to split PDF and GPT-4V to classify
    const mockPages = [
      {
        page_no: 1,
        class: 'Floor_Plan',
        confidence: 0.95,
        img_url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/plan-images/${projectId}/page_1.png`
      },
      {
        page_no: 2,
        class: 'Wall_Section',
        confidence: 0.87,
        img_url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/plan-images/${projectId}/page_2.png`
      },
      {
        page_no: 3,
        class: 'Roof_Plan',
        confidence: 0.91,
        img_url: `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/plan-images/${projectId}/page_3.png`
      }
    ]

    // Update job progress
    await supabaseClient
      .from('job_status')
      .update({ progress: 50, current_step: 'Classifying page types using AI' })
      .eq('id', jobData.id)

    // Wait a bit to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Insert pages into database
    const { data, error } = await supabaseClient
      .from('plan_pages')
      .insert(mockPages.map(page => ({
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

    console.log(`Successfully classified ${mockPages.length} pages for project ${projectId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        pages: data,
        jobId: jobData.id,
        message: `Successfully classified ${mockPages.length} pages`
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
