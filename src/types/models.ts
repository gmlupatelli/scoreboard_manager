export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'system_admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface ScoreboardCustomStyles {
  preset?: 'light' | 'dark' | 'transparent' | 'high-contrast' | 'minimal' | 'custom';
  backgroundColor?: string;
  textColor?: string;
  titleTextColor?: string;
  headerColor?: string;
  headerTextColor?: string;
  borderColor?: string;
  accentColor?: string;
  accentTextColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  rowHoverColor?: string;
  alternateRowTextColor?: string;
  rankHighlightColor?: string;
  rank1Color?: string;
  rank2Color?: string;
  rank3Color?: string;
  rank1Icon?: string;
  rank2Icon?: string;
  rank3Icon?: string;
}

export type ScoreType = 'number' | 'time';
export type TimeFormat = 'hh:mm' | 'hh:mm:ss' | 'mm:ss' | 'mm:ss.s' | 'mm:ss.ss' | 'mm:ss.sss';

export interface Scoreboard {
  id: string;
  ownerId: string;
  title: string;
  subtitle?: string | null;
  sortOrder: 'asc' | 'desc';
  visibility: 'public' | 'private';
  scoreType: ScoreType;
  timeFormat?: TimeFormat | null;
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