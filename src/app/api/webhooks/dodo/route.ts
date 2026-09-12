import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '../../../../lib/supabase-server';

/**
 * Dodo Payments Webhook
 * Handles subscription lifecycle events (created, updated, canceled).
 *
 * Configure your Dodo Payments webhook to point to:
 *   https://your-domain.com/api/webhooks/dodo
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseService();

  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get('webhook-id') || request.headers.get('x-dodo-signature');
      // Dodo Payments uses a different signature scheme — for now, we accept all
      // in dev mode. In production, implement proper signature verification.
      console.log('[Dodo Webhook] Signature header:', signature ? 'present' : 'missing');
    }

    const body = await request.json();
    console.log('[Dodo Webhook]', body?.type || body?.event);

    const eventType = body?.type || body?.event;
    const subscriptionId = body?.data?.subscription_id || body?.data?.id || body?.subscription_id;
    const customerId = body?.data?.customer_id || body?.customer_id;
    const plan = body?.data?.plan || body?.data?.product_id;

    // Map plan IDs to plan types
    const planMap: Record<string, string> = {
      'hook': 'Hook',
      'solo': 'Solo',
      'agency': 'Agency',
    };
    const planType = planMap[plan?.toLowerCase()] || body?.data?.plan_type || 'Hook';

    switch (eventType) {
      case 'subscription.created':
      case 'subscription.activated': {
        if (subscriptionId && customerId) {
          // Find user by customer ID (stored in user metadata)
          const { data: userData } = await supabase.auth.admin.getUserById(customerId);

          if (userData?.user) {
            await supabase.from('subscriptions').upsert({
              user_id: userData.user.id,
              dodo_subscription_id: subscriptionId,
              plan: planType,
              status: 'active',
              current_period_end: body?.data?.current_period_end || null,
            });

            // Update profile plan
            await supabase.from('profiles').update({ plan_type: planType }).eq('id', userData.user.id);
          }
        }
        break;
      }

      case 'subscription.updated': {
        if (subscriptionId) {
          await supabase.from('subscriptions')
            .update({
              plan: planType,
              status: 'active',
              current_period_end: body?.data?.current_period_end || null,
            })
            .eq('dodo_subscription_id', subscriptionId);
        }
        break;
      }

      case 'subscription.canceled':
      case 'subscription.expired': {
        if (subscriptionId) {
          await supabase.from('subscriptions')
            .update({ status: 'canceled' })
            .eq('dodo_subscription_id', subscriptionId);

          // Downgrade to Hook plan
          const { data: sub } = await supabase.from('subscriptions')
            .select('user_id')
            .eq('dodo_subscription_id', subscriptionId)
            .single();

          if (sub) {
            await supabase.from('profiles').update({ plan_type: 'Hook' }).eq('id', sub.user_id);
          }
        }
        break;
      }

      case 'subscription.payment_failed': {
        if (subscriptionId) {
          await supabase.from('subscriptions')
            .update({ status: 'past_due' })
            .eq('dodo_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        console.log('[Dodo Webhook] Unhandled event:', eventType);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('[Dodo Webhook] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
