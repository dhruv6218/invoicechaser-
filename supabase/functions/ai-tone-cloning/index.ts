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
    const { email_samples, client_email } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate AI tone prompt from email samples
    const tonePrompt = await generateTonePrompt(email_samples)

    // Save tone prompt to settings
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        user_id: user.id,
        ai_tone_prompt: tonePrompt
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, tone_prompt: tonePrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateTonePrompt(emailSamples: string[]) {
  // In production, integrate with OpenAI API
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!apiKey) {
    // Fallback: simple template based on email samples
    return `Write in a professional and friendly tone, similar to the provided emails. Keep messages concise and polite.`
  }

  // OpenAI API call would go here
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {...})
  
  return `Custom tone prompt generated from ${emailSamples.length} email samples`
}
