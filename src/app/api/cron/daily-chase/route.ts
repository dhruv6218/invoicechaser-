import { NextRequest, NextResponse } from 'next/server';

// Vercel Cron Job: Daily Chase Engine
// Runs at 09:00 AM UTC every day
// Scans for overdue invoices and sends AI-generated reminders

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    // Get overdue invoices that haven't been chased in 3-5 days
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        *,
        settings (
          ai_tone_prompt,
          payment_gateway_choice
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0])
      .or(`last_chased_at.is.null,last_chased_at.lt.${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()}`);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Process each invoice
    const results = [];
    for (const invoice of invoices || []) {
      try {
        const result = await processInvoice(invoice, supabase);
        results.push(result);
      } catch (error: any) {
        console.error(`Error processing invoice ${invoice.invoice_id}:`, error);
        results.push({ invoice_id: invoice.invoice_id, success: false, error: error.message ?? 'Unknown error' });
      }
    }
    
    return NextResponse.json({ 
      processed: results.length,
      successful: results.filter(r => r.success).length,
      results
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processInvoice(invoice: any, supabase: any) {
  // Generate AI email based on user's tone prompt
  const emailContent = await generateAEmail(invoice);
  
  // Generate checkout link based on payment gateway
  const checkoutLink = await generateCheckoutLink(invoice);
  
  // Send email via transactional email service
  await sendEmail({
    to: invoice.client_email,
    subject: `Payment Reminder: Invoice #${invoice.invoice_id}`,
    content: emailContent,
    checkoutLink
  });
  
  // Update last chased timestamp
  await supabase
    .from('invoices')
    .update({ last_chased_at: new Date().toISOString() })
    .eq('invoice_id', invoice.invoice_id);
  
  // Log the reminder
  await supabase
    .from('reminder_logs')
    .insert({
      invoice_id: invoice.invoice_id,
      sent_at: new Date().toISOString(),
      email_content: emailContent,
      decline_reason: null
    });
  
  return { invoice_id: invoice.invoice_id, success: true };
}

async function generateAEmail(invoice: any) {
  // In production, integrate with OpenAI/Anthropic API
  const tonePrompt = invoice.settings?.ai_tone_prompt || 'Professional and friendly';
  
  return `Hi ${invoice.client_name},

I hope you're doing well. I'm reaching out to gently remind you about invoice #${invoice.invoice_id} for $${invoice.amount}, which was due on ${invoice.due_date}.

If you've already made the payment, please disregard this message. Otherwise, you can settle the invoice using the 1-click checkout link below.

${generateCheckoutLink(invoice)}

Best regards,
Your Client

---
This email was sent automatically by Astrix AI - Autonomous B2B Revenue Recovery Agent
`;
}

async function generateCheckoutLink(invoice: any) {
  // Generate checkout link based on payment gateway
  const gateway = invoice.settings?.payment_gateway_choice || 'stripe';
  
  switch (gateway) {
    case 'stripe':
      return `https://checkout.stripe.com/pay/${invoice.invoice_id}`;
    case 'razorpay':
      return `https://pay.razorpay.com/${invoice.invoice_id}`;
    default:
      return 'https://pay.astrix.ai/' + invoice.invoice_id;
  }
}

async function sendEmail(options: any) {
  // In production, integrate with Resend/Postmark
  console.log('Sending email to:', options.to);
  console.log('Subject:', options.subject);
  console.log('Content:', options.content);
  
  // Resend API call would go here
  return { success: true };
}
