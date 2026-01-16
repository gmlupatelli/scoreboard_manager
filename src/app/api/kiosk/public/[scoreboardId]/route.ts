import { NextRequest, NextResponse } from 'next/server';
import { getAnonClient, getServiceRoleClient } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Cache-control headers for all responses
const noCacheHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Signed URL expiry time: 1 hour (kiosk can refresh periodically)
const SIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * GET /api/kiosk/public/[scoreboardId]
 * Get kiosk data for viewing (no authentication required)
 * Kiosk view works for both public and private scoreboards when kiosk mode is enabled
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string }> }
) {
  try {
    const { scoreboardId } = await params;
    
    // Use service role client to bypass RLS - kiosk access is controlled by kiosk config, not visibility
    const serviceClient = getServiceRoleClient();
    const supabase = serviceClient || getAnonClient();

    // Get scoreboard (service role bypasses RLS for private scoreboards)
    const { data: scoreboard, error: scoreboardError } = await supabase
      .from('scoreboards')
      .select('id, title, description, visibility, score_type, sort_order, time_format, custom_styles')
      .eq('id', scoreboardId)
      .single();

    if (scoreboardError || !scoreboard) {
      return NextResponse.json({ error: 'Scoreboard not found' }, { status: 404 });
    }

    // Kiosk view works for both public and private scoreboards - access is controlled by kiosk config

    // Get kiosk config
    const { data: config, error: configError } = await supabase
      .from('kiosk_configs')
      .select('*')
      .eq('scoreboard_id', scoreboardId)
      .single();

    if (configError && configError.code !== 'PGRST116') {
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }

    if (!config || !config.enabled) {
      return NextResponse.json({ error: 'Kiosk mode is not enabled' }, { status: 404 });
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

    // Generate signed URLs for image slides (requires service role for private bucket)
    const slidesWithSignedUrls = await Promise.all(
      (slides || []).map(async (slide) => {
        if (slide.slide_type === 'image' && slide.image_url) {
          // If no service client, we can't generate signed URLs - return null
          if (!serviceClient) {
            return {
              ...slide,
              image_url: null,
            };
          }

          // image_url stores the storage path, generate a signed URL
          const { data: signedUrlData } = await serviceClient.storage
            .from('kiosk-slides')
            .createSignedUrl(slide.image_url, SIGNED_URL_EXPIRY_SECONDS);

          return {
            ...slide,
            image_url: signedUrlData?.signedUrl || null,
          };
        }
        return slide;
      })
    );

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
        scoreboard,
        config: {
          id: config.id,
          slideDurationSeconds: config.slide_duration_seconds,
          scoreboardPosition: config.scoreboard_position,
          hasPinProtection: !!config.pin_code,
          signedUrlExpirySeconds: SIGNED_URL_EXPIRY_SECONDS,
        },
        slides: slidesWithSignedUrls,
        entries: entries || [],
      },
      { headers: noCacheHeaders }
    );
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/kiosk/public/[scoreboardId]
 * Verify PIN for protected kiosks (works for both public and private scoreboards)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scoreboardId: string }> }
) {
  try {
    const { scoreboardId } = await params;
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json({ error: 'PIN required' }, { status: 400 });
    }

    // Use service role client to bypass RLS for private scoreboards
    const serviceClient = getServiceRoleClient();
    const supabase = serviceClient || getAnonClient();

    // Get kiosk config with PIN
    const { data: config, error: configError } = await supabase
      .from('kiosk_configs')
      .select('pin_code')
      .eq('scoreboard_id', scoreboardId)
      .single();

    if (configError || !config) {
      return NextResponse.json({ error: 'Kiosk not found' }, { status: 404 });
    }

    // Simple PIN comparison (in production, you'd want to hash the PIN)
    if (config.pin_code !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    return NextResponse.json({ verified: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
