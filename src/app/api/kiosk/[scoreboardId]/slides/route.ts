import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/kiosk/[scoreboardId]/slides
 * Add a new slide to the kiosk carousel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string }> }
) {
  try {
    const { scoreboardId } = await params;
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

    // Get or create kiosk config
    let configId: string;
    const { data: existingConfig } = await supabase
      .from('kiosk_configs')
      .select('id')
      .eq('scoreboard_id', scoreboardId)
      .single();

    if (!existingConfig) {
      const { data: newConfig, error: createError } = await supabase
        .from('kiosk_configs')
        .insert({
          scoreboard_id: scoreboardId,
          slide_duration_seconds: 10,
          scoreboard_position: 0,
          enabled: false,
        })
        .select('id')
        .single();

      if (createError || !newConfig) {
        return NextResponse.json(
          { error: createError?.message || 'Failed to create config' },
          { status: 500 }
        );
      }
      configId = newConfig.id;
    } else {
      configId = existingConfig.id;
    }

    const body = await request.json();
    const { slideType, imageUrl, thumbnailUrl, durationOverrideSeconds, fileName, fileSize } = body;

    // Validate slide type
    if (!slideType || !['image', 'scoreboard'].includes(slideType)) {
      return NextResponse.json({ error: 'Invalid slide type' }, { status: 400 });
    }

    // Get next position
    const { data: existingSlides } = await supabase
      .from('kiosk_slides')
      .select('position')
      .eq('kiosk_config_id', configId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition =
      existingSlides && existingSlides.length > 0 ? existingSlides[0].position + 1 : 0;

    // Check slide limit (max 20)
    const { count } = await supabase
      .from('kiosk_slides')
      .select('*', { count: 'exact', head: true })
      .eq('kiosk_config_id', configId);

    if (count && count >= 20) {
      return NextResponse.json({ error: 'Maximum of 20 slides allowed' }, { status: 400 });
    }

    // Insert slide
    const { data: slide, error: slideError } = await supabase
      .from('kiosk_slides')
      .insert({
        kiosk_config_id: configId,
        position: nextPosition,
        slide_type: slideType,
        image_url: imageUrl ?? null,
        thumbnail_url: thumbnailUrl ?? null,
        duration_override_seconds: durationOverrideSeconds ?? null,
        file_name: fileName ?? null,
        file_size: fileSize ?? null,
      })
      .select()
      .single();

    if (slideError) {
      return NextResponse.json({ error: slideError.message }, { status: 500 });
    }

    return NextResponse.json({ slide }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/kiosk/[scoreboardId]/slides
 * Reorder slides (update all positions)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string }> }
) {
  try {
    const { scoreboardId } = await params;
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
    const { slides } = body;

    if (!Array.isArray(slides)) {
      return NextResponse.json({ error: 'Invalid slides array' }, { status: 400 });
    }

    // Update each slide's position
    for (const slide of slides) {
      if (!slide.id || typeof slide.position !== 'number') {
        continue;
      }

      await supabase.from('kiosk_slides').update({ position: slide.position }).eq('id', slide.id);
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
