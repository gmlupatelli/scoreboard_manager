import { supabase } from '../lib/supabase/client';
import { Scoreboard, ScoreboardEntry } from '../types/models';
import { Database } from '../types/database.types';

type ScoreboardRow = Database['public']['Tables']['scoreboards']['Row'];
type ScoreboardInsert = Database['public']['Tables']['scoreboards']['Insert'];
type ScoreboardUpdate = Database['public']['Tables']['scoreboards']['Update'];
type EntryRow = Database['public']['Tables']['scoreboard_entries']['Row'];
type EntryInsert = Database['public']['Tables']['scoreboard_entries']['Insert'];
type EntryUpdate = Database['public']['Tables']['scoreboard_entries']['Update'];

// Helper function to convert database row to application model
const rowToScoreboard = (row: ScoreboardRow, entryCount?: number): Scoreboard => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  subtitle: row.subtitle,
  sortOrder: row.sort_order,
  visibility: row.visibility,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  entryCount: entryCount,
});

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
  // Get all public scoreboards
  async getPublicScoreboards(): Promise<{ data: Scoreboard[] | null; error: Error | null }> {
    console.log('Fetching public scoreboards...');
    try {
      const { data, error } = await supabase
        .from('scoreboards')
        .select(`
          *,
          scoreboard_entries(count)
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error });

      if (error) return { data: null, error };
      
      const scoreboards = (data || []).map((row: any) => {
        const entryCount = row.scoreboard_entries?.[0]?.count || 0;
        return rowToScoreboard(row, entryCount);
      });
      
      return { data: scoreboards, error: null };
    } catch (e) {
      console.error('Error in getPublicScoreboards:', e);
      return { data: null, error: e as Error };
    }
  },

  // Get user's scoreboards (both public and private)
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

  // Get all scoreboards (system admin only)
  async getAllScoreboards(): Promise<{ data: Scoreboard[] | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('scoreboards')
      .select(`
        *,
        scoreboard_entries(count)
      `)
      .order('created_at', { ascending: false });

    if (error) return { data: null, error };
    
    const scoreboards = (data || []).map((row: any) => {
      const entryCount = row.scoreboard_entries?.[0]?.count || 0;
      return rowToScoreboard(row, entryCount);
    });
    
    return { data: scoreboards, error: null };
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
    updates: Partial<Pick<Scoreboard, 'title' | 'subtitle' | 'sortOrder' | 'visibility'>>
  ): Promise<{ data: Scoreboard | null; error: Error | null }> {
    const updateData: ScoreboardUpdate = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.subtitle !== undefined) updateData.subtitle = updates.subtitle;
    if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
    if (updates.visibility !== undefined) updateData.visibility = updates.visibility;

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