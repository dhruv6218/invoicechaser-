import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get overdue invoices that haven't been chased in 3-5 days
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        settings (
          ai_tone_prompt,
          payment_gateway_choice
        ),
        users (
          email,
          plan_type
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .or(`last_chased_at.is.null,last_chased_at.lt.${threeDaysAgo}`)

    if (error) {
      throw error
    }

    const results = []
    
    // Process each invoice
    for (const invoice of invoices || []) {
      try {
        // Generate AI email content
        const emailContent = await generateAIEmail(invoice)
        
        // Send email via Resend
        await sendEmail({
          to: invoice.client_email,
          subject: `Payment Reminder: Invoice #${invoice.invoice_id}`,
          content: emailContent,
          checkoutLink: await generateCheckoutLink(invoice)
        })

        // Update last chased timestamp
        await supabase
          .from('invoices')
          .update({ last_chased_at: new Date().toISOString() })
          .eq('invoice_id', invoice.invoice_id)

        // Log reminder
        await supabase
          .from('reminder_logs')
          .insert({
            invoice_id: invoice.invoice_id,
            sent_at: new Date().toISOString(),
            email_content: emailContent,
            decline_reason: null
          })

        results.push({ invoice_id: invoice.invoice_id, success: true })
      } catch (err) {
        console.error(`Error processing invoice ${invoice.invoice_id}:`, err)
        results.push({ invoice_id: invoice.invoice_id, success: false, error: err.message })
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        successful: results.filter(r => r.success).length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Cron job error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generateAIEmail(invoice: any) {
  // In production, integrate with OpenAI API
  const tonePrompt = invoice.settings?.ai_tone_prompt || 'Professional and friendly'
  const clientName = invoice.client_name
  
  return `Hi ${clientName},

I hope you're doing well. I'm reaching out to gently remind you about invoice #${invoice.invoice_id} for $${invoice.amount}, which was due on ${invoice.due_date}.

${tonePrompt ? `As per your preference: ${tonePrompt}` : ''}

If you've already made the payment, please disregard this message. Otherwise, you can settle the invoice using the 1-click checkout link below.

[Checkout Link]

Best regards,
Your Client

---
This email was sent automatically by Astrix AI - Autonomous B2B Revenue Recovery Agent
`
}

async function generateCheckoutLink(invoice: any) {
  const gateway = invoice.settings?.payment_gateway_choice || 'stripe'
  
  switch (gateway) {
    case 'stripe':
      return `https://checkout.stripe.com/pay/${invoice.invoice_id}`
    case 'razorpay':
      return `https://pay.razorpay.com/${invoice.invoice_id}`
    default:
      return `https://pay.astrix.ai/${invoice.invoice_id}`
  }
}

async function sendEmail(options: any) {
  // In production, integrate with Resend API
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  
  if (!resendApiKey) {
    console.log('Resend API key not configured, skipping email send')
    return { success: true }
  }
  
  // Resend API call
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Astrix AI <noreply@astrix.ai>',
      to: options.to,
      subject: options.subject,
      html: options.content
    })
  })
  
  return await response.json()
}
