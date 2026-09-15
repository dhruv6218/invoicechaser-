// API route for sending notifications
// POST /api/notifications - Send a notification to a user

export async function sendNotification(userId, message) {
  // Implementation will connect to Supabase and send notification
  const response = await fetch('https://your-supabase-url.supabase.co/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      message,
      type: 'reminder',
      priority: 'high'
    })
  });
  return response.json();
}
