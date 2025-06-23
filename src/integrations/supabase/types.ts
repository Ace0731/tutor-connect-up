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
      parent_requests: {
        Row: {
          board: string
          class: string
          created_at: string
          id: string
          locality: string
          parent_id: string
          preferred_timings: string
          student_name: string | null
          subjects: string[]
          updated_at: string
        }
        Insert: {
          board: string
          class: string
          created_at?: string
          id?: string
          locality: string
          parent_id: string
          preferred_timings: string
          student_name?: string | null
          subjects: string[]
          updated_at?: string
        }
        Update: {
          board?: string
          class?: string
          created_at?: string
          id?: string
          locality?: string
          parent_id?: string
          preferred_timings?: string
          student_name?: string | null
          subjects?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          role: string
          updated_at: string
        }
        Insert: {
          city: string
          created_at?: string
          email: string
          id: string
          name: string
          phone: string
          role: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_profiles: {
        Row: {
          available_timings: string
          class_range: string
          created_at: string
          fee_per_class: number
          id: string
          locality_preferences: string[]
          subjects: string[]
          tutor_id: string
          updated_at: string
        }
        Insert: {
          available_timings: string
          class_range: string
          created_at?: string
          fee_per_class: number
          id?: string
          locality_preferences: string[]
          subjects: string[]
          tutor_id: string
          updated_at?: string
        }
        Update: {
          available_timings?: string
          class_range?: string
          created_at?: string
          fee_per_class?: number
          id?: string
          locality_preferences?: string[]
          subjects?: string[]
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      unlocked_contacts: {
        Row: {
          id: string
          parent_id: string
          tutor_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          tutor_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          tutor_id?: string
          unlocked_at?: string
        }
        Relationships: []
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
