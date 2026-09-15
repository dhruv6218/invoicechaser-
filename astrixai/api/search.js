// API route for searching invoices and users
// GET /api/search - Search invoices or users by criteria

export async function searchItems(query) {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/search', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    query: { term: query }
  });
  return response.json();
}
