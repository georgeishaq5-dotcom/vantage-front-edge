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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_rules: {
        Row: {
          auto_approve_limit: number
          created_at: string
          follow_up_trigger: string
          handoff_keyword: string
          id: string
          lead_strictness: number
          max_autonomous_discount: number
          min_profit_margin: number
          outreach_end_hour: number
          outreach_start_hour: number
          target_zip_codes: string[]
          updated_at: string
          veto_level: Database["public"]["Enums"]["veto_level"]
          voice_tone: Database["public"]["Enums"]["voice_tone"]
          weather_freeze: boolean
          weather_heat: boolean
          weather_rain: boolean
        }
        Insert: {
          auto_approve_limit?: number
          created_at?: string
          follow_up_trigger?: string
          handoff_keyword?: string
          id?: string
          lead_strictness?: number
          max_autonomous_discount?: number
          min_profit_margin?: number
          outreach_end_hour?: number
          outreach_start_hour?: number
          target_zip_codes?: string[]
          updated_at?: string
          veto_level?: Database["public"]["Enums"]["veto_level"]
          voice_tone?: Database["public"]["Enums"]["voice_tone"]
          weather_freeze?: boolean
          weather_heat?: boolean
          weather_rain?: boolean
        }
        Update: {
          auto_approve_limit?: number
          created_at?: string
          follow_up_trigger?: string
          handoff_keyword?: string
          id?: string
          lead_strictness?: number
          max_autonomous_discount?: number
          min_profit_margin?: number
          outreach_end_hour?: number
          outreach_start_hour?: number
          target_zip_codes?: string[]
          updated_at?: string
          veto_level?: Database["public"]["Enums"]["veto_level"]
          voice_tone?: Database["public"]["Enums"]["voice_tone"]
          weather_freeze?: boolean
          weather_heat?: boolean
          weather_rain?: boolean
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          service_address: string | null
          site_notes: string | null
        }
        Insert: {
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          service_address?: string | null
          site_notes?: string | null
        }
        Update: {
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          service_address?: string | null
          site_notes?: string | null
        }
        Relationships: []
      }
      job_assignments: {
        Row: {
          created_at: string
          id: string
          is_lead: boolean
          job_id: string | null
          team_member_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_lead?: boolean
          job_id?: string | null
          team_member_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_lead?: boolean
          job_id?: string | null
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      job_locks: {
        Row: {
          job_id: string
          locked_at: string
          locked_by_id: string
          locked_by_name: string
        }
        Insert: {
          job_id: string
          locked_at?: string
          locked_by_id: string
          locked_by_name: string
        }
        Update: {
          job_id?: string
          locked_at?: string
          locked_by_id?: string
          locked_by_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_locks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          quote_amount: number
          scheduled_by_id: string | null
          service_date: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          quote_amount?: number
          scheduled_by_id?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          quote_amount?: number
          scheduled_by_id?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_scheduled_by_id_fkey"
            columns: ["scheduled_by_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      neighbor_outreach: {
        Row: {
          cost: number
          created_at: string
          id: string
          job_id: string | null
          neighbor_addresses: string[]
          status: Database["public"]["Enums"]["outreach_status"]
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          job_id?: string | null
          neighbor_addresses?: string[]
          status?: Database["public"]["Enums"]["outreach_status"]
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          job_id?: string | null
          neighbor_addresses?: string[]
          status?: Database["public"]["Enums"]["outreach_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighbor_outreach_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarded: boolean
          profession: string | null
          team_size: string | null
          yearly_revenue: string | null
          years_in_business: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean
          profession?: string | null
          team_size?: string | null
          yearly_revenue?: string | null
          years_in_business?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean
          profession?: string | null
          team_size?: string | null
          yearly_revenue?: string | null
          years_in_business?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["team_role"]
          skills: string[]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          skills?: string[]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["team_role"]
          skills?: string[]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trade_presets: {
        Row: {
          base_job_description: string
          base_job_title: string
          base_price: number
          created_at: string
          id: string
          profession: string
          updated_at: string
          upgrades: Json
        }
        Insert: {
          base_job_description?: string
          base_job_title?: string
          base_price?: number
          created_at?: string
          id?: string
          profession?: string
          updated_at?: string
          upgrades?: Json
        }
        Update: {
          base_job_description?: string
          base_job_title?: string
          base_price?: number
          created_at?: string
          id?: string
          profession?: string
          updated_at?: string
          upgrades?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_to_job: { Args: { _job_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "dispatcher" | "field_tech"
      customer_type: "Residential" | "Commercial" | "HOA"
      job_status: "Quoted" | "Scheduled" | "Completed" | "Paid"
      member_status: "Active" | "Busy" | "Offline"
      outreach_status: "Pending" | "Approved" | "Vetoed"
      team_role: "Owner/Admin" | "Dispatcher" | "Field Tech"
      veto_level: "Full Manual Review" | "Semi-Autonomous"
      voice_tone: "Enthusiastic" | "Professional" | "Direct"
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
  public: {
    Enums: {
      app_role: ["admin", "dispatcher", "field_tech"],
      customer_type: ["Residential", "Commercial", "HOA"],
      job_status: ["Quoted", "Scheduled", "Completed", "Paid"],
      member_status: ["Active", "Busy", "Offline"],
      outreach_status: ["Pending", "Approved", "Vetoed"],
      team_role: ["Owner/Admin", "Dispatcher", "Field Tech"],
      veto_level: ["Full Manual Review", "Semi-Autonomous"],
      voice_tone: ["Enthusiastic", "Professional", "Direct"],
    },
  },
} as const
