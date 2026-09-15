// API route for managing invoices
// GET /api/invoices - List all invoices
// POST /api/invoices - Create a new invoice
// PUT /api/invoices/:id - Update an invoice
// DELETE /api/invoices/:id - Delete an invoice

export async function getInvoices() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/invoices');
  return response.json();
}

export async function createInvoice(invoiceData) {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData)
  });
  return response.json();
}

export async function updateInvoice(id, invoiceData) {
  const response = await fetch(`https://your-supabase-url.supabase.co/api/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData)
  });
  return response.json();
}

export async function deleteInvoice(id) {
  const response = await fetch(`https://your-supabase-url.supabase.co/api/invoices/${id}`, {
    method: 'DELETE'
  });
  return response.json();
}
