import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    // TODO: Connect Stripe webhook secret from env
    // const event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
    
    const body = JSON.parse(payload);
    console.log('[Stripe Webhook]', body?.type);
    
    // Process webhook event
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    switch (body.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = body.data.object;
        await handlePaymentSuccess(supabase, paymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = body.data.object;
        await handlePaymentFailure(supabase, failedPayment);
        break;
        
      default:
        console.log(`Unhandled event type ${body.type}`);
    }
    
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handlePaymentSuccess(supabase: any, paymentIntent: any) {
  try {
    const invoiceId = paymentIntent.metadata?.invoice_id;
    
    if (invoiceId) {
      // Update invoice status to paid
      await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          last_chased_at: new Date().toISOString()
        })
        .eq('invoice_id', invoiceId);
      
      // Create reminder log
      await supabase
        .from('reminder_logs')
        .insert({
          invoice_id: invoiceId,
          sent_at: new Date().toISOString(),
          email_content: 'Payment received successfully',
          decline_reason: null
        });
    }
  } catch (error) {
    console.error('Payment success handling error:', error);
  }
}

async function handlePaymentFailure(supabase: any, paymentIntent: any) {
  try {
    const invoiceId = paymentIntent.metadata?.invoice_id;
    
    if (invoiceId) {
      // Log payment failure
      await supabase
        .from('reminder_logs')
        .insert({
          invoice_id: invoiceId,
          sent_at: new Date().toISOString(),
          email_content: 'Payment failed',
          decline_reason: paymentIntent.last_payment_error?.message || 'Unknown error'
        });
    }
  } catch (error) {
    console.error('Payment failure handling error:', error);
  }
}
