import { NextRequest, NextResponse } from 'next/server';
import { getAuthClient, getServiceRoleClient, extractBearerToken } from '@/lib/supabase/apiClient';
import { isSupporterSubscription } from '@/lib/supabase/subscriptionHelpers';
import { STYLE_PRESETS } from '@/utils/stylePresets';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
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

    if (!title || !visibility || !sortOrder) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    if (!isSupporter && visibility === 'private') {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: 'Private scoreboards require a Supporter plan.',
          upgrade_url: '/supporter-plan',
        },
        { status: 403 }
      );
    }

    if (!isSupporter) {
      const { count } = await readClient
        .from('scoreboards')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('visibility', 'public')
        .eq('is_locked', false);

      if (count && count >= 2) {
        return NextResponse.json(
          {
            error: 'limit_reached',
            message: "You've reached the maximum of 2 public scoreboards on the free plan.",
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

    const writeClient = serviceClient || supabase;
    const { data: scoreboard, error } = await writeClient
      .from('scoreboards')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        description: description || null,
        sort_order: sortOrder,
        visibility,
        score_type: scoreType || 'number',
        time_format: timeFormat || null,
        custom_styles: customStyles || STYLE_PRESETS.light,
        style_scope: styleScope || 'both',
        is_locked: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ scoreboard }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
