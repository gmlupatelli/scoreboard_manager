import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Signed URL expiry for management preview (1 hour)
const SIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * GET /api/kiosk/[scoreboardId]
 * Get kiosk configuration and slides for a scoreboard
 */
export async function GET(
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

    // Verify user owns the scoreboard
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

    // Get kiosk config
    const { data: config, error: configError } = await supabase
      .from('kiosk_configs')
      .select('*')
      .eq('scoreboard_id', scoreboardId)
      .single();

    // If no config exists, return default values
    if (configError && configError.code === 'PGRST116') {
      return NextResponse.json({
        config: null,
        slides: [],
      });
    }

    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    // Get slides
    const { data: slides, error: slidesError } = await supabase
      .from('kiosk_slides')
      .select('*')
      .eq('kiosk_config_id', config.id)
      .order('position', { ascending: true });

    if (slidesError) {
      return NextResponse.json({ error: slidesError.message }, { status: 500 });
    }

    // Generate signed URLs for image slides (thumbnails for management UI)
    const serviceClient = getServiceRoleClient();
    const slidesWithSignedUrls = await Promise.all(
      (slides || []).map(async (slide) => {
        if (slide.slide_type === 'image' && serviceClient) {
          const result = { ...slide };

          // Generate signed URL for thumbnail (used in management UI)
          if (slide.thumbnail_url) {
            const { data: thumbSignedData } = await serviceClient.storage
              .from('kiosk-slides')
              .createSignedUrl(slide.thumbnail_url, SIGNED_URL_EXPIRY_SECONDS);
            result.thumbnail_url = thumbSignedData?.signedUrl || slide.thumbnail_url;
          }

          // Generate signed URL for original image (fallback if no thumbnail)
          if (slide.image_url) {
            const { data: signedUrlData } = await serviceClient.storage
              .from('kiosk-slides')
              .createSignedUrl(slide.image_url, SIGNED_URL_EXPIRY_SECONDS);
            result.image_url = signedUrlData?.signedUrl || slide.image_url;
          }

          return result;
        }
        return slide;
      })
    );

    return NextResponse.json({
      config,
      slides: slidesWithSignedUrls,
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/kiosk/[scoreboardId]
 * Create or update kiosk configuration
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
    const { slideDurationSeconds, scoreboardPosition, enabled, pinCode } = body;

    // Check if config exists
    const { data: existingConfig } = await supabase
      .from('kiosk_configs')
      .select('id')
      .eq('scoreboard_id', scoreboardId)
      .single();

    let result;

    if (existingConfig) {
      // Update existing config
      const updateData: Record<string, unknown> = {};
      if (slideDurationSeconds !== undefined)
        updateData.slide_duration_seconds = slideDurationSeconds;
      if (scoreboardPosition !== undefined) updateData.scoreboard_position = scoreboardPosition;
      if (enabled !== undefined) updateData.enabled = enabled;
      if (pinCode !== undefined) updateData.pin_code = pinCode;

      result = await supabase
        .from('kiosk_configs')
        .update(updateData)
        .eq('id', existingConfig.id)
        .select()
        .single();
    } else {
      // Create new config
      result = await supabase
        .from('kiosk_configs')
        .insert({
          scoreboard_id: scoreboardId,
          slide_duration_seconds: slideDurationSeconds ?? 10,
          scoreboard_position: scoreboardPosition ?? 0,
          enabled: enabled ?? false,
          pin_code: pinCode ?? null,
        })
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ config: result.data });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
