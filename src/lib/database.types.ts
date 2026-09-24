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
      alert: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          channel: string
          created_at: string
          id: string
          municipality_id: string
          risk_area_id: string
          sent_at: string | null
          threshold_rule: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          channel: string
          created_at?: string
          id?: string
          municipality_id: string
          risk_area_id: string
          sent_at?: string | null
          threshold_rule: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          channel?: string
          created_at?: string
          id?: string
          municipality_id?: string
          risk_area_id?: string
          sent_at?: string | null
          threshold_rule?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_acknowledged_by_municipality_id_fkey"
            columns: ["acknowledged_by", "municipality_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "municipality_id"]
          },
          {
            foreignKeyName: "alert_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_risk_area_id_municipality_id_fkey"
            columns: ["risk_area_id", "municipality_id"]
            isOneToOne: false
            referencedRelation: "risk_area"
            referencedColumns: ["id", "municipality_id"]
          },
        ]
      }
      inspection: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          municipality_id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["inspection_outcome"]
          report_id: string
          visited_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          municipality_id: string
          notes?: string | null
          outcome: Database["public"]["Enums"]["inspection_outcome"]
          report_id: string
          visited_at: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          municipality_id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["inspection_outcome"]
          report_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_agent_id_municipality_id_fkey"
            columns: ["agent_id", "municipality_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id", "municipality_id"]
          },
          {
            foreignKeyName: "inspection_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_report_id_municipality_id_fkey"
            columns: ["report_id", "municipality_id"]
            isOneToOne: false
            referencedRelation: "report"
            referencedColumns: ["id", "municipality_id"]
          },
        ]
      }
      municipality: {
        Row: {
          boundary: unknown
          created_at: string
          ibge_code: string
          id: string
          name: string
        }
        Insert: {
          boundary: unknown
          created_at?: string
          ibge_code: string
          id?: string
          name: string
        }
        Update: {
          boundary?: unknown
          created_at?: string
          ibge_code?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          created_at: string
          id: string
          municipality_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id: string
          municipality_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          municipality_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profile_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
        ]
      }
      report: {
        Row: {
          breeding_site_type: Database["public"]["Enums"]["breeding_site_type"]
          created_at: string
          description: string | null
          geom: unknown
          id: string
          municipality_id: string
          photo_path: string
          reporter_token_hash: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          breeding_site_type: Database["public"]["Enums"]["breeding_site_type"]
          created_at?: string
          description?: string | null
          geom: unknown
          id?: string
          municipality_id: string
          photo_path: string
          reporter_token_hash: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          breeding_site_type?: Database["public"]["Enums"]["breeding_site_type"]
          created_at?: string
          description?: string | null
          geom?: unknown
          id?: string
          municipality_id?: string
          photo_path?: string
          reporter_token_hash?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "report_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_area: {
        Row: {
          computed_at: string
          geom: unknown
          id: string
          municipality_id: string
          report_count: number
          risk_level: Database["public"]["Enums"]["risk_level"]
          window_end: string
          window_start: string
        }
        Insert: {
          computed_at?: string
          geom: unknown
          id?: string
          municipality_id: string
          report_count: number
          risk_level: Database["public"]["Enums"]["risk_level"]
          window_end: string
          window_start: string
        }
        Update: {
          computed_at?: string
          geom?: unknown
          id?: string
          municipality_id?: string
          report_count?: number
          risk_level?: Database["public"]["Enums"]["risk_level"]
          window_end?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_area_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "municipality"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      current_municipality_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "agent" | "surveillance" | "admin"
      breeding_site_type:
        | "pneu"
        | "caixa_dagua"
        | "vaso_planta"
        | "lixo_entulho"
        | "calha"
        | "piscina"
        | "recipiente_diverso"
        | "outro"
      inspection_outcome: "confirmed" | "dismissed" | "resolved" | "not_found"
      report_status: "pending" | "confirmed" | "dismissed" | "resolved"
      risk_level: "low" | "medium" | "high"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["agent", "surveillance", "admin"],
      breeding_site_type: [
        "pneu",
        "caixa_dagua",
        "vaso_planta",
        "lixo_entulho",
        "calha",
        "piscina",
        "recipiente_diverso",
        "outro",
      ],
      inspection_outcome: ["confirmed", "dismissed", "resolved", "not_found"],
      report_status: ["pending", "confirmed", "dismissed", "resolved"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const

