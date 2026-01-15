export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          expires_at: string
          id: string
          invitee_email: string
          inviter_id: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invitee_email: string
          inviter_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invitee_email?: string
          inviter_id?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_configs: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          pin_code: string | null
          scoreboard_id: string
          scoreboard_position: number
          slide_duration_seconds: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          pin_code?: string | null
          scoreboard_id: string
          scoreboard_position?: number
          slide_duration_seconds?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          pin_code?: string | null
          scoreboard_id?: string
          scoreboard_position?: number
          slide_duration_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_configs_scoreboard_id_fkey"
            columns: ["scoreboard_id"]
            isOneToOne: true
            referencedRelation: "scoreboards"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_file_registry: {
        Row: {
          created_at: string
          file_size: number | null
          file_type: Database["public"]["Enums"]["kiosk_file_type"]
          id: string
          scoreboard_id: string
          slide_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_type: Database["public"]["Enums"]["kiosk_file_type"]
          id?: string
          scoreboard_id: string
          slide_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["kiosk_file_type"]
          id?: string
          scoreboard_id?: string
          slide_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_file_registry_scoreboard_id_fkey"
            columns: ["scoreboard_id"]
            isOneToOne: false
            referencedRelation: "scoreboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiosk_file_registry_slide_id_fkey"
            columns: ["slide_id"]
            isOneToOne: false
            referencedRelation: "kiosk_slides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiosk_file_registry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_slides: {
        Row: {
          created_at: string
          duration_override_seconds: number | null
          file_name: string | null
          file_size: number | null
          id: string
          image_url: string | null
          kiosk_config_id: string
          position: number
          slide_type: Database["public"]["Enums"]["slide_type"]
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string
          duration_override_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          image_url?: string | null
          kiosk_config_id: string
          position: number
          slide_type: Database["public"]["Enums"]["slide_type"]
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string
          duration_override_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          image_url?: string | null
          kiosk_config_id?: string
          position?: number
          slide_type?: Database["public"]["Enums"]["slide_type"]
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_slides_kiosk_config_id_fkey"
            columns: ["kiosk_config_id"]
            isOneToOne: false
            referencedRelation: "kiosk_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      scoreboard_entries: {
        Row: {
          created_at: string
          details: string | null
          id: string
          name: string
          score: number
          scoreboard_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          name: string
          score: number
          scoreboard_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          name?: string
          score?: number
          scoreboard_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoreboard_entries_scoreboard_id_fkey"
            columns: ["scoreboard_id"]
            isOneToOne: false
            referencedRelation: "scoreboards"
            referencedColumns: ["id"]
          },
        ]
      }
      scoreboards: {
        Row: {
          created_at: string
          custom_styles: Json | null
          description: string | null
          id: string
          owner_id: string
          score_type: string
          sort_order: string
          style_scope: string | null
          time_format: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["scoreboard_visibility"]
        }
        Insert: {
          created_at?: string
          custom_styles?: Json | null
          description?: string | null
          id?: string
          owner_id: string
          score_type?: string
          sort_order?: string
          style_scope?: string | null
          time_format?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["scoreboard_visibility"]
        }
        Update: {
          created_at?: string
          custom_styles?: Json | null
          description?: string | null
          id?: string
          owner_id?: string
          score_type?: string
          sort_order?: string
          style_scope?: string | null
          time_format?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["scoreboard_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "scoreboards_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          allow_public_registration: boolean
          created_at: string
          id: string
          require_email_verification: boolean
          updated_at: string
        }
        Insert: {
          allow_public_registration?: boolean
          created_at?: string
          id?: string
          require_email_verification?: boolean
          updated_at?: string
        }
        Update: {
          allow_public_registration?: boolean
          created_at?: string
          id?: string
          require_email_verification?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { user_email: string }; Returns: undefined }
      can_view_kiosk: { Args: { config_id: string }; Returns: boolean }
      can_view_scoreboard: {
        Args: { scoreboard_uuid: string }
        Returns: boolean
      }
      change_user_password:
        | {
            Args: { current_password: string; new_password: string }
            Returns: Json
          }
        | { Args: { new_password: string }; Returns: undefined }
      delete_user_account: { Args: never; Returns: Json }
      find_orphan_kiosk_files: {
        Args: { older_than_minutes?: number }
        Returns: {
          created_at: string
          file_size: number
          file_type: Database["public"]["Enums"]["kiosk_file_type"]
          id: string
          scoreboard_id: string
          storage_path: string
          user_id: string
        }[]
      }
      has_valid_invitation: { Args: { check_email: string }; Returns: boolean }
      is_public_registration_allowed: { Args: never; Returns: boolean }
      is_system_admin: { Args: never; Returns: boolean }
      owns_kiosk_config: { Args: { config_id: string }; Returns: boolean }
      owns_scoreboard: { Args: { scoreboard_uuid: string }; Returns: boolean }
    }
    Enums: {
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      kiosk_file_type: "original" | "thumbnail"
      scoreboard_visibility: "public" | "private"
      slide_type: "image" | "scoreboard"
      user_role: "system_admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      kiosk_file_type: ["original", "thumbnail"],
      scoreboard_visibility: ["public", "private"],
      slide_type: ["image", "scoreboard"],
      user_role: ["system_admin", "user"],
    },
  },
} as const
