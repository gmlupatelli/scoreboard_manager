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
}

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
          description: string | null;
          sort_order: 'asc' | 'desc';
          visibility: 'public' | 'private';
          score_type: 'number' | 'time';
          time_format: 'hh:mm' | 'hh:mm:ss' | 'mm:ss' | 'mm:ss.s' | 'mm:ss.ss' | 'mm:ss.sss' | null;
          custom_styles?: ScoreboardCustomStyles | null;
          style_scope?: 'main' | 'embed' | 'both';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          owner_id: string;
          title: string;
          description?: string | null;
          sort_order?: 'asc' | 'desc';
          visibility?: 'public' | 'private';
          score_type?: 'number' | 'time';
          time_format?:
            | 'hh:mm'
            | 'hh:mm:ss'
            | 'mm:ss'
            | 'mm:ss.s'
            | 'mm:ss.ss'
            | 'mm:ss.sss'
            | null;
          custom_styles?: ScoreboardCustomStyles | null;
          style_scope?: 'main' | 'embed' | 'both';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          sort_order?: 'asc' | 'desc';
          visibility?: 'public' | 'private';
          score_type?: 'number' | 'time';
          time_format?:
            | 'hh:mm'
            | 'hh:mm:ss'
            | 'mm:ss'
            | 'mm:ss.s'
            | 'mm:ss.ss'
            | 'mm:ss.sss'
            | null;
          custom_styles?: ScoreboardCustomStyles | null;
          style_scope?: 'main' | 'embed' | 'both';
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
      kiosk_configs: {
        Row: {
          id: string;
          scoreboard_id: string;
          slide_duration_seconds: number;
          scoreboard_position: number;
          enabled: boolean;
          pin_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scoreboard_id: string;
          slide_duration_seconds?: number;
          scoreboard_position?: number;
          enabled?: boolean;
          pin_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scoreboard_id?: string;
          slide_duration_seconds?: number;
          scoreboard_position?: number;
          enabled?: boolean;
          pin_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      kiosk_slides: {
        Row: {
          id: string;
          kiosk_config_id: string;
          position: number;
          slide_type: 'image' | 'scoreboard';
          image_url: string | null;
          thumbnail_url: string | null;
          duration_override_seconds: number | null;
          file_name: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kiosk_config_id: string;
          position: number;
          slide_type: 'image' | 'scoreboard';
          image_url?: string | null;
          thumbnail_url?: string | null;
          duration_override_seconds?: number | null;
          file_name?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          kiosk_config_id?: string;
          position?: number;
          slide_type?: 'image' | 'scoreboard';
          image_url?: string | null;
          thumbnail_url?: string | null;
          duration_override_seconds?: number | null;
          file_name?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
      };
    };
  };
}
