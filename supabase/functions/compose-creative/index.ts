import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { baseImage, copy, config } = await req.json()

    if (!baseImage || !copy) {
      throw new Error('Base image and copy are required')
    }

    console.log('Composing creative with copy:', copy)

    // Note: Text composition now happens on the frontend using HTML5 Canvas API
    // This edge function is kept for potential future backend composition needs
    // For now, we just return success status
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Text composition is handled on the frontend for better performance and zero additional cost'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in compose-creative:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
