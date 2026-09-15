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
    const { email_samples } = await req.json()
    
    if (!email_samples || !Array.isArray(email_samples) || email_samples.length === 0) {
      return new Response(JSON.stringify({ error: 'Email samples required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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
    const tonePrompt = await generateTonePrompt(email_samples, supabase)

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
    console.error('AI tone cloning error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateTonePrompt(emailSamples: string[], supabase: any) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    // Fallback: simple template based on email samples
    const combinedText = emailSamples.join('\n\n')
    return `Write in a professional and friendly tone, similar to: ${combinedText.substring(0, 500)}`
  }

  // OpenAI API call to analyze tone
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing writing style and tone. Analyze the provided emails and create a concise prompt that captures the tone, style, and personality.'
        },
        {
          role: 'user',
          content: `Analyze these emails and create a prompt that captures the writing tone, style, and personality:

${emailSamples.join('\n\n')}

Generate a concise prompt (2-3 sentences) that can be used to write similar emails.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })
  })

  const data = await response.json()
  const tonePrompt = data.choices[0]?.message?.content || 'Professional and friendly tone'

  return tonePrompt
}
