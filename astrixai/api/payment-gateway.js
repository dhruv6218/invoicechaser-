// API route for payment gateway integration
// GET /api/payment-gateway - List connected gateways
// POST /api/payment-gateway/connect - Connect a new payment gateway
// DELETE /api/payment-gateway/{gateway_id} - Disconnect a payment gateway

export async function listGateways() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/payment_gateways');
  return response.json();
}

export async function connectGateway(gatewayData) {
  const response = await fetch('https://your-supabase-url.supabase.co/api/payment_gateways', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gatewayData)
  });
  return response.json();
}

export async function disconnectGateway(gatewayId) {
  const response = await fetch(`https://your-supabase-url.supabase.co/api/payment_gateways/${gatewayId}`, {
    method: 'DELETE'
  });
  return response.json();
}
