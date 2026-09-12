import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, getSupabaseService } from '../../../../lib/supabase-server';

/**
 * Admin user management API route.
 * GET: List all users (admin only)
 * PATCH: Update user status or adjust credits (admin only)
 */

async function requireAdmin() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, status')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin || profile.status === 'blocked') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }), supabase: null };
  }

  return { error: null, supabase };
}

export async function GET() {
  try {
    const { error, supabase } = await requireAdmin();
    if (error || !supabase) return error;

    const service = getSupabaseService();

    // Get all profiles with computed stats
    const { data: profiles, error: profilesError } = await service
      .from('profiles')
      .select('id, email, full_name, plan_type, credits_used, status, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });

    // Get invoice stats per user
    const { data: workspaces } = await service
      .from('workspaces')
      .select('id, owner_id');

    const wsByOwner: Record<string, string> = {};
    (workspaces || []).forEach((ws: Record<string, string>) => {
      wsByOwner[ws.owner_id] = ws.id;
    });

    const wsIds = Object.values(wsByOwner);
    const { data: invoices } = await service
      .from('invoices')
      .select('workspace_id, amount, status')
      .in('workspace_id', wsIds);

    // Compute stats per workspace
    const stats: Record<string, { count: number; recovered: number }> = {};
    (invoices || []).forEach((inv: Record<string, unknown>) => {
      const wsId = inv.workspace_id as string;
      if (!stats[wsId]) stats[wsId] = { count: 0, recovered: 0 };
      stats[wsId].count++;
      if (inv.status === 'paid') {
        stats[wsId].recovered += Number(inv.amount);
      }
    });

    const users = (profiles || []).map((p: Record<string, unknown>) => {
      const wsId = wsByOwner[p.id as string];
      const wsStats = wsId ? stats[wsId] : null;
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        plan: p.plan_type,
        credits_used: p.credits_used,
        status: p.status,
        created_at: p.created_at,
        invoice_count: wsStats?.count || 0,
        total_recovered: wsStats?.recovered || 0,
      };
    });

    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { error, supabase } = await requireAdmin();
    if (error || !supabase) return error;

    const body = await request.json();
    const { id, status, credits_adjustment } = body;

    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    const service = getSupabaseService();

    if (status) {
      const { error: updateError } = await service
        .from('profiles')
        .update({ status })
        .eq('id', id);
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (credits_adjustment !== undefined) {
      const { data: profile } = await service
        .from('profiles')
        .select('credits_used')
        .eq('id', id)
        .single();

      if (profile) {
        const newCredits = Math.max(0, profile.credits_used - credits_adjustment);
        await service.from('profiles').update({ credits_used: newCredits }).eq('id', id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
