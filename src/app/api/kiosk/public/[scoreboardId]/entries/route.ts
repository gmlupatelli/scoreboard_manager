import { NextRequest, NextResponse } from 'next/server';
import { getAnonClient, getServiceRoleClient } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// No-cache headers for dynamic data - always fetch fresh
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * GET /api/kiosk/public/[scoreboardId]/entries
 * Get only scoreboard entries (dynamic data)
 * Fetched independently when entries change
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string }> }
) {
  try {
    const { scoreboardId } = await params;

    // Use service role client to bypass RLS
    const serviceClient = getServiceRoleClient();
    const supabase = serviceClient || getAnonClient();

    // Get scoreboard to determine sort order
    const { data: scoreboard, error: scoreboardError } = await supabase
      .from('scoreboards')
      .select('id, sort_order')
      .eq('id', scoreboardId)
      .single();

    if (scoreboardError || !scoreboard) {
      return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
    }

    // Get scoreboard entries
    const { data: entries, error: entriesError } = await supabase
      .from('scoreboard_entries')
      .select('*')
      .eq('scoreboard_id', scoreboardId)
      .order('score', { ascending: scoreboard.sort_order === 'asc' });

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        entries: entries || [],
      },
      { headers: noCacheHeaders }
    );
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
