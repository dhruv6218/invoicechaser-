import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '../../../../lib/supabase-server';
import Stripe from 'stripe';

/**
 * Stripe Payment Webhook
 * Handles payment success and decline events.
 *
 * Configure your Stripe webhook endpoint to point to:
 *   https://your-domain.com/api/webhooks/stripe
 *
 * Set STRIPE_WEBHOOK_SECRET in your env to verify signatures.
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseService();

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const stripe = new Stripe('', { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      // No secret configured — parse raw body (development mode)
      try {
        event = JSON.parse(body) as Stripe.Event;
      } catch {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
      }
    }

    console.log('[Stripe Webhook]', event.type);

    switch (event.type) {
      // Payment succeeded — mark invoice as paid
      case 'payment_intent.succeeded':
      case 'checkout.session.completed': {
        const metadata = 'metadata' in event.data.object
          ? (event.data.object as { metadata: Record<string, string> }).metadata
          : {};
        const invoiceId = metadata?.invoice_id;

        if (invoiceId) {
          // Update invoice status to paid
          const { error } = await supabase
            .from('invoices')
            .update({ status: 'paid', ai_status: 'paid' })
            .eq('id', invoiceId);

          if (error) {
            console.error('[Stripe Webhook] Failed to update invoice:', error);
          } else {
            // Log activity
            const { data: inv } = await supabase
              .from('invoices')
              .select('workspace_id, client_name, amount')
              .eq('id', invoiceId)
              .single();

            if (inv) {
              await supabase.from('activity_feed').insert({
                workspace_id: inv.workspace_id,
                type: 'payment_received',
                message: `Payment received from ${inv.client_name} — Invoice cleared`,
                amount: Number(inv.amount),
              });
            }
            console.log('[Stripe Webhook] Invoice marked as paid:', invoiceId);
          }
        }
        break;
      }

      // Payment failed — handle decline
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoice_id;
        const declineCode = paymentIntent.last_payment_error?.code || 'unknown';
        const isSoftDecline = ['card_declined', 'insufficient_funds', 'expired_card', 'processing_error'].includes(declineCode);

        if (invoiceId) {
          if (isSoftDecline) {
            // Soft decline — log and will retry on next cron cycle
            console.log('[Stripe Webhook] Soft decline for invoice', invoiceId, '- will retry');
            await supabase.from('reminder_logs').insert({
              invoice_id: invoiceId,
              email_content: `Soft decline: ${declineCode}. Will retry on next cycle.`,
              decline_reason: declineCode,
            });
          } else {
            // Hard decline — send "fix your card" email
            console.log('[Stripe Webhook] Hard decline for invoice', invoiceId);
            const { data: inv } = await supabase
              .from('invoices')
              .select('client_email, client_name')
              .eq('id', invoiceId)
              .single();

            if (inv) {
              // The next cron cycle will handle sending the "fix your card" email
              // with escalated tone
              await supabase.from('reminder_logs').insert({
                invoice_id: invoiceId,
                email_content: `Hard decline: ${declineCode}. Card needs updating.`,
                decline_reason: declineCode,
              });
            }
          }
        }
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Stripe Webhook] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
