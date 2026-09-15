// API route for third-party integrations
// GET /api/third_party - List connected third-party services
// POST /api/third_party - Connect a new third-party service
// DELETE /api/third_party/{service_id} - Disconnect a third-party service

export async function listThirdPartyServices() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/third_party');
  return response.json();
}

export async function connectThirdParty(serviceData) {
  const response = await fetch('https://your-supabase-url.supabase.co/api/third_party', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serviceData)
  });
  return response.json();
}

export async function disconnectThirdParty(serviceId) {
  const response = await fetch(`https://your-supabase-url.supabase.co/api/third_party/${serviceId}`, {
    method: 'DELETE'
  });
  return response.json();
}
