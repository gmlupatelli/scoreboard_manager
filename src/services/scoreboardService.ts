import { supabase } from '../lib/supabase/client';
import { Scoreboard, ScoreboardEntry, ScoreboardCustomStyles } from '../types/models';
import { Database } from '../types/database.types';
import { STYLE_PRESETS } from '../utils/stylePresets';

type ScoreboardRow = Database['public']['Tables']['scoreboards']['Row'];
type EntryRow = Database['public']['Tables']['scoreboard_entries']['Row'];

export interface PaginatedResult<T> {
  data: T[] | null;
  error: Error | null;
  hasMore: boolean;
  totalCount: number;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'title' | 'name' | 'date' | 'entries';
  sortOrder?: 'asc' | 'desc';
}

const DEFAULT_PAGE_SIZE = 30;

// Types for Supabase query results with joined tables
interface ScoreboardWithEntryCount extends ScoreboardRow {
  scoreboard_entries?: { count: number }[];
}

interface ScoreboardWithOwner extends ScoreboardWithEntryCount {
  user_profiles?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  owner_id: string;
}

// Helper function to convert database row to application model
// Uses type assertion to handle optional columns that may not exist in DB yet
const rowToScoreboard = (row: ScoreboardRow, entryCount?: number): Scoreboard => {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order as 'asc' | 'desc',
    visibility: row.visibility,
    scoreType: (row.score_type as 'number' | 'time') ?? 'number',
    timeFormat: (row.time_format as Scoreboard['timeFormat']) ?? null,
    customStyles: row.custom_styles as ScoreboardCustomStyles | null,
    styleScope: row.style_scope as 'main' | 'embed' | 'both' | undefined,
    isLocked: row.is_locked ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    entryCount: entryCount,
  };
};

const rowToEntry = (row: EntryRow): ScoreboardEntry => ({
  id: row.id,
  scoreboardId: row.scoreboard_id,
  name: row.name,
  score: row.score,
  details: row.details,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Failed to get auth session:', error.message);
    return {};
  }
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    console.warn('No access token in session - user may need to re-login');
  }
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const getApiErrorMessage = async (response: Response): Promise<string> => {
  try {
    const errorBody = (await response.json()) as { message?: string; error?: string };
    return errorBody.message || errorBody.error || 'Request failed.';
  } catch {
    return 'Request failed.';
  }
};

