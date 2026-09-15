// API route for email-related functionality
// GET /api/email - Get email templates
// POST /api/email - Send an email notification

export async function getEmailTemplates() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/email/templates');
  return response.json();
}

export async function sendEmailTemplate(templateId, recipient, subject, body) {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/email/templates/' + templateId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient,
      subject,
      body
    })
  });
  return response.json();
}
