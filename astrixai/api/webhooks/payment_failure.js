// API route for handling payment failure webhooks
// POST /api/webhooks/payment-failure - Handle payment failure events

export async function handlePaymentFailure(payload) {
  // Implementation will connect to Supabase and update invoice status
  const response = await fetch('https://your-supabase-url.supabase.co/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'payment_failure',
      invoiceId: payload.invoice_id,
      reason: payload.reason,
      timestamp: new Date().toISOString()
    })
  });
  return response.json();
}
