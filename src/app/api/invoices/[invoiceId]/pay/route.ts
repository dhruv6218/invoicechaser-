import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '../../../../../lib/supabase-server';
import { decrypt } from '../../../../../lib/crypto';
import Stripe from 'stripe';

/**
 * Public endpoint: Create a Stripe Checkout session for an invoice.
 * Uses the workspace's stored (encrypted) Stripe API key.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const supabase = getSupabaseService();
  const { invoiceId } = await params;

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
  }

  // Fetch invoice
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('id, client_name, client_email, amount, currency, status, workspace_id')
    .eq('id', invoiceId)
    .single();

  if (invError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
  }

  // Get the workspace's active Stripe gateway
  const { data: gateway } = await supabase
    .from('gateways')
    .select('type, api_key_enc, static_url')
    .eq('workspace_id', invoice.workspace_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host') || 'localhost:3000'}`;

  // If static link gateway, return the static URL
  if (gateway?.type === 'custom' && gateway.static_url) {
    return NextResponse.json({
      type: 'static',
      url: gateway.static_url,
    });
  }

  // If Stripe gateway, create a Checkout Session
  if (gateway?.type === 'stripe' && gateway.api_key_enc) {
    try {
      const stripeKey = decrypt(gateway.api_key_enc);
      if (!stripeKey) {
        return NextResponse.json({ error: 'Failed to decrypt gateway key' }, { status: 500 });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: (invoice.currency || 'USD').toLowerCase(),
              product_data: {
                name: `Invoice #${invoiceId.slice(0, 8)}`,
                description: `Payment for ${invoice.client_name}`,
              },
              unit_amount: Math.round(Number(invoice.amount) * 100),
            },
            quantity: 1,
          },
        ],
        customer_email: invoice.client_email,
        metadata: {
          invoice_id: invoiceId,
        },
        mode: 'payment',
        success_url: `${siteUrl}/payment-success/${invoiceId}`,
        cancel_url: `${siteUrl}/payment-cancelled/${invoiceId}`,
      });

      // Save payment link on invoice
      await supabase
        .from('invoices')
        .update({ payment_link: session.url || '' })
        .eq('id', invoiceId);

      return NextResponse.json({
        type: 'stripe',
        url: session.url,
      });
    } catch (err) {
      console.error('[Pay] Stripe checkout error:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to create checkout' },
        { status: 500 }
      );
    }
  }

  // No active gateway
  return NextResponse.json({
    type: 'none',
    error: 'No payment gateway connected. Please contact the sender.',
  });
}
