import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '../../../../lib/supabase-server';
import { generateReminderEmail } from '../../../../lib/ai';
import { sendEmail, buildReminderEmailHTML } from '../../../../lib/email';
import { decrypt } from '../../../../lib/crypto';

/**
 * Daily Chase Engine — Cron Job
 * Scans overdue invoices, generates AI emails, and sends reminders.
 *
 * Protect with: authorization header matching CRON_SECRET env var.
 * On Vercel: set up a daily cron at 09:00 UTC hitting this endpoint.
 */
export async function GET(request: NextRequest) {
  // Auth check (skip in development if no CRON_SECRET is set)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = getSupabaseService();
  const results = { scanned: 0, sent: 0, errors: [] as string[] };

  try {
    // 1. Get all overdue, pending invoices
    const today = new Date().toISOString().split('T')[0];
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        workspaces!inner(id, name, owner_id)
      `)
      .eq('status', 'pending')
      .lt('due_date', today);

    if (error) throw error;
    results.scanned = invoices?.length || 0;

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ ...results, message: 'No overdue invoices found.' });
    }

    // 2. Filter by frequency guardrail (at least 3 days since last chase)
    const eligibleInvoices = invoices.filter((inv: Record<string, unknown>) => {
      const lastChased = inv.last_chased_at as string | null;
      if (!lastChased) return true;
      const daysSince = Math.floor((Date.now() - new Date(lastChased).getTime()) / 86400000);
      return daysSince >= 3;
    });

    // 3. Process each eligible invoice
    for (const inv of eligibleInvoices) {
      try {
        const workspace = inv.workspaces as Record<string, unknown>;
        const workspaceId = workspace.id as string;
        const workspaceName = workspace.name as string;
        const invoiceId = inv.id as string;
        const reminderCount = inv.reminder_count as number;

        // Determine tone level based on reminder count
        const toneLevel = reminderCount === 0 ? 1 : reminderCount === 1 ? 2 : 3;

        // Get tone settings for the workspace
        const { data: toneSettings } = await supabase
          .from('tone_settings')
          .select('ai_prompt, tone_level')
          .eq('workspace_id', workspaceId)
          .single();

        const tonePrompt = toneSettings?.ai_prompt || 'Professional and friendly tone. Be concise and polite.';

        // Build payment link
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host') || 'localhost:3000'}`;
        const paymentLink = `${siteUrl}/pay/${invoiceId}`;

        // Calculate days overdue
        const dueDate = new Date(inv.due_date as string);
        const daysOverdue = Math.max(1, Math.floor((Date.now() - dueDate.getTime()) / 86400000));

        // Generate AI email
        const emailContent = await generateReminderEmail({
          clientName: inv.client_name as string,
          invoiceAmount: Number(inv.amount),
          currency: inv.currency as string,
          invoiceId,
          daysOverdue,
          reminderCount: reminderCount + 1,
          toneLevel,
          tonePrompt,
          paymentLink,
        });

        // Build and send email
        const html = buildReminderEmailHTML({
          emailContent,
          paymentLink,
          invoiceId,
          workspaceName,
        });

        await sendEmail({
          to: inv.client_email as string,
          subject: `Payment Reminder — Invoice #${invoiceId.slice(0, 8)}`,
          html,
        });

        // Update invoice
        const newAiStatus = toneLevel >= 3 ? 'escalated' : 'nudge_sent';
        await supabase
          .from('invoices')
          .update({
            last_chased_at: new Date().toISOString(),
            reminder_count: reminderCount + 1,
            ai_status: newAiStatus,
          })
          .eq('id', invoiceId);

        // Log to reminder_logs
        await supabase.from('reminder_logs').insert({
          invoice_id: invoiceId,
          workspace_id: workspaceId,
          email_content: emailContent,
          tone_level: toneLevel,
        });

        // Log to activity_feed
        await supabase.from('activity_feed').insert({
          workspace_id: workspaceId,
          type: toneLevel >= 3 ? 'escalated' : 'reminder_sent',
          message: toneLevel >= 3
            ? `AI escalated ${inv.client_name} to Level ${toneLevel} (${toneLevel === 3 ? 'Firm' : 'Balanced'} tone)`
            : `AI sent a ${toneLevel === 1 ? 'friendly nudge' : 'reminder'} to ${inv.client_name} for Invoice #${invoiceId.slice(0, 8)}`,
          amount: Number(inv.amount),
        });

        results.sent++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Invoice ${inv.id}: ${msg}`);
        console.error('[Cron] Failed for invoice', inv.id, msg);
      }
    }

    return NextResponse.json({
      ...results,
      message: `Chase engine complete. ${results.sent}/${results.scanned} reminders sent.`,
    });
  } catch (err) {
    console.error('[Cron] Fatal error:', err);
    return NextResponse.json(
      { ...results, error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
