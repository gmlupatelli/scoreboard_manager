import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('Authorization'));
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const authClient = getAuthClient(token);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = getServiceRoleClient();
    const dbClient = serviceClient || authClient;

    const { data: profile } = await dbClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'system_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: inviterIds, error: inviterError } = await dbClient
      .from('invitations')
      .select('inviter_id')
      .not('inviter_id', 'is', null);

    if (inviterError) {
      return NextResponse.json({ error: inviterError.message }, { status: 500 });
    }

    const uniqueInviterIds = Array.from(new Set(inviterIds?.map(i => i.inviter_id).filter(Boolean)));

    if (uniqueInviterIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: inviters, error: profilesError } = await dbClient
      .from('user_profiles')
      .select('id, email, full_name')
      .in('id', uniqueInviterIds)
      .order('full_name', { ascending: true });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    return NextResponse.json(inviters || []);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inviters' }, { status: 500 });
  }
}
