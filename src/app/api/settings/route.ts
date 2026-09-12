import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, getSupabaseService } from '../../../lib/supabase-server';

/**
 * Authenticated settings API.
 * PATCH: Update profile (full_name) and workspace name (business_name).
 * DELETE: Delete user account (cascades to all data).
 */

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { full_name, business_name } = body;

    // Update profile
    if (full_name) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', user.id);
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

      // Also update user metadata
      await supabase.auth.updateUser({ data: { full_name } });
    }

    // Update workspace name (business_name)
    if (business_name) {
      const { error: wsError } = await supabase
        .from('workspaces')
        .update({ name: business_name })
        .eq('owner_id', user.id);
      if (wsError) return NextResponse.json({ error: wsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Use service role to delete the user (cascades to all data via FK on delete cascade)
    const service = getSupabaseService();
    const { error } = await service.auth.admin.deleteUser(user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
