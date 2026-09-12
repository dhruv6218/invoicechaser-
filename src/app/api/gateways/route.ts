import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '../../../lib/supabase-server';
import { encrypt } from '../../../lib/crypto';

/**
 * Gateway management API route.
 * POST: Create a new gateway (encrypts API key server-side)
 * DELETE: Remove a gateway
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { workspace_id, type, label, api_key, static_url } = body;

    if (!workspace_id || !type || !label) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the workspace belongs to the user
    const { data: ws } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('owner_id', user.id)
      .single();
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const { data, error } = await supabase
      .from('gateways')
      .insert({
        workspace_id,
        type,
        label,
        api_key_enc: api_key ? encrypt(api_key) : null,
        static_url: static_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ gateway: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Missing gateway id' }, { status: 400 });

    // RLS will ensure the user can only delete their own gateways
    const { error } = await supabase.from('gateways').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
