import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { getSupporterStatus } from '@/lib/supabase/subscriptionHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = extractBearerToken(request.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAuthClient(token);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: scoreboard, error: scoreboardError } = await supabase
      .from('scoreboards')
      .select('id, owner_id, visibility, is_locked')
      .eq('id', id)
      .single();

    if (scoreboardError || !scoreboard) {
      return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
    }

    if (scoreboard.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    const readClient = (serviceClient || supabase) as SupabaseClient<Database>;

    const isSupporter = await getSupporterStatus(readClient, user.id);

    if (isSupporter) {
      return NextResponse.json({ scoreboard }, { status: 200 });
    }

    if (scoreboard.visibility !== 'public') {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: 'Private scoreboards require a Supporter plan.',
          upgrade_url: '/supporter-plan',
        },
        { status: 403 }
      );
    }

    if (!scoreboard.is_locked) {
      return NextResponse.json({ scoreboard }, { status: 200 });
    }

    const { count } = await readClient
      .from('scoreboards')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('visibility', 'public')
      .eq('is_locked', false);

    if (count && count >= 2) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: "You've reached the maximum of 2 public scoreboards on the free plan.",
          upgrade_url: '/supporter-plan',
        },
        { status: 403 }
      );
    }

    const writeClient = serviceClient || supabase;
    const { data: updatedScoreboard, error: updateError } = await writeClient
      .from('scoreboards')
      .update({ is_locked: false })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ scoreboard: updatedScoreboard }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
