export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'system_admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'system_admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'system_admin' | 'user';
          created_at?: string;
          updated_at?: string;
        };
      };
      scoreboards: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          subtitle: string | null;
          sort_order: 'asc' | 'desc';
          visibility: 'public' | 'private';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          owner_id: string;
          title: string;
          subtitle?: string | null;
          sort_order?: 'asc' | 'desc';
          visibility?: 'public' | 'private';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          subtitle?: string | null;
          sort_order?: 'asc' | 'desc';
          visibility?: 'public' | 'private';
          created_at?: string;
          updated_at?: string;
        };
      };
      scoreboard_entries: {
        Row: {
          id: string;
          scoreboard_id: string;
          name: string;
          score: number;
          details: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          scoreboard_id: string;
          name: string;
          score: number;
          details?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scoreboard_id?: string;
          name?: string;
          score?: number;
          details?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_settings: {
        Row: {
          id: string;
          allow_public_registration: boolean;
          require_email_verification: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          allow_public_registration?: boolean;
          require_email_verification?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          allow_public_registration?: boolean;
          require_email_verification?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          inviter_id: string | null;
          invitee_email: string;
          status: 'pending' | 'accepted' | 'expired' | 'cancelled';
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          invitee_email: string;
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          inviter_id?: string | null;
          invitee_email?: string;
          status?: 'pending' | 'accepted' | 'expired' | 'cancelled';
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}