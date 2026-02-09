import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { getSupporterStatus } from '@/lib/supabase/subscriptionHelpers';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

interface BulkEntry {
  name: string;
  score: number;
  details?: string | null;
}

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

    const isSupporter = await getSupporterStatus(readClient, scoreboard.owner_id);

    if (!isSupporter && (scoreboard.is_locked || scoreboard.visibility === 'private')) {
      return NextResponse.json(
        {
          error: 'locked',
          message: 'This scoreboard is locked on the Free plan.',
          upgrade_url: '/supporter-plan',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { entries } = body as { entries?: BulkEntry[] };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'Missing or empty entries array' }, { status: 400 });
    }

    // Validate all entries
    for (const entry of entries) {
      if (!entry.name || entry.score === undefined) {
        return NextResponse.json({ error: 'Each entry must have name and score' }, { status: 400 });
      }
    }

    // Check entry limit for free users
    if (!isSupporter) {
      const { count } = await readClient
        .from('scoreboard_entries')
        .select('*', { count: 'exact', head: true })
        .eq('scoreboard_id', id);

      const currentCount = count || 0;
      if (currentCount + entries.length > 50) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: `Import would exceed the 50-entry limit. Currently ${currentCount} entries, trying to add ${entries.length}.`,
            upgrade_url: '/supporter-plan',
          },
          { status: 403 }
        );
      }
    }

    const writeClient = serviceClient || supabase;
    const insertData = entries.map((entry) => ({
      scoreboard_id: id,
      name: entry.name,
      score: entry.score,
      details: entry.details ?? null,
    }));

    const { data: createdEntries, error: insertError } = await writeClient
      .from('scoreboard_entries')
      .insert(insertData)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(
      { entries: createdEntries, count: createdEntries?.length || 0 },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
