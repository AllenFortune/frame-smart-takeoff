
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
    const { projectId, pageIds } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Simulate GPT-4V extraction of framing summary
    // In real implementation, this would analyze the selected page images
    const mockSummary = {
      wall_height_ft: 9,
      num_stories: 2,
      shear_wall_tags: ['SW1', 'SW2', 'SW3'],
      nailing_table_refs: ['Table 2304.9.1', 'Table 2304.9.3'],
      general_notes: [
        'All framing lumber to be Douglas Fir #2 or better',
        'Shear walls to be sheathed with 7/16" OSB',
        'Header sizes per plan specifications'
      ]
    }

    // Upsert summary into database
    const { data, error } = await supabaseClient
      .from('plan_summaries')
      .upsert({
        project_id: projectId,
        summary_json: mockSummary
      })
      .select()

    if (error) {
      throw error
    }

    console.log(`Extracted summary for project ${projectId} from ${pageIds.length} pages`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: data[0],
        message: 'Successfully extracted framing summary'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in extract-summary:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
