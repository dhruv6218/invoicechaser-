// API route for third-party integrations
// GET /api/integrations - List connected integrations
// POST /api/integrations - Connect a new integration
// DELETE /api/integrations/{integration_id} - Disconnect an integration

export async function listIntegrations() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/integrations');
  return response.json();
}

export async function connectIntegration(integrationData) {
  const response = await fetch('https://your-supabase-url.supabase.co/api/integrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(integrationData)
  });
  return response.json();
}

export async function disconnectIntegration(integrationId) {
  const response = await fetch(`https://your-supabase-url.supabase.co/api/integrations/${integrationId}`, {
    method: 'DELETE'
  });
  return response.json();
}
