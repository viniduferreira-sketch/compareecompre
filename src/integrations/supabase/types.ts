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
      autores: {
        Row: {
          biografia: string
          foto_url: string
          id: string
          nome: string
        }
        Insert: {
          biografia?: string
          foto_url?: string
          id?: string
          nome: string
        }
        Update: {
          biografia?: string
          foto_url?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      awin_allowed_merchants: {
        Row: {
          created_at: string
          merchant_name: string
        }
        Insert: {
          created_at?: string
          merchant_name: string
        }
        Update: {
          created_at?: string
          merchant_name?: string
        }
        Relationships: []
      }
      awin_feed_import_results: {
        Row: {
          created_at: string
          erro: string | null
          feed_id: string
          import_id: string
          linhas: number
          status: string
        }
        Insert: {
          created_at?: string
          erro?: string | null
          feed_id: string
          import_id: string
          linhas?: number
          status: string
        }
        Update: {
          created_at?: string
          erro?: string | null
          feed_id?: string
          import_id?: string
          linhas?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "awin_feed_import_results_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "catalog_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      awin_feed_settings: {
        Row: {
          secret_migrated: boolean
          singleton: boolean
        }
        Insert: {
          secret_migrated?: boolean
          singleton?: boolean
        }
        Update: {
          secret_migrated?: boolean
          singleton?: boolean
        }
        Relationships: []
      }
      awin_feeds: {
        Row: {
          anunciantes: string[]
          ativo: boolean
          created_at: string
          id: string
          nome: string
          origem_segredo: boolean
          ultima_importacao_em: string | null
          ultima_importacao_linhas: number | null
          ultimo_teste_em: string | null
          ultimo_teste_status: string | null
          url: string
        }
        Insert: {
          anunciantes?: string[]
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          origem_segredo?: boolean
          ultima_importacao_em?: string | null
          ultima_importacao_linhas?: number | null
          ultimo_teste_em?: string | null
          ultimo_teste_status?: string | null
          url: string
        }
        Update: {
          anunciantes?: string[]
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          origem_segredo?: boolean
          ultima_importacao_em?: string | null
          ultima_importacao_linhas?: number | null
          ultimo_teste_em?: string | null
          ultimo_teste_status?: string | null
          url?: string
        }
        Relationships: []
      }
      awin_import_merchant_slots: {
        Row: {
          batch: number
          granted: number
          import_id: string
          merchant: string
        }
        Insert: {
          batch: number
          granted: number
          import_id: string
          merchant: string
        }
        Update: {
          batch?: number
          granted?: number
          import_id?: string
          merchant?: string
        }
        Relationships: [
          {
            foreignKeyName: "awin_import_merchant_slots_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "catalog_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      awin_merchant_rules: {
        Row: {
          category_terms: string[]
          excluded_category_terms: string[]
          id: string
          max_products: number
          merchant: string
          updated_at: string
        }
        Insert: {
          category_terms?: string[]
          excluded_category_terms?: string[]
          id?: string
          max_products: number
          merchant: string
          updated_at?: string
        }
        Update: {
          category_terms?: string[]
          excluded_category_terms?: string[]
          id?: string
          max_products?: number
          merchant?: string
          updated_at?: string
        }
        Relationships: []
      }
      catalog_import_batches: {
        Row: {
          batch: number
          discard_reasons: Json | null
          import_id: string
          indexed: number
          skipped: number
        }
        Insert: {
          batch: number
          discard_reasons?: Json | null
          import_id: string
          indexed?: number
          skipped?: number
        }
        Update: {
          batch?: number
          discard_reasons?: Json | null
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
      categorias: {
        Row: {
          id: string
          nome: string
          slug: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
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
      outbound_click_budget: {
        Row: {
          minute: string
          singleton: boolean
          used: number
        }
        Insert: {
          minute: string
          singleton?: boolean
          used: number
        }
        Update: {
          minute?: string
          singleton?: boolean
          used?: number
        }
        Relationships: []
      }
      outbound_clicks: {
        Row: {
          category: string | null
          created_at: string
          device: string
          id: string
          offer_id: string
          page_type: string
          placement: string
          referrer_host: string | null
          source: string
          store_name: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          device: string
          id?: string
          offer_id: string
          page_type: string
          placement: string
          referrer_host?: string | null
          source: string
          store_name: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          device?: string
          id?: string
          offer_id?: string
          page_type?: string
          placement?: string
          referrer_host?: string | null
          source?: string
          store_name?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
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
      partner_stores: {
        Row: {
          description: string
          display_enabled: boolean
          enrollment_status: string
          external_id: string
          group_variants: boolean
          id: string
          import_enabled: boolean
          logo_url: string | null
          merchant_name: string
          metadata_origin: Json
          name: string
          network: string
          notes: string
          updated_at: string
        }
        Insert: {
          description?: string
          display_enabled?: boolean
          enrollment_status?: string
          external_id: string
          group_variants?: boolean
          id?: string
          import_enabled?: boolean
          logo_url?: string | null
          merchant_name?: string
          metadata_origin?: Json
          name?: string
          network: string
          notes?: string
          updated_at?: string
        }
        Update: {
          description?: string
          display_enabled?: boolean
          enrollment_status?: string
          external_id?: string
          group_variants?: boolean
          id?: string
          import_enabled?: boolean
          logo_url?: string | null
          merchant_name?: string
          metadata_origin?: Json
          name?: string
          network?: string
          notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          atualizado_em: string
          autor_id: string | null
          categoria_id: string | null
          corpo: string
          criado_em: string
          descricao_seo: string
          id: string
          imagem_alt: string
          imagem_credito: string
          imagem_url: string
          publicado_em: string | null
          resumo: string
          slug: string
          status: string
          titulo: string
          titulo_seo: string
          visualizacoes: number
        }
        Insert: {
          atualizado_em?: string
          autor_id?: string | null
          categoria_id?: string | null
          corpo?: string
          criado_em?: string
          descricao_seo?: string
          id?: string
          imagem_alt?: string
          imagem_credito?: string
          imagem_url?: string
          publicado_em?: string | null
          resumo?: string
          slug: string
          status?: string
          titulo?: string
          titulo_seo?: string
          visualizacoes?: number
        }
        Update: {
          atualizado_em?: string
          autor_id?: string | null
          categoria_id?: string | null
          corpo?: string
          criado_em?: string
          descricao_seo?: string
          id?: string
          imagem_alt?: string
          imagem_credito?: string
          imagem_url?: string
          publicado_em?: string | null
          resumo?: string
          slug?: string
          status?: string
          titulo?: string
          titulo_seo?: string
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "autores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
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
      price_review_items: {
        Row: {
          detected_at: string
          median_price: number | null
          object_id: string
          peer_count: number
          price: number
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: string
          store: string | null
          title: string
        }
        Insert: {
          detected_at?: string
          median_price?: number | null
          object_id: string
          peer_count?: number
          price: number
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string
          store?: string | null
          title: string
        }
        Update: {
          detected_at?: string
          median_price?: number | null
          object_id?: string
          peer_count?: number
          price?: number
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string
          store?: string | null
          title?: string
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
      tags: {
        Row: {
          id: string
          nome: string
          slug: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
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
      admin_dashboard_metrics: { Args: never; Returns: Json }
      claim_awin_merchant_slots: {
        Args: {
          _batch: number
          _import_id: string
          _limit: number
          _merchant: string
          _requested: number
        }
        Returns: number
      }
      claim_offer_sync_category: {
        Args: { _category: string; _execution_id: string }
        Returns: boolean
      }
      configure_algolia_sync_job: {
        Args: { _cron_secret: string }
        Returns: number
      }
      outbound_click_report: { Args: never; Returns: Json }
      patch_catalog_popularity: { Args: { _updates: Json }; Returns: number }
      patch_catalog_price_review: { Args: { _updates: Json }; Returns: number }
      patch_store_display: {
        Args: { _hidden: boolean; _ids: string[]; _network: string }
        Returns: number
      }
      patch_store_groups: {
        Args: { _network: string; _updates: Json }
        Returns: number
      }
      product_click_counts_30d: {
        Args: never
        Returns: {
          clicks: number
          offer_id: string
        }[]
      }
      public_partner_stores: {
        Args: never
        Returns: {
          description: string
          logo_url: string
          name: string
        }[]
      }
      record_outbound_click: { Args: { payload: Json }; Returns: boolean }
      release_offer_sync_category: {
        Args: { _category: string; _execution_id: string }
        Returns: undefined
      }
      save_awin_feed: {
        Args: {
          _id?: string
          _merchants: Json
          _nome: string
          _secret?: boolean
          _url: string
        }
        Returns: string
      }
      save_awin_feed_internal: {
        Args: {
          _id: string
          _merchants: Json
          _nome: string
          _secret?: boolean
          _url: string
        }
        Returns: string
      }
      save_blog_post: {
        Args: { _post: Json; _tags: string[] }
        Returns: string
      }
      set_awin_quality_mark: {
        Args: { _ids: string[]; _mark: boolean; _reason: string }
        Returns: number
      }
      set_partner_store_import: {
        Args: { _enabled: boolean; _id: string }
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
