import { supabase } from '../lib/supabase/client';
import { Scoreboard, ScoreboardEntry } from '../types/models';
import { Database } from '../types/database.types';

type ScoreboardRow = Database['public']['Tables']['scoreboards']['Row'];
type ScoreboardInsert = Database['public']['Tables']['scoreboards']['Insert'];
type ScoreboardUpdate = Database['public']['Tables']['scoreboards']['Update'];
type EntryRow = Database['public']['Tables']['scoreboard_entries']['Row'];
type EntryInsert = Database['public']['Tables']['scoreboard_entries']['Insert'];
type EntryUpdate = Database['public']['Tables']['scoreboard_entries']['Update'];

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
}

const DEFAULT_PAGE_SIZE = 30;

// Helper function to convert database row to application model
// Uses type assertion to handle optional columns that may not exist in DB yet
const rowToScoreboard = (row: ScoreboardRow, entryCount?: number): Scoreboard => {
  const rowAny = row as Record<string, unknown>;
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    subtitle: row.subtitle,
    sortOrder: row.sort_order,
    visibility: row.visibility,
    customStyles: rowAny.custom_styles as ScoreboardRow['custom_styles'] ?? null,
    styleScope: rowAny.style_scope as ScoreboardRow['style_scope'] ?? undefined,
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
      .channel(`realtime-scoreboard-${scoreboardId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Get public scoreboards with pagination
  async getPublicScoreboardsPaginated(
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Scoreboard>> {
    const { limit = DEFAULT_PAGE_SIZE, offset = 0, search } = options;
    
    try {
      // Build count query with search filter
      let countQuery = supabase
        .from('scoreboards')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public');
      
      if (search?.trim()) {
        countQuery = countQuery.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        return { data: null, error: countError, hasMore: false, totalCount: 0 };
      }

      // Build data query with search filter
      let dataQuery = supabase
        .from('scoreboards')
        .select(`
          *,
          scoreboard_entries(count)
        `)
        .eq('visibility', 'public');
      
      if (search?.trim()) {
        dataQuery = dataQuery.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
      }

      const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error, hasMore: false, totalCount: totalCount || 0 };
      }
      
      const scoreboards = (data || []).map((row: any) => {
        const entryCount = row.scoreboard_entries?.[0]?.count || 0;
        return rowToScoreboard(row, entryCount);
      });
      
      const hasMore = offset + scoreboards.length < (totalCount || 0);
      
      return { data: scoreboards, error: null, hasMore, totalCount: totalCount || 0 };
    } catch (e) {
      return { data: null, error: e as Error, hasMore: false, totalCount: 0 };
    }
  },

  // Get user's scoreboards (both public and private) - legacy
  async getUserScoreboards(userId: string): Promise<{ data: Scoreboard[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('scoreboards')
      .select(`
        *,
        scoreboard_entries(count)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };
    
    const scoreboards = (data || []).map((row: any) => {
      const entryCount = row.scoreboard_entries?.[0]?.count || 0;
      return rowToScoreboard(row, entryCount);
    });
    
    return { data: scoreboards, error: null };
  },

  // Get user's scoreboards with pagination
  async getUserScoreboardsPaginated(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<Scoreboard>> {
    const { limit = DEFAULT_PAGE_SIZE, offset = 0, search } = options;
    
    try {
      // Build count query with search filter
      let countQuery = supabase
        .from('scoreboards')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);
      
      if (search?.trim()) {
        countQuery = countQuery.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        return { data: null, error: countError, hasMore: false, totalCount: 0 };
      }

      // Build data query with search filter
      let dataQuery = supabase
        .from('scoreboards')
        .select(`
          *,
          scoreboard_entries(count)
        `)
        .eq('owner_id', userId);
      
      if (search?.trim()) {
        dataQuery = dataQuery.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
      }

      const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error, hasMore: false, totalCount: totalCount || 0 };
      }
      
      const scoreboards = (data || []).map((row: any) => {
        const entryCount = row.scoreboard_entries?.[0]?.count || 0;
        return rowToScoreboard(row, entryCount);
      });
      
      const hasMore = offset + scoreboards.length < (totalCount || 0);
      
      return { data: scoreboards, error: null, hasMore, totalCount: totalCount || 0 };
    } catch (e) {
      return { data: null, error: e as Error, hasMore: false, totalCount: 0 };
    }
  },

  // Get all scoreboards with owner info (system admin only) - legacy
  async getAllScoreboards(): Promise<{ data: Scoreboard[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('scoreboards')
      .select(`
        *,
        scoreboard_entries(count),
        user_profiles!owner_id(id, email, full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };
    
    const scoreboards = (data || []).map((row: any) => {
      const entryCount = row.scoreboard_entries?.[0]?.count || 0;
      const scoreboard = rowToScoreboard(row, entryCount);
      
      if (row.user_profiles) {
        scoreboard.owner = {
          id: row.user_profiles.id,
          email: row.user_profiles.email,
          fullName: row.user_profiles.full_name,
          role: row.user_profiles.role,
          createdAt: '',
          updatedAt: '',
        };
      }
      
      return scoreboard;
    });
    
    return { data: scoreboards, error: null };
  },

  // Get all scoreboards with pagination (system admin only)
  async getAllScoreboardsPaginated(
    options: PaginationOptions & { ownerId?: string } = {}
  ): Promise<PaginatedResult<Scoreboard>> {
    const { limit = DEFAULT_PAGE_SIZE, offset = 0, search, ownerId } = options;
    
    try {
      // Build count query with search and owner filters
      let countQuery = supabase
        .from('scoreboards')
        .select('*', { count: 'exact', head: true });
      
      if (search?.trim()) {
        countQuery = countQuery.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
      }
      
      if (ownerId) {
        countQuery = countQuery.eq('owner_id', ownerId);
      }

      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        return { data: null, error: countError, hasMore: false, totalCount: 0 };
      }

      // Build data query with search and owner filters
      let dataQuery = supabase
        .from('scoreboards')
        .select(`
          *,
          scoreboard_entries(count),
          user_profiles!owner_id(id, email, full_name, role)
        `);
      
      if (search?.trim()) {
        dataQuery = dataQuery.or(`title.ilike.%${search}%,subtitle.ilike.%${search}%`);
      }
      
      if (ownerId) {
        dataQuery = dataQuery.eq('owner_id', ownerId);
      }

      const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error, hasMore: false, totalCount: totalCount || 0 };
      }
      
      const scoreboards = (data || []).map((row: any) => {
        const entryCount = row.scoreboard_entries?.[0]?.count || 0;
        const scoreboard = rowToScoreboard(row, entryCount);
        
        if (row.user_profiles) {
          scoreboard.owner = {
            id: row.user_profiles.id,
            email: row.user_profiles.email,
            fullName: row.user_profiles.full_name,
            role: row.user_profiles.role,
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
    error: Error | null 
  }> {
    try {
      // Get distinct owner_ids from scoreboards and join with user_profiles
      const { data, error } = await supabase
        .from('scoreboards')
        .select(`
          owner_id,
          user_profiles!owner_id(id, email, full_name)
        `)
        .order('owner_id');

      if (error) {
        return { data: null, error };
      }

      // Deduplicate owners
      const ownersMap = new Map<string, { id: string; email: string; fullName: string | null }>();
      (data || []).forEach((row: any) => {
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
        error: null 
      };
    } catch (e) {
      return { data: null, error: e as Error };
    }
  },

  // Get single scoreboard by ID
  async getScoreboard(id: string): Promise<{ data: Scoreboard | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('scoreboards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error };
    return { data: data ? rowToScoreboard(data) : null, error: null };
  },

  // Create scoreboard
  async createScoreboard(
    scoreboard: Omit<Scoreboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ data: Scoreboard | null; error: Error | null }> {
    const insertData: ScoreboardInsert = {
      id: `scoreboard_${Date.now()}`,
      owner_id: scoreboard.ownerId,
      title: scoreboard.title,
      subtitle: scoreboard.subtitle,
      sort_order: scoreboard.sortOrder,
      visibility: scoreboard.visibility,
    };

    const { data, error } = await supabase
      .from('scoreboards')
      .insert(insertData)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data: data ? rowToScoreboard(data) : null, error: null };
  },

  // Update scoreboard
  async updateScoreboard(
    id: string,
    updates: Partial<Pick<Scoreboard, 'title' | 'subtitle' | 'sortOrder' | 'visibility' | 'customStyles' | 'styleScope'>>
  ): Promise<{ data: Scoreboard | null; error: Error | null }> {
    const updateData: ScoreboardUpdate = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;
    if (updates.customStyles !== undefined) updateData.custom_styles = updates.customStyles;
    if (updates.styleScope !== undefined) updateData.style_scope = updates.styleScope;

    const { data, error } = await supabase
      .from('scoreboards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data: data ? rowToScoreboard(data) : null, error: null };
  },

  // Delete scoreboard
  async deleteScoreboard(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('scoreboards')
      .delete()
      .eq('id', id);

    return { error };
  },

  // Get entries for a scoreboard
  async getScoreboardEntries(scoreboardId: string): Promise<{ data: ScoreboardEntry[] | null; error: Error | null }> {
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
    const insertData: EntryInsert = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      scoreboard_id: entry.scoreboardId,
      name: entry.name,
      score: entry.score,
      details: entry.details,
    };

    const { data, error } = await supabase
      .from('scoreboard_entries')
      .insert(insertData)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data: data ? rowToEntry(data) : null, error: null };
  },

  // Update entry
  async updateEntry(
    id: string,
    updates: Partial<Pick<ScoreboardEntry, 'name' | 'score' | 'details'>>
  ): Promise<{ data: ScoreboardEntry | null; error: Error | null }> {
    const updateData: EntryUpdate = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.score !== undefined) updateData.score = updates.score;
    if (updates.details !== undefined) updateData.details = updates.details;

    const { data, error } = await supabase
      .from('scoreboard_entries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error };
    return { data: data ? rowToEntry(data) : null, error: null };
  },

  // Delete entry
  async deleteEntry(id: string): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('scoreboard_entries')
      .delete()
      .eq('id', id);

    return { error };
  },
};