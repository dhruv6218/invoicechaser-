// API route for dashboard widgets and metrics
// GET /api/dashboard - Get dashboard widgets data
// GET /api/dashboard/metrics - Get metric data for charts

export async function getDashboardWidgets() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/dashboard/widgets');
  return response.json();
}

export async function getMetricData() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/dashboard/metrics');
  return response.json();
}
