
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
    const { pageId, step } = await req.json()
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Simulate overlay generation with mock GeoJSON
    const mockGeoJson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            id: "wall_1",
            type: step,
            material: step === 'exterior' ? '2x6 studs' : '2x4 studs',
            length_ft: 24,
            included: true
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [100, 100], [400, 100], [400, 120], [100, 120], [100, 100]
            ]]
          }
        },
        {
          type: "Feature",
          properties: {
            id: "wall_2", 
            type: step,
            material: step === 'headers' ? '2x12 header' : '2x6 studs',
            length_ft: 16,
            included: true
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [100, 200], [300, 200], [300, 220], [100, 220], [100, 200]
            ]]
          }
        }
      ]
    }

    const overlayUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/plan-images/${pageId}/overlay_${step}.png`

    // Upsert overlay into database
    const { data, error } = await supabaseClient
      .from('plan_overlays')
      .upsert({
        page_id: pageId,
        step: step,
        overlay_url: overlayUrl,
        geojson: mockGeoJson
      })
      .select()

    if (error) {
      throw error
    }

    console.log(`Generated ${step} overlay for page ${pageId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        overlay: data[0],
        message: `Successfully generated ${step} overlay`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in generate-overlay:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
