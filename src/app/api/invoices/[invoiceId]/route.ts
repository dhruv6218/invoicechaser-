import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '../../../../lib/supabase-server';

/**
 * Public endpoint: Fetch a single invoice for the payment portal.
 * No auth required — used by the client-facing /pay/[invoiceId] page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const supabase = getSupabaseService();
  const { invoiceId } = await params;

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
  }

  // Fetch invoice with workspace info
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      workspaces!inner(id, name)
    `)
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const workspaceId = invoice.workspaces?.id || invoice.workspace_id;

  // Fetch active gateway for the workspace
  const { data: gateway } = await supabase
    .from('gateways')
    .select('type, static_url, is_active, api_key_enc')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch reminder logs for this invoice
  const { data: reminders } = await supabase
    .from('reminder_logs')
    .select('sent_at, email_content, tone_level, decline_reason')
    .eq('invoice_id', invoiceId)
    .order('sent_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    invoice: {
      id: invoice.id,
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      due_date: invoice.due_date,
      status: invoice.status,
      ai_status: invoice.ai_status,
      reminder_count: invoice.reminder_count,
      last_chased_at: invoice.last_chased_at,
      payment_link: invoice.payment_link,
      created_at: invoice.created_at,
    },
    workspace: {
      id: workspaceId,
      name: invoice.workspaces?.name || 'Unknown',
    },
    gateway: gateway
      ? {
          type: gateway.type,
          static_url: gateway.static_url,
          has_api_key: !!gateway.api_key_enc,
        }
      : null,
    reminders: reminders || [],
  });
}
