// API route for A/B testing experiments
// GET /api/analytics/experiments - List active experiments
// POST /api/analytics/experiments - Create a new experiment

export async function listExperiments() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/analytics/experiments');
  return response.json();
}

export async function createExperiment(experimentData) {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/analytics/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(experimentData)
  });
  return response.json();
}
