export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'system_admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface ScoreboardCustomStyles {
  preset?: 'light' | 'dark' | 'transparent' | 'high-contrast' | 'minimal' | 'brand';
  backgroundColor?: string;
  textColor?: string;
  headerColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  rowHoverColor?: string;
  rankHighlightColor?: string;
}

export interface Scoreboard {
  id: string;
  ownerId: string;
  title: string;
  subtitle?: string | null;
  sortOrder: 'asc' | 'desc';
  visibility: 'public' | 'private';
  customStyles?: ScoreboardCustomStyles | null;
  styleScope?: 'main' | 'embed' | 'both';
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
  rank?: number; // Calculated on frontend based on score
}