import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PUT /api/kiosk/[scoreboardId]/slides/[slideId]
 * Update a specific slide
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string; slideId: string }> }
) {
  try {
    const { scoreboardId, slideId } = await params;
    const token = extractBearerToken(request.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAuthClient(token);

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check scoreboard ownership
    const { data: scoreboard, error: scoreboardError } = await supabase
      .from('scoreboards')
      .select('id, owner_id')
      .eq('id', scoreboardId)
      .single();

    if (scoreboardError || !scoreboard) {
      return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
    }

    if (scoreboard.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { position, durationOverrideSeconds } = body;

    const updateData: Record<string, unknown> = {};
    if (position !== undefined) updateData.position = position;
    if (durationOverrideSeconds !== undefined)
      updateData.duration_override_seconds = durationOverrideSeconds;

    const { data: slide, error: updateError } = await supabase
      .from('kiosk_slides')
      .update(updateData)
      .eq('id', slideId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ slide });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/kiosk/[scoreboardId]/slides/[slideId]
 * Delete a specific slide
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string; slideId: string }> }
) {
  try {
    const { scoreboardId, slideId } = await params;
    const token = extractBearerToken(request.headers.get('Authorization'));

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAuthClient(token);

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check scoreboard ownership
    const { data: scoreboard, error: scoreboardError } = await supabase
      .from('scoreboards')
      .select('id, owner_id')
      .eq('id', scoreboardId)
      .single();

    if (scoreboardError || !scoreboard) {
      return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
    }

    if (scoreboard.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    const writeClient = serviceClient || supabase;

    // Resolve kiosk config for this scoreboard
    const { data: kioskConfig } = await writeClient
      .from('kiosk_configs')
      .select('id')
      .eq('scoreboard_id', scoreboardId)
      .single();

    if (!kioskConfig) {
      return NextResponse.json({ error: 'Kiosk config not found' }, { status: 404 });
    }

    // Get the slide to find the image and thumbnail paths
    const { data: slide } = await writeClient
      .from('kiosk_slides')
      .select('image_url, thumbnail_url')
      .eq('id', slideId)
      .eq('kiosk_config_id', kioskConfig.id)
      .maybeSingle();

    // Delete the slide
    const { data: deletedSlides, error: deleteError } = await writeClient
      .from('kiosk_slides')
      .delete()
      .eq('id', slideId)
      .eq('kiosk_config_id', kioskConfig.id)
      .select('id');

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const deletedCount = deletedSlides?.length ?? 0;

    // Delete files from storage
    // Both image_url and thumbnail_url store raw storage paths
    const filesToDelete: string[] = [];

    if (slide?.image_url && !slide.image_url.startsWith('http')) {
      filesToDelete.push(slide.image_url);
    }

    if (slide?.thumbnail_url && !slide.thumbnail_url.startsWith('http')) {
      filesToDelete.push(slide.thumbnail_url);
    }

    if (filesToDelete.length > 0) {
      await writeClient.storage.from('kiosk-slides').remove(filesToDelete);
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
