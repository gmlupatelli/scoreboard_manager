export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'system_admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface Scoreboard {
  id: string;
  ownerId: string;
  title: string;
  subtitle?: string | null;
  sortOrder: 'asc' | 'desc';
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
  // Optional populated fields
  owner?: UserProfile;
  entryCount?: number;
}

export interface ScoreboardEntry {
  id: string;
  scoreboardId: string;
  name: string;
  score: number;
  details?: string | null;
  createdAt: string;
  updatedAt: string;
}