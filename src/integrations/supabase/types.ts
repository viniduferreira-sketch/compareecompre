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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_access_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      catalog_import_batches: {
        Row: {
          batch: number
          import_id: string
          indexed: number
          skipped: number
        }
        Insert: {
          batch: number
          import_id: string
          indexed?: number
          skipped?: number
        }
        Update: {
          batch?: number
          import_id?: string
          indexed?: number
          skipped?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_import_batches_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "catalog_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_imports: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          github_run_id: string | null
          id: string
          next_page: number | null
          source: string
          status: string
          sync_cursor: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          github_run_id?: string | null
          id?: string
          next_page?: number | null
          source?: string
          status?: string
          sync_cursor?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          github_run_id?: string | null
          id?: string
          next_page?: number | null
          source?: string
          status?: string
          sync_cursor?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      offer_sync_category_leases: {
        Row: {
          category: string
          execution_id: string
          expires_at: string
        }
        Insert: {
          category: string
          execution_id: string
          expires_at: string
        }
        Update: {
          category?: string
          execution_id?: string
          expires_at?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          affiliate_url: string
          created_at: string
          discount_percent: number | null
          external_id: string | null
          free_shipping: boolean
          id: string
          original_price: number | null
          price: number
          product_id: string
          store_name: string
          updated_at: string
        }
        Insert: {
          affiliate_url: string
          created_at?: string
          discount_percent?: number | null
          external_id?: string | null
          free_shipping?: boolean
          id?: string
          original_price?: number | null
          price: number
          product_id: string
          store_name: string
          updated_at?: string
        }
        Update: {
          affiliate_url?: string
          created_at?: string
          discount_percent?: number | null
          external_id?: string | null
          free_shipping?: boolean
          id?: string
          original_price?: number | null
          price?: number
          product_id?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_catalog: {
        Row: {
          last_synced_at: string
          object_id: string
          record: Json
          source: string
        }
        Insert: {
          last_synced_at?: string
          object_id: string
          record: Json
          source: string
        }
        Update: {
          last_synced_at?: string
          object_id?: string
          record?: Json
          source?: string
        }
        Relationships: []
      }
      partner_coupons: {
        Row: {
          affiliate_url: string
          code: string
          description: string | null
          expires_at: string | null
          id: string
          last_synced_at: string
          logo_url: string | null
          merchant_id: string
          source: string
          starts_at: string | null
          status: string
          store: string
          title: string
        }
        Insert: {
          affiliate_url: string
          code: string
          description?: string | null
          expires_at?: string | null
          id: string
          last_synced_at?: string
          logo_url?: string | null
          merchant_id: string
          source: string
          starts_at?: string | null
          status?: string
          store: string
          title: string
        }
        Update: {
          affiliate_url?: string
          code?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          last_synced_at?: string
          logo_url?: string | null
          merchant_id?: string
          source?: string
          starts_at?: string | null
          status?: string
          store?: string
          title?: string
        }
        Relationships: []
      }
      price_alert_subscribers: {
        Row: {
          consent_at: string | null
          consent_text_version: string | null
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          consent_at?: string | null
          consent_text_version?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          consent_at?: string | null
          consent_text_version?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          external_id: string
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          external_id: string
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          external_id?: string
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          role: string
          user_id: string
        }
        Update: {
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_offer_sync_category: {
        Args: { _category: string; _execution_id: string }
        Returns: boolean
      }
      configure_algolia_sync_job: {
        Args: { _cron_secret: string }
        Returns: number
      }
      release_offer_sync_category: {
        Args: { _category: string; _execution_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
