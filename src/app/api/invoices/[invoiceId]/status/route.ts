import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '../../../../../lib/supabase-server';

/**
 * Public endpoint: Update invoice status.
 * Used by payment portal pages (already-paid, dispute).
 * No auth — clients interact with this from the payment portal.
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

  const body = await request.json();
  const { action, message } = body;

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  // Verify invoice exists
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .select('id, workspace_id, client_name, status')
    .eq('id', invoiceId)
    .single();

  if (invError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  switch (action) {
    case 'mark_paid': {
      await supabase
        .from('invoices')
        .update({ status: 'paid', ai_status: 'paid' })
        .eq('id', invoiceId);

      await supabase.from('activity_feed').insert({
        workspace_id: invoice.workspace_id,
        type: 'payment_received',
        message: `Payment marked as received from ${invoice.client_name}`,
      });
      break;
    }

    case 'dispute': {
      await supabase
        .from('invoices')
        .update({ status: 'disputed' })
        .eq('id', invoiceId);

      await supabase.from('activity_feed').insert({
        workspace_id: invoice.workspace_id,
        type: 'paused',
        message: `Client disputed invoice — ${message || 'No message provided'}`,
      });
      break;
    }

    case 'already_paid': {
      await supabase
        .from('invoices')
        .update({ status: 'paid', ai_status: 'paid' })
        .eq('id', invoiceId);

      await supabase.from('activity_feed').insert({
        workspace_id: invoice.workspace_id,
        type: 'payment_received',
        message: `Client reported invoice as already paid — ${message || 'No details provided'}`,
      });
      break;
    }

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
