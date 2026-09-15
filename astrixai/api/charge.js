// API route for generating 1-click checkout links
// POST /api/charge - Create a checkout link for an invoice

export async function createCheckoutLink(invoiceId) {
  // Implementation will connect to Supabase and generate a checkout link
  const response = await fetch('https://your-supabase-url.supabase.co/api/checkout_links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invoiceId: invoiceId,
      amount: 100.00, // example amount
      currency: 'USD'
    })
  });
  return response.json();
}
