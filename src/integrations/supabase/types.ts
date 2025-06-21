export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      email_events: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      job_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: string | null
          error_message: string | null
          id: string
          job_type: string
          progress: number | null
          project_id: string
          result_data: Json | null
          status: string
          total_steps: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          progress?: number | null
          project_id: string
          result_data?: Json | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          progress?: number | null
          project_id?: string
          result_data?: Json | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plan_overlays: {
        Row: {
          created_at: string
          geojson: Json | null
          id: string
          overlay_url: string | null
          page_id: string
          step: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          geojson?: Json | null
          id?: string
          overlay_url?: string | null
          page_id: string
          step: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          geojson?: Json | null
          id?: string
          overlay_url?: string | null
          page_id?: string
          step?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_overlays_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "plan_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_pages: {
        Row: {
          class: string
          confidence: number
          created_at: string
          description: string | null
          full_url: string | null
          id: string
          img_url: string | null
          page_no: number
          plan_type: string | null
          preview_url: string | null
          project_id: string
          sheet_number: string | null
          thumbnail_url: string | null
        }
        Insert: {
          class: string
          confidence?: number
          created_at?: string
          description?: string | null
          full_url?: string | null
          id?: string
          img_url?: string | null
          page_no: number
          plan_type?: string | null
          preview_url?: string | null
          project_id: string
          sheet_number?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          class?: string
          confidence?: number
          created_at?: string
          description?: string | null
          full_url?: string | null
          id?: string
          img_url?: string | null
          page_no?: number
          plan_type?: string | null
          preview_url?: string | null
          project_id?: string
          sheet_number?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_summaries: {
        Row: {
          created_at: string
          id: string
          project_id: string
          summary_json: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          summary_json?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          summary_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_summaries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          owner: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner?: string
          updated_at?: string
        }
        Relationships: []
      }
      thumbnail_cache: {
        Row: {
          cache_hit_count: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed: string | null
          metadata: Json | null
          pdf_hash: string
          pdf_url: string
          project_id: string
        }
        Insert: {
          cache_hit_count?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          pdf_hash: string
          pdf_url: string
          project_id: string
        }
        Update: {
          cache_hit_count?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          pdf_hash?: string
          pdf_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thumbnail_cache_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      thumbnail_metadata: {
        Row: {
          compression_level: number | null
          created_at: string | null
          dimensions: Json | null
          file_sizes: Json | null
          format: string | null
          generation_time_ms: number | null
          id: string
          page_id: string
          updated_at: string | null
        }
        Insert: {
          compression_level?: number | null
          created_at?: string | null
          dimensions?: Json | null
          file_sizes?: Json | null
          format?: string | null
          generation_time_ms?: number | null
          id?: string
          page_id: string
          updated_at?: string | null
        }
        Update: {
          compression_level?: number | null
          created_at?: string | null
          dimensions?: Json | null
          file_sizes?: Json | null
          format?: string | null
          generation_time_ms?: number | null
          id?: string
          page_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thumbnail_metadata_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "plan_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      wizard_progress: {
        Row: {
          active_step: string
          created_at: string
          id: string
          project_id: string
          step_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          active_step?: string
          created_at?: string
          id?: string
          project_id: string
          step_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          active_step?: string
          created_at?: string
          id?: string
          project_id?: string
          step_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wizard_progress_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
