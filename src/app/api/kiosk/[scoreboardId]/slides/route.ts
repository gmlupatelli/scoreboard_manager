import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Signed URL expiry for preview (1 hour)
const SIGNED_URL_EXPIRY_SECONDS = 3600;

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

    const serviceClient = getServiceRoleClient();
    const writeClient = serviceClient || supabase;

    // Get or create kiosk config
    let configId: string;
    const { data: existingConfig } = await writeClient
      .from('kiosk_configs')
      .select('id')
      .eq('scoreboard_id', scoreboardId)
      .single();

    if (!existingConfig) {
      const { data: newConfig, error: createError } = await writeClient
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
    const { data: existingSlides } = await writeClient
      .from('kiosk_slides')
      .select('position')
      .eq('kiosk_config_id', configId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition =
      existingSlides && existingSlides.length > 0 ? existingSlides[0].position + 1 : 0;

    // Check slide limit (max 20)
    const { count } = await writeClient
      .from('kiosk_slides')
      .select('*', { count: 'exact', head: true })
      .eq('kiosk_config_id', configId);

    if (count && count >= 20) {
      return NextResponse.json({ error: 'Maximum of 20 slides allowed' }, { status: 400 });
    }

    // Prevent duplicate scoreboard slides
    if (slideType === 'scoreboard') {
      const { data: existingScoreboardSlide } = await writeClient
        .from('kiosk_slides')
        .select('id')
        .eq('kiosk_config_id', configId)
        .eq('slide_type', 'scoreboard')
        .limit(1)
        .single();

      if (existingScoreboardSlide) {
        return NextResponse.json(
          { error: 'Scoreboard slide already exists', existingSlideId: existingScoreboardSlide.id },
          { status: 409 }
        );
      }
    }

    // Insert slide
    const { data: slide, error: slideError } = await writeClient
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

    // Link file registry entries to this slide (for orphan tracking)
    if (slide.slide_type === 'image') {
      const pathsToLink = [slide.image_url, slide.thumbnail_url].filter(Boolean);
      if (pathsToLink.length > 0) {
        await writeClient
          .from('kiosk_file_registry')
          .update({ slide_id: slide.id })
          .in('storage_path', pathsToLink);
      }
    }

    // Generate signed URLs for image slides (thumbnail for management UI)
    let slideWithSignedUrl = slide;
    if (slide.slide_type === 'image') {
      const serviceClient = getServiceRoleClient();
      if (serviceClient) {
        const result = { ...slide };

        // Generate signed URL for thumbnail
        if (slide.thumbnail_url) {
          const { data: thumbSignedData } = await serviceClient.storage
            .from('kiosk-slides')
            .createSignedUrl(slide.thumbnail_url, SIGNED_URL_EXPIRY_SECONDS);
          // Only use signed URL if successful, otherwise null
          result.thumbnail_url = thumbSignedData?.signedUrl || null;
        }

        // Generate signed URL for original image (fallback)
        if (slide.image_url) {
          const { data: signedUrlData } = await serviceClient.storage
            .from('kiosk-slides')
            .createSignedUrl(slide.image_url, SIGNED_URL_EXPIRY_SECONDS);
          // Only use signed URL if successful, otherwise null
          result.image_url = signedUrlData?.signedUrl || null;
        }

        slideWithSignedUrl = result;
      } else {
        // No service client - return null URLs to show fallback in UI
        slideWithSignedUrl = {
          ...slide,
          image_url: null,
          thumbnail_url: null,
        };
      }
    }

    return NextResponse.json({ slide: slideWithSignedUrl }, { status: 201 });
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

    // Use service role client to bypass RLS for bulk updates
    const serviceClient = getServiceRoleClient();
    const updateClient = serviceClient || supabase;

    // First, get the kiosk config for this scoreboard
    const { data: kioskConfig } = await updateClient
      .from('kiosk_configs')
      .select('id')
      .eq('scoreboard_id', scoreboardId)
      .single();

    if (!kioskConfig) {
      return NextResponse.json({ error: 'Kiosk config not found' }, { status: 404 });
    }

    // Two-phase update to avoid unique constraint violation on (kiosk_config_id, position)
    // Phase 1: Set all positions to high temporary values (position >= 0 required by check constraint)
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      if (!slide.id || typeof slide.position !== 'number') {
        continue;
      }

      const tempPosition = 1000 + i; // Use high positive numbers to avoid conflicts
      await updateClient
        .from('kiosk_slides')
        .update({ position: tempPosition })
        .eq('id', slide.id)
        .eq('kiosk_config_id', kioskConfig.id);
    }

    // Phase 2: Set all positions to their final values
    for (const slide of slides) {
      if (!slide.id || typeof slide.position !== 'number') {
        continue;
      }

      await updateClient
        .from('kiosk_slides')
        .update({ position: slide.position })
        .eq('id', slide.id)
        .eq('kiosk_config_id', kioskConfig.id);
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
