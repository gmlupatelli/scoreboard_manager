import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { getAnonClient, getServiceRoleClient } from '@/lib/supabase/apiClient';
import { getSupporterStatus } from '@/lib/supabase/subscriptionHelpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string }> }
) {
  try {
    const { scoreboardId } = await params;
    const serviceClient = getServiceRoleClient();
    const readClient = (serviceClient || getAnonClient()) as SupabaseClient<Database>;

    const { data: scoreboard, error: scoreboardError } = await readClient
      .from('scoreboards')
      .select(
        'id, owner_id, title, description, sort_order, visibility, score_type, time_format, custom_styles, style_scope, is_locked, created_at, updated_at'
      )
      .eq('id', scoreboardId)
      .single();

    if (scoreboardError || !scoreboard) {
      return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
    }

    if (scoreboard.visibility !== 'public') {
      return NextResponse.json({ error: 'Scoreboard not public' }, { status: 403 });
    }

    const { data: entries, error: entriesError } = await readClient
      .from('scoreboard_entries')
      .select('*')
      .eq('scoreboard_id', scoreboardId);

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    let showPoweredBy = true;
    if (serviceClient) {
      const isSupporter = await getSupporterStatus(serviceClient, scoreboard.owner_id);
      showPoweredBy = !isSupporter;
    }

    return NextResponse.json(
      { scoreboard, entries: entries || [], showPoweredBy },
      { status: 200 }
    );
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
