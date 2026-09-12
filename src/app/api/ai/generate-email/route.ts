import { NextRequest, NextResponse } from 'next/server';
import { generateReminderEmail } from '../../../../lib/ai';

/**
 * AI Email Generation API route.
 * POST: Generate a reminder email for an overdue invoice.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientName, invoiceAmount, currency, invoiceId,
      daysOverdue, reminderCount, toneLevel, tonePrompt, paymentLink,
    } = body;

    if (!clientName || !invoiceAmount) {
      return NextResponse.json({ error: 'Missing invoice details' }, { status: 400 });
    }

    const emailContent = await generateReminderEmail({
      clientName,
      invoiceAmount,
      currency: currency || 'USD',
      invoiceId: invoiceId || '',
      daysOverdue: daysOverdue || 0,
      reminderCount: reminderCount || 0,
      toneLevel: toneLevel || 2,
      tonePrompt: tonePrompt || 'Professional and friendly tone.',
      paymentLink: paymentLink || '#',
    });

    return NextResponse.json({ emailContent });
  } catch (err) {
    console.error('[AI] Email generation failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI generation failed' },
      { status: 500 }
    );
  }
}
