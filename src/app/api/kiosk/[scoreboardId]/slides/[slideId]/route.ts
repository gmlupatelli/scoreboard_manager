import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, extractBearerToken } from '@/lib/supabase/apiClient';

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

    // Get the slide to find the image path
    const { data: slide } = await supabase
      .from('kiosk_slides')
      .select('image_url')
      .eq('id', slideId)
      .single();

    // Delete the slide
    const { error: deleteError } = await supabase.from('kiosk_slides').delete().eq('id', slideId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // If there was an image, try to delete it from storage
    if (slide?.image_url) {
      // Extract the path from the URL
      const urlParts = slide.image_url.split('/kiosk-slides/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('kiosk-slides').remove([filePath]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
