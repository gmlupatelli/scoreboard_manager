import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Signed URL expiry for preview (1 hour)
const SIGNED_URL_EXPIRY_SECONDS = 3600;

/**
 * POST /api/kiosk/[scoreboardId]/sign-urls
 * Sign storage paths for kiosk slides
 *
 * Request body:
 * {
 *   paths: string[] // Array of storage paths to sign (e.g., "userId/scoreboardId/filename.jpg")
 * }
 *
 * Response:
 * {
 *   signedUrls: Record<storagePath, signedUrl>
 * }
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

    const body = await request.json();
    const { paths } = body;

    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'Invalid paths array' }, { status: 400 });
    }

    // Get service role client for signing
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Service role client not available' },
        { status: 500 }
      );
    }

    // Sign all paths
    const signedUrls: Record<string, string> = {};

    for (const path of paths) {
      if (typeof path !== 'string' || !path.trim()) {
        continue;
      }

      try {
        const { data: signedData, error: signError } = await serviceClient.storage
          .from('kiosk-slides')
          .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

        if (signError || !signedData?.signedUrl) {
          console.error(`Failed to sign path ${path}:`, signError);
          // Continue with other paths, but mark this one as failed
          signedUrls[path] = '';
        } else {
          signedUrls[path] = signedData.signedUrl;
        }
      } catch (error) {
        console.error(`Exception signing path ${path}:`, error);
        signedUrls[path] = '';
      }
    }

    return NextResponse.json(
      { signedUrls },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Sign URLs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
