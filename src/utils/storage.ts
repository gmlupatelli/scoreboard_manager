// Local storage utility for persisting scoreboard data
const STORAGE_KEYS = {
  SCOREBOARDS: 'scoreboards',
  SCOREBOARD_ENTRIES: 'scoreboard_entries_',
} as const;

export interface Scoreboard {
  id: string;
  title: string;
  description: string;
  entryCount: number;
  createdAt: string;
  slug: string;
}

export interface Entry {
  id: string;
  rank: number;
  name: string;
  score: number;
}

// Scoreboard operations
export const storage = {
  // Get all scoreboards
  getScoreboards: (): Scoreboard[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCOREBOARDS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading scoreboards:', error);
      return [];
    }
  },

  // Save all scoreboards
  saveScoreboards: (scoreboards: Scoreboard[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SCOREBOARDS, JSON.stringify(scoreboards));
    } catch (error) {
      console.error('Error saving scoreboards:', error);
    }
  },

  // Get entries for a specific scoreboard
  getEntries: (scoreboardId: string): Entry[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.SCOREBOARD_ENTRIES}${scoreboardId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading entries:', error);
      return [];
    }
  },

  // Save entries for a specific scoreboard
  saveEntries: (scoreboardId: string, entries: Entry[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.SCOREBOARD_ENTRIES}${scoreboardId}`, JSON.stringify(entries));
      
      // Update entry count in scoreboards
      const scoreboards = storage.getScoreboards();
      const updated = scoreboards.map(sb =>
        sb.id === scoreboardId ? { ...sb, entryCount: entries.length } : sb
      );
      storage.saveScoreboards(updated);
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  },

  // Delete all entries for a scoreboard
  deleteEntries: (scoreboardId: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_KEYS.SCOREBOARD_ENTRIES}${scoreboardId}`);
    } catch (error) {
      console.error('Error deleting entries:', error);
    }
  },

  // Clear all data (for testing/reset purposes)
  clearAll: (): void => {
    if (typeof window === 'undefined') return;
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEYS.SCOREBOARD_ENTRIES) || key === STORAGE_KEYS.SCOREBOARDS) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};