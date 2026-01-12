import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Test Cleanup API Route
 * Deletes test data for automated test users: admin@example.com, john@example.com, sarah@example.com
 * Does NOT clean manual test users: siteadmin@example.com, jane@example.com
 * Protected by TEST_CLEANUP_API_KEY environment variable
 * 
 * Usage:
 * POST /api/test/cleanup
 * Headers: { 'x-cleanup-api-key': 'your-key-here' }
 */

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate API key
    const apiKey = request.headers.get('x-cleanup-api-key');
    const expectedKey = process.env.TEST_CLEANUP_API_KEY;

    if (!expectedKey) {
      return NextResponse.json(
        { error: 'Cleanup API not configured' },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    // 2. Get service role client
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Service client configuration error' },
        { status: 500 }
      );
    }

    // 3. Get user IDs for automated test users (admin, john, sarah)
    const { data: profiles, error: profilesError } = await serviceClient
      .from('user_profiles')
      .select('id, email')
      .in('email', ['admin@example.com', 'john@example.com', 'sarah@example.com']);

    if (profilesError) {
      return NextResponse.json(
        { error: `Failed to fetch user profiles: ${profilesError.message}` },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: 'No test users found to clean up',
        deletedEntries: 0,
        deletedScoreboards: 0,
        deletedInvitations: 0,
      });
    }

    const userIds = profiles.map((p) => p.id);
    const userEmails = profiles.map((p) => p.email);

    let deletedEntries = 0;
    let deletedScoreboards = 0;
    let deletedInvitations = 0;

    // 4. Delete in cascade-safe order: entries → scoreboards → invitations

    // Step 4a: Get all scoreboard IDs for these users
    const { data: scoreboards, error: scoreboardsFetchError } = await serviceClient
      .from('scoreboards')
      .select('id')
      .in('owner_id', userIds);

    if (scoreboardsFetchError) {
      return NextResponse.json(
        { error: `Failed to fetch scoreboards: ${scoreboardsFetchError.message}` },
        { status: 500 }
      );
    }

    const scoreboardIds = scoreboards?.map((s) => s.id) || [];

    // Step 4b: Delete scoreboard entries
    if (scoreboardIds.length > 0) {
      const { error: entriesError, count: entriesCount } = await serviceClient
        .from('scoreboard_entries')
        .delete()
        .in('scoreboard_id', scoreboardIds);

      if (entriesError) {
        return NextResponse.json(
          { error: `Failed to delete entries: ${entriesError.message}` },
          { status: 500 }
        );
      }

      deletedEntries = entriesCount || 0;
    }

    // Step 4c: Delete scoreboards
    const { error: scoreboardsError, count: scoreboardsCount } = await serviceClient
      .from('scoreboards')
      .delete()
      .in('owner_id', userIds);

    if (scoreboardsError) {
      return NextResponse.json(
        { error: `Failed to delete scoreboards: ${scoreboardsError.message}` },
        { status: 500 }
      );
    }

    deletedScoreboards = scoreboardsCount || 0;

    // Step 4d: Delete invitations sent BY these users
    const { error: inviterError, count: inviterCount } = await serviceClient
      .from('invitations')
      .delete()
      .in('inviter_id', userIds);

    if (inviterError) {
      return NextResponse.json(
        { error: `Failed to delete invitations by user: ${inviterError.message}` },
        { status: 500 }
      );
    }

    // Step 4e: Delete invitations sent TO these users
    const { error: inviteeError, count: inviteeCount } = await serviceClient
      .from('invitations')
      .delete()
      .in('invitee_email', userEmails);

    if (inviteeError) {
      return NextResponse.json(
        { error: `Failed to delete invitations to user: ${inviteeError.message}` },
        { status: 500 }
      );
    }

    deletedInvitations = (inviterCount || 0) + (inviteeCount || 0);

    // 5. Return cleanup summary
    return NextResponse.json({
      message: 'Test data cleaned successfully',
      cleanedUsers: userEmails,
      deletedEntries,
      deletedScoreboards,
      deletedInvitations,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Test cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during cleanup' },
      { status: 500 }
    );
  }
}
