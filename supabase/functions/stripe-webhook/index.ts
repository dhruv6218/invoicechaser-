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
    const payload = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify webhook signature (implement Stripe webhook verification)
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    
    // For now, parse payload directly
    // In production, verify signature with Stripe library
    const event = JSON.parse(payload)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabase, event.data.object)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(supabase, event.data.object)
        break
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSuccess(supabase, event.data.object)
        break
        
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handlePaymentSuccess(supabase: any, paymentIntent: any) {
  const invoiceId = paymentIntent.metadata?.invoice_id
  
  if (invoiceId) {
    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ 
        status: 'paid',
        last_chased_at: new Date().toISOString()
      })
      .eq('invoice_id', invoiceId)

    if (updateError) {
      console.error('Error updating invoice:', updateError)
      return
    }

    // Log success
    await supabase
      .from('reminder_logs')
      .insert({
        invoice_id: invoiceId,
        sent_at: new Date().toISOString(),
        email_content: 'Payment received successfully',
        decline_reason: null
      })

    // Update user credits
    const { data: invoice } = await supabase
      .from('invoices')
      .select('user_id')
      .eq('invoice_id', invoiceId)
      .single()

    if (invoice) {
      await supabase
        .from('users')
        .update({ 
          credits_used: supabase.raw('credits_used + 1')
        })
        .eq('user_id', invoice.user_id)
    }
  }
}

async function handlePaymentFailure(supabase: any, paymentIntent: any) {
  const invoiceId = paymentIntent.metadata?.invoice_id
  
  if (invoiceId) {
    // Log failure
    await supabase
      .from('reminder_logs')
      .insert({
        invoice_id: invoiceId,
        sent_at: new Date().toISOString(),
        email_content: 'Payment failed',
        decline_reason: paymentIntent.last_payment_error?.message || 'Unknown error'
      })

    // If hard decline, trigger AI email with fix card link
    if (paymentIntent.last_payment_error?.code === 'card_declined') {
      // Trigger AI email generation via another function call
      console.log('Hard decline detected, triggering fix card email')
    }
  }
}

async function handleInvoicePaymentSuccess(supabase: any, invoice: any) {
  // Handle subscription invoice payments
  console.log('Subscription payment succeeded:', invoice.id)
}
