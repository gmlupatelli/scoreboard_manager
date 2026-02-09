import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { getSupporterStatus } from '@/lib/supabase/subscriptionHelpers';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;
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
    const { name, score, details } = body as {
      name?: string;
      score?: number;
      details?: string | null;
    };

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (score !== undefined) updateData.score = score;
    if (details !== undefined) updateData.details = details;

    const writeClient = serviceClient || supabase;
    const { data: entry, error: updateError } = await writeClient
      .from('scoreboard_entries')
      .update(updateData)
      .eq('id', entryId)
      .eq('scoreboard_id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ entry }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;
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
    const writeClient = serviceClient || supabase;
    const { error: deleteError } = await writeClient
      .from('scoreboard_entries')
      .delete()
      .eq('id', entryId)
      .eq('scoreboard_id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
