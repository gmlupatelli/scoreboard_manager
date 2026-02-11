import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  getAuthClient,
  getServiceRoleClient,
  extractBearerToken,
  getAnonClient,
} from '@/lib/supabase/apiClient';
import { Database } from '@/types/database.types';
import { escapeCSV, generateFilename, generateCSVContent } from '@/utils/csvExport';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/scoreboards/[id]/export
 * Export a scoreboard and its entries as a CSV file download.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = extractBearerToken(request.headers.get('Authorization'));

    // Determine authenticated user (if any)
    let userId: string | null = null;
    let userRole: string | null = null;
    let dbClient: SupabaseClient<Database>;

    if (token) {
      const authClient = getAuthClient(token);
      const {
        data: { user },
        error: authError,
      } = await authClient.auth.getUser();

      if (!authError && user) {
        userId = user.id;

        // Get user role for admin check
        const serviceClient = getServiceRoleClient();
        const readClient = (serviceClient || authClient) as SupabaseClient<Database>;
        const { data: profile } = await readClient
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        userRole = profile?.role || null;
        dbClient = readClient;
      } else {
        dbClient = getAnonClient() as SupabaseClient<Database>;
      }
    } else {
      dbClient = getAnonClient() as SupabaseClient<Database>;
    }

    // Fetch scoreboard metadata
    const { data: scoreboard, error: scoreboardError } = await dbClient
      .from('scoreboards')
      .select(
        'id, owner_id, title, description, score_type, time_format, sort_order, visibility, created_at'
      )
      .eq('id', id)
      .single();

    if (scoreboardError || !scoreboard) {
      return new Response(JSON.stringify({ error: 'Scoreboard not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Access control
    const isOwner = userId !== null && scoreboard.owner_id === userId;
    const isAdmin = userRole === 'system_admin';
    const isPublic = scoreboard.visibility === 'public';

    if (!isPublic && !isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch all entries ordered by score
    const sortDirection = scoreboard.sort_order === 'asc' ? true : false;
    const { data: entries, error: entriesError } = await dbClient
      .from('scoreboard_entries')
      .select('name, score, details, created_at, updated_at')
      .eq('scoreboard_id', id)
      .order('score', { ascending: sortDirection });

    if (entriesError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch entries' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Generate CSV content
    const csvContent = generateCSVContent(
      {
        title: scoreboard.title,
        description: scoreboard.description,
        scoreType: scoreboard.score_type,
        timeFormat: scoreboard.time_format,
        sortOrder: scoreboard.sort_order,
        visibility: scoreboard.visibility,
        createdAt: scoreboard.created_at,
      },
      entries || []
    );

    // Generate safe filename
    const filename = generateFilename(scoreboard.title);

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${escapeCSV(filename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