export const scoreboardService = {
  // Subscribe to real-time updates for a scoreboard with separate callbacks
  subscribeToScoreboardChanges(
    scoreboardId: string,
    callbacks: {
      onScoreboardChange?: () => void;
      onEntriesChange?: () => void;
    }
  ) {
    const channel = supabase
      .channel(`scoreboard-${scoreboardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scoreboard_entries',
          filter: `scoreboard_id=eq.${scoreboardId}`,
        },
        () => {
          callbacks.onEntriesChange?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scoreboards',
          filter: `id=eq.${scoreboardId}`,
        },
        () => {
          callbacks.onScoreboardChange?.();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },

  // Get public scoreboards with pagination
  async getPublicScoreboardsPaginated(
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Scoreboard>> {
    const { limit = DEFAULT_PAGE_SIZE, offset = 0, search, sortBy = 'newest' } = options;

    try {
      // Build count query with search filter
      let countQuery = supabase
        .from('scoreboards')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public');

      if (search?.trim()) {
        countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        return { data: null, error: countError, hasMore: false, totalCount: 0 };
      }

      // Build data query with search filter
      let dataQuery = supabase
        .from('scoreboards')
        .select(
          `
          *,
          scoreboard_entries(count)
        `
        )
        .eq('visibility', 'public');

      if (search?.trim()) {
        dataQuery = dataQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting based on sortBy parameter
      if (sortBy === 'title') {
        dataQuery = dataQuery.order('title', { ascending: true });
      } else if (sortBy === 'oldest') {
        dataQuery = dataQuery.order('created_at', { ascending: true });
      } else {
        dataQuery = dataQuery.order('created_at', { ascending: false });
      }

      const { data, error } = await dataQuery.range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error, hasMore: false, totalCount: totalCount || 0 };
      }

      const scoreboards = (data || []).map((row: ScoreboardWithEntryCount) => {
        const entryCount = row.scoreboard_entries?.[0]?.count || 0;
        return rowToScoreboard(row, entryCount);
      });

      const hasMore = offset + scoreboards.length < (totalCount || 0);

      return { data: scoreboards, error: null, hasMore, totalCount: totalCount || 0 };
    } catch (e) {
      return { data: null, error: e as Error, hasMore: false, totalCount: 0 };
    }
  },

  // Get user's scoreboards with pagination
  async getUserScoreboardsPaginated(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Scoreboard>> {
    const {
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
    } = options;

    try {
      // Build count query with search filter
      let countQuery = supabase
        .from('scoreboards')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      if (search?.trim()) {
        countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        return { data: null, error: countError, hasMore: false, totalCount: 0 };
      }

      // Build data query with search filter
      let dataQuery = supabase
        .from('scoreboards')
        .select(
          `
          *,
          scoreboard_entries(count)
        `
        )
        .eq('owner_id', userId);

      if (search?.trim()) {
        dataQuery = dataQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply sorting based on sortBy option (entries sorting handled client-side)
      // Map public list sortBy values to date/name equivalents
      const effectiveSortBy =
        sortBy === 'newest'
          ? 'date'
          : sortBy === 'oldest'
            ? 'date'
            : sortBy === 'title'
              ? 'name'
              : sortBy;
      const effectiveSortOrder =
        sortBy === 'oldest' ? 'asc' : sortBy === 'newest' ? 'desc' : sortOrder;

      if (effectiveSortBy === 'name') {
        dataQuery = dataQuery.order('title', { ascending: effectiveSortOrder === 'asc' });
      } else if (effectiveSortBy === 'date') {
        dataQuery = dataQuery.order('created_at', { ascending: effectiveSortOrder === 'asc' });
      } else {
        // Default or 'entries' - use date desc, entries sorting handled client-side
        dataQuery = dataQuery.order('created_at', { ascending: false });
      }

      const { data, error } = await dataQuery.range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error, hasMore: false, totalCount: totalCount || 0 };
      }

      const scoreboards = (data || []).map((row: ScoreboardWithEntryCount) => {
        const entryCount = row.scoreboard_entries?.[0]?.count || 0;
        return rowToScoreboard(row, entryCount);
      });

      const hasMore = offset + scoreboards.length < (totalCount || 0);

      return { data: scoreboards, error: null, hasMore, totalCount: totalCount || 0 };
    } catch (e) {
      return { data: null, error: e as Error, hasMore: false, totalCount: 0 };
    }
  },

  // Get all scoreboards with pagination (system admin only)
  async getAllScoreboardsPaginated(
    options: PaginationOptions & { ownerId?: string } = {}
  ): Promise<PaginatedResult<Scoreboard>> {
    const {
      limit = DEFAULT_PAGE_SIZE,
      offset = 0,
      search,
      ownerId,
      sortBy = 'date',
      sortOrder = 'desc',
    } = options;

    try {
      // Build count query with search and owner filters
      let countQuery = supabase.from('scoreboards').select('*', { count: 'exact', head: true });

      if (search?.trim()) {
        countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (ownerId) {
        countQuery = countQuery.eq('owner_id', ownerId);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        return { data: null, error: countError, hasMore: false, totalCount: 0 };
      }

      // Build data query with search and owner filters
      let dataQuery = supabase.from('scoreboards').select(`
          *,
          scoreboard_entries(count),
          user_profiles!owner_id(id, email, full_name, role)
        `);

      if (search?.trim()) {
        dataQuery = dataQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (ownerId) {
        dataQuery = dataQuery.eq('owner_id', ownerId);
      }

      // Apply sorting based on sortBy option (entries sorting handled client-side)
      // Map public list sortBy values to date/name equivalents
      const effectiveSortBy =
        sortBy === 'newest'
          ? 'date'
          : sortBy === 'oldest'
            ? 'date'
            : sortBy === 'title'
              ? 'name'
              : sortBy;
      const effectiveSortOrder =
        sortBy === 'oldest' ? 'asc' : sortBy === 'newest' ? 'desc' : sortOrder;

      if (effectiveSortBy === 'name') {
        dataQuery = dataQuery.order('title', { ascending: effectiveSortOrder === 'asc' });
      } else if (effectiveSortBy === 'date') {
        dataQuery = dataQuery.order('created_at', { ascending: effectiveSortOrder === 'asc' });
      } else {
        // Default or 'entries' - use date desc, entries sorting handled client-side
        dataQuery = dataQuery.order('created_at', { ascending: false });
      }

      const { data, error } = await dataQuery.range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error, hasMore: false, totalCount: totalCount || 0 };
      }

      const scoreboards = (data || []).map((row: ScoreboardWithOwner) => {
        const entryCount = row.scoreboard_entries?.[0]?.count || 0;
        const scoreboard = rowToScoreboard(row, entryCount);

        if (row.user_profiles) {
          scoreboard.owner = {
            id: row.user_profiles.id,
            email: row.user_profiles.email,
            fullName: row.user_profiles.full_name,
            role: row.user_profiles.role as 'system_admin' | 'user',
            createdAt: '',
            updatedAt: '',
          };
        }

        return scoreboard;
      });

      const hasMore = offset + scoreboards.length < (totalCount || 0);

      return { data: scoreboards, error: null, hasMore, totalCount: totalCount || 0 };
    } catch (e) {
      return { data: null, error: e as Error, hasMore: false, totalCount: 0 };
    }
  },

  // Get all unique scoreboard owners (for admin dropdown)
  async getAllScoreboardOwners(): Promise<{
    data: Array<{ id: string; email: string; fullName: string | null }> | null;
    error: Error | null;
  }> {
    try {
      // Get distinct owner_ids from scoreboards and join with user_profiles
      const { data, error } = await supabase
        .from('scoreboards')
        .select(
          `
          owner_id,
          user_profiles!owner_id(id, email, full_name)
        `
        )
        .order('owner_id');

      if (error) {
        return { data: null, error };
      }

      // Deduplicate owners
      const ownersMap = new Map<string, { id: string; email: string; fullName: string | null }>();
      interface OwnerRow {
        owner_id: string;
        user_profiles?: { id: string; email: string; full_name: string | null };
      }
      (data || []).forEach((row: OwnerRow) => {
        if (row.user_profiles && !ownersMap.has(row.owner_id)) {
          ownersMap.set(row.owner_id, {
            id: row.user_profiles.id,
            email: row.user_profiles.email,
            fullName: row.user_profiles.full_name,
          });
        }
      });

      return {
        data: Array.from(ownersMap.values()).sort((a, b) =>
          (a.fullName || a.email).localeCompare(b.fullName || b.email)
        ),
        error: null,
      };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  // Get single scoreboard by ID
  async getScoreboard(id: string): Promise<{ data: Scoreboard | null; error: Error | null }> {
    const { data, error } = await supabase.from('scoreboards').select('*').eq('id', id).single();

    if (error) return { data: null, error };
    return { data: data ? rowToScoreboard(data) : null, error: null };
  },

  // Create scoreboard
  async createScoreboard(
    scoreboard: Omit<Scoreboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: Scoreboard | null; error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/scoreboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          ownerId: scoreboard.ownerId,
          title: scoreboard.title,
          description: scoreboard.description,
          sortOrder: scoreboard.sortOrder,
          visibility: scoreboard.visibility,
          scoreType: scoreboard.scoreType ?? 'number',
          timeFormat: scoreboard.timeFormat ?? null,
          customStyles: scoreboard.customStyles ?? STYLE_PRESETS.light,
          styleScope: scoreboard.styleScope ?? 'both',
        }),
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { data: null, error: new Error(errorMessage) };
      }

      const result = (await response.json()) as { scoreboard?: ScoreboardRow };
      return {
        data: result.scoreboard ? rowToScoreboard(result.scoreboard) : null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to create scoreboard'),
      };
    }
  },

  // Update scoreboard
  async updateScoreboard(
    id: string,
    updates: Partial<
      Pick<
        Scoreboard,
        | 'title'
        | 'description'
        | 'sortOrder'
        | 'visibility'
        | 'scoreType'
        | 'timeFormat'
        | 'customStyles'
        | 'styleScope'
      >
    >
  ): Promise<{ data: Scoreboard | null; error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { data: null, error: new Error(errorMessage) };
      }

      const result = (await response.json()) as { scoreboard?: ScoreboardRow };
      return {
        data: result.scoreboard ? rowToScoreboard(result.scoreboard) : null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to update scoreboard'),
      };
    }
  },

  // Delete scoreboard and clean up associated kiosk images from storage
  async deleteScoreboard(id: string): Promise<{ error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { error: new Error(errorMessage) };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to delete scoreboard') };
    }
  },

  // Get entries for a scoreboard
  async getScoreboardEntries(
    scoreboardId: string
  ): Promise<{ data: ScoreboardEntry[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('scoreboard_entries')
      .select('*')
      .eq('scoreboard_id', scoreboardId)
      .order('score', { ascending: false });

    if (error) return { data: null, error };
    return { data: (data || []).map(rowToEntry), error: null };
  },

  // Create entry
  async createEntry(
    entry: Omit<ScoreboardEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: ScoreboardEntry | null; error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${entry.scoreboardId}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          name: entry.name,
          score: entry.score,
          details: entry.details ?? null,
        }),
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { data: null, error: new Error(errorMessage) };
      }

      const result = (await response.json()) as { entry?: EntryRow };
      return { data: result.entry ? rowToEntry(result.entry) : null, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to add entry'),
      };
    }
  },

  /**
   * Bulk create entries in a single API call
   */
  async createEntriesBulk(
    scoreboardId: string,
    entries: { name: string; score: number; details?: string | null }[]
  ): Promise<{ data: ScoreboardEntry[] | null; error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${scoreboardId}/entries/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { data: null, error: new Error(errorMessage) };
      }

      const result = (await response.json()) as { entries?: EntryRow[] };
      return {
        data: (result.entries || []).map(rowToEntry),
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to import entries'),
      };
    }
  },

  // Update entry
  async updateEntry(
    scoreboardId: string,
    id: string,
    updates: Partial<Pick<ScoreboardEntry, 'name' | 'score' | 'details'>>
  ): Promise<{ data: ScoreboardEntry | null; error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${scoreboardId}/entries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { data: null, error: new Error(errorMessage) };
      }

      const result = (await response.json()) as { entry?: EntryRow };
      return { data: result.entry ? rowToEntry(result.entry) : null, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to update entry'),
      };
    }
  },

  // Delete entry
  async deleteEntry(scoreboardId: string, id: string): Promise<{ error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${scoreboardId}/entries/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { error: new Error(errorMessage) };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to delete entry') };
    }
  },

  // Delete all entries for a scoreboard (used when changing score type)
  async deleteAllEntries(scoreboardId: string): Promise<{ error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${scoreboardId}/entries`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { error: new Error(errorMessage) };
      }

      return { error: null };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to delete entries'),
      };
    }
  },

  async unlockScoreboard(id: string): Promise<{ data: Scoreboard | null; error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/scoreboards/${id}/unlock`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { data: null, error: new Error(errorMessage) };
      }

      const result = (await response.json()) as { scoreboard?: ScoreboardRow };
      return {
        data: result.scoreboard ? rowToScoreboard(result.scoreboard) : null,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to unlock scoreboard'),
      };
    }
  },

  async lockAllScoreboards(): Promise<{ error: Error | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/scoreboards/lock-all', {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { error: new Error(errorMessage) };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to lock scoreboards') };
    }
  },

  async getEmbedScoreboardData(scoreboardId: string): Promise<{
    data: {
      scoreboard: Scoreboard | null;
      entries: ScoreboardEntry[];
      showPoweredBy: boolean;
    } | null;
    error: Error | null;
  }> {
    try {
      const response = await fetch(`/api/embed/${scoreboardId}`);

      if (!response.ok) {
        const errorMessage = await getApiErrorMessage(response);
        return { data: null, error: new Error(errorMessage) };
      }

      const result = (await response.json()) as {
        scoreboard?: ScoreboardRow;
        entries?: EntryRow[];
        showPoweredBy?: boolean;
      };

      return {
        data: {
          scoreboard: result.scoreboard ? rowToScoreboard(result.scoreboard) : null,
          entries: (result.entries || []).map(rowToEntry),
          showPoweredBy: Boolean(result.showPoweredBy),
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Failed to load embed data'),
      };
    }
  },
};
