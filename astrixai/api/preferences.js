// API route for user preferences
// GET /api/preferences - Get user preferences
// PUT /api/preferences - Update user preferences

export async function getPreferences() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/preferences');
  return response.json();
}

export async function updatePreferences(preferences) {
  const response = await fetch('https://your-supabase-url.supabase.co/api/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
  return response.json();
}
