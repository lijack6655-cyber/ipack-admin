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
      articles: {
        Row: {
          author_name: string | null
          category: string | null
          content_html: string | null
          content_markdown: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          featured_image_path: string | null
          id: string
          imported_at: string | null
          page_path: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          source_type: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_path?: string | null
          id?: string
          imported_at?: string | null
          page_path?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          source_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          featured_image_path?: string | null
          id?: string
          imported_at?: string | null
          page_path?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          source_type?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: number
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type: string
          status?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          source_type: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          source_type?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          source_type?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_to: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          lifecycle_stage: string
          name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lifecycle_stage?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lifecycle_stage?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          destination_country: string | null
          id: string
          message: string | null
          oe_number: string | null
          privacy_consent: boolean
          product_interest: string | null
          quantity: string | null
          raw_payload: Json
          reference: string
          request_fingerprint: string | null
          retention_until: string
          selected_products: Json | null
          source: string
          source_page: string | null
          status: Database["public"]["Enums"]["inquiry_status"]
          subject: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_year: string | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          destination_country?: string | null
          id?: string
          message?: string | null
          oe_number?: string | null
          privacy_consent?: boolean
          product_interest?: string | null
          quantity?: string | null
          raw_payload?: Json
          reference?: string
          request_fingerprint?: string | null
          retention_until?: string
          selected_products?: Json | null
          source?: string
          source_page?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          subject?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          destination_country?: string | null
          id?: string
          message?: string | null
          oe_number?: string | null
          privacy_consent?: boolean
          product_interest?: string | null
          quantity?: string | null
          raw_payload?: Json
          reference?: string
          request_fingerprint?: string | null
          retention_until?: string
          selected_products?: Json | null
          source?: string
          source_page?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"]
          subject?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          category_name: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_title: string | null
          external_id: string | null
          featured: boolean
          gallery_paths: string[]
          hover_image_path: string | null
          id: string
          image_path: string | null
          imported_at: string | null
          make: string | null
          model: string | null
          moq_text: string | null
          oe_numbers: string[]
          page_path: string | null
          price_text: string | null
          published_at: string | null
          search_text: string | null
          sku: string | null
          slug: string
          source_rank: string | null
          source_type: string | null
          source_url: string | null
          specifications: Json | null
          status: Database["public"]["Enums"]["content_status"]
          stock_quantity: number | null
          title: string
          updated_at: string
          updated_by: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          weight_kg: number | null
          years: string | null
        }
        Insert: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_title?: string | null
          external_id?: string | null
          featured?: boolean
          gallery_paths?: string[]
          hover_image_path?: string | null
          id?: string
          image_path?: string | null
          imported_at?: string | null
          make?: string | null
          model?: string | null
          moq_text?: string | null
          oe_numbers?: string[]
          page_path?: string | null
          price_text?: string | null
          published_at?: string | null
          search_text?: string | null
          sku?: string | null
          slug: string
          source_rank?: string | null
          source_type?: string | null
          source_url?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["content_status"]
          stock_quantity?: number | null
          title: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          weight_kg?: number | null
          years?: string | null
        }
        Update: {
          category_id?: string | null
          category_name?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_title?: string | null
          external_id?: string | null
          featured?: boolean
          gallery_paths?: string[]
          hover_image_path?: string | null
          id?: string
          image_path?: string | null
          imported_at?: string | null
          make?: string | null
          model?: string | null
          moq_text?: string | null
          oe_numbers?: string[]
          page_path?: string | null
          price_text?: string | null
          published_at?: string | null
          search_text?: string | null
          sku?: string | null
          slug?: string
          source_rank?: string | null
          source_type?: string | null
          source_url?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["content_status"]
          stock_quantity?: number | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          weight_kg?: number | null
          years?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          last_name: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
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
      app_role:
        | "super_admin"
        | "product_manager"
        | "editor"
        | "sales"
        | "viewer"
      content_status: "draft" | "published" | "archived"
      inquiry_status:
        | "new"
        | "qualified"
        | "quoting"
        | "sample"
        | "won"
        | "lost"
        | "spam"
      verification_status: "imported_unverified" | "verified" | "rejected"
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
      app_role: ["super_admin", "product_manager", "editor", "sales", "viewer"],
      content_status: ["draft", "published", "archived"],
      inquiry_status: [
        "new",
        "qualified",
        "quoting",
        "sample",
        "won",
        "lost",
        "spam",
      ],
      verification_status: ["imported_unverified", "verified", "rejected"],
    },
  },
} as const
