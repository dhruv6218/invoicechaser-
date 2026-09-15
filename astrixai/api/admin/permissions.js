// API route for permission management
// GET /api/admin/permissions - List user permissions
// POST /api/admin/permissions - Grant permissions to a user
// DELETE /api/admin/permissions/{permission_id} - Revoke permissions

export async function listPermissions() {
  // Implementation will connect to Supabase
  const response = await fetch('https://your-supabase-url.supabase.co/api/admin/permissions');
  return response.json();
}

export async function grantPermission(userId, permissionId) {
  const response = await fetch('https://your-supabase-url.supabase.co/api/admin/permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, permissionId })
  });
  return response.json();
}

export async function revokePermission(permissionId) {
  const response = await fetch(`https://your-supabase-url.supabase.co/api/admin/permissions/${permissionId}`, {
    method: 'DELETE'
  });
  return response.json();
}
