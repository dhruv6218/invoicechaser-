import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '../../../lib/supabase-server';

/**
 * Authenticated endpoint: Create a Dodo Payments checkout session for subscription.
 * POST body: { plan: 'Solo' | 'Agency', period: 'monthly' | 'annual' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { plan, period } = body;

    if (!plan || !['Solo', 'Agency'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Dodo Payments not configured' }, { status: 500 });
    }

    // Get product ID from env (user sets these in Dodo dashboard)
    const productVar = `DODO_PRODUCT_${plan.toUpperCase()}_${(period || 'monthly').toUpperCase()}`;
    const productId = process.env[productVar];

    if (!productId) {
      return NextResponse.json({ error: `Product ID not configured for ${plan} (${period}). Set ${productVar} env var.` }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host') || 'localhost:3000'}`;

    // Create Dodo checkout session via REST API
    const res = await fetch('https://api.dodopayments.com/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        return_url: `${siteUrl}/app/settings?tab=billing`,
        metadata: {
          user_id: user.id,
          email: user.email,
          plan,
          period: period || 'monthly',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Checkout] Dodo API error:', err);
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    const data = await res.json();
    const checkoutUrl = data.checkout_url || data.url;

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'No checkout URL returned' }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error('[Checkout] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
