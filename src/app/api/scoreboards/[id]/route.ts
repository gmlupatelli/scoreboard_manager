import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { isSupporterSubscription, getSupporterStatus } from '@/lib/supabase/subscriptionHelpers';
import { Database } from '@/types/database.types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/**
 * GET /api/scoreboards/[id]
 * Retrieve a scoreboard with private-access gating for non-supporters
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .select('*')
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
    const isSupporter = await getSupporterStatus(readClient, user.id);

    if (!isSupporter && scoreboard.visibility === 'private') {
      return NextResponse.json(
        {
          error: 'locked',
          message: 'Private scoreboards require a Supporter plan.',
          upgrade_url: '/supporter-plan',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ scoreboard, isSupporter }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json();
    const {
      title,
      description,
      visibility,
      scoreType,
      sortOrder,
      timeFormat,
      customStyles,
      styleScope,
    } = body as {
      title?: string;
      description?: string | null;
      visibility?: 'public' | 'private';
      scoreType?: 'number' | 'time';
      sortOrder?: 'asc' | 'desc';
      timeFormat?: string | null;
      customStyles?: Record<string, unknown> | null;
      styleScope?: 'main' | 'embed' | 'both';
    };

    const serviceClient = getServiceRoleClient();
    const readClient = serviceClient || supabase;

    const { data: subscription } = await readClient
      .from('subscriptions')
      .select('status, cancelled_at, is_gifted, gifted_expires_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isSupporter = subscription ? isSupporterSubscription(subscription) : false;

    if (!isSupporter) {
      if (scoreboard.is_locked || scoreboard.visibility === 'private') {
        return NextResponse.json(
          {
            error: 'locked',
            message: 'This scoreboard is locked on the Free plan.',
            upgrade_url: '/supporter-plan',
          },
          { status: 403 }
        );
      }

      if (visibility === 'private') {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: 'Private scoreboards require a Supporter plan.',
            upgrade_url: '/supporter-plan',
          },
          { status: 403 }
        );
      }

      if (customStyles && customStyles.preset === 'custom') {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: 'Custom themes require a Supporter plan.',
            upgrade_url: '/supporter-plan',
          },
          { status: 403 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (scoreType !== undefined) updateData.score_type = scoreType;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (timeFormat !== undefined) updateData.time_format = timeFormat;
    if (customStyles !== undefined) updateData.custom_styles = customStyles;
    if (styleScope !== undefined) updateData.style_scope = styleScope;

    const writeClient = serviceClient || supabase;
    const { data: updatedScoreboard, error: updateError } = await writeClient
      .from('scoreboards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ scoreboard: updatedScoreboard }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      .select('id, owner_id')
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

    const { data: kioskConfig } = await writeClient
      .from('kiosk_configs')
      .select('id')
      .eq('scoreboard_id', id)
      .single();

    if (kioskConfig) {
      const { data: slides } = await writeClient
        .from('kiosk_slides')
        .select('image_url, thumbnail_url')
        .eq('kiosk_config_id', kioskConfig.id);

      if (slides && slides.length > 0) {
        const filesToDelete: string[] = [];

        for (const slide of slides) {
          if (slide.image_url && !slide.image_url.startsWith('http')) {
            filesToDelete.push(slide.image_url);
          }
          if (slide.thumbnail_url && !slide.thumbnail_url.startsWith('http')) {
            filesToDelete.push(slide.thumbnail_url);
          }
        }

        if (filesToDelete.length > 0 && serviceClient) {
          await serviceClient.storage.from('kiosk-slides').remove(filesToDelete);
        }
      }
    }

    const { error: deleteError } = await writeClient.from('scoreboards').delete().eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
