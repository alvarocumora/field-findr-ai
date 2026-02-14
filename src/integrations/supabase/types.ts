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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      closing_steps: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          credit_id: string | null
          document_url: string | null
          id: string
          notes: string | null
          reservation_id: string | null
          status: Database["public"]["Enums"]["closing_step_status"]
          step_type: Database["public"]["Enums"]["closing_step_type"]
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          credit_id?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["closing_step_status"]
          step_type: Database["public"]["Enums"]["closing_step_type"]
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          credit_id?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["closing_step_status"]
          step_type?: Database["public"]["Enums"]["closing_step_type"]
        }
        Relationships: [
          {
            foreignKeyName: "closing_steps_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "credits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closing_steps_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_payments: {
        Row: {
          amount: number
          created_at: string
          credit_id: string
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          payment_number: number
          receipt_url: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          credit_id: string
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number: number
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          credit_id?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_number?: number
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_payments_credit_id_fkey"
            columns: ["credit_id"]
            isOneToOne: false
            referencedRelation: "credits"
            referencedColumns: ["id"]
          },
        ]
      }
      credits: {
        Row: {
          buyer_user_id: string | null
          contract_url: string | null
          created_at: string
          down_payment: number
          financed_amount: number
          id: string
          interest_rate: number
          lot_id: string
          monthly_payment: number
          next_payment_date: string | null
          reservation_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["credit_status"]
          term_months: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_user_id?: string | null
          contract_url?: string | null
          created_at?: string
          down_payment?: number
          financed_amount: number
          id?: string
          interest_rate?: number
          lot_id: string
          monthly_payment: number
          next_payment_date?: string | null
          reservation_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["credit_status"]
          term_months: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_user_id?: string | null
          contract_url?: string | null
          created_at?: string
          down_payment?: number
          financed_amount?: number
          id?: string
          interest_rate?: number
          lot_id?: string
          monthly_payment?: number
          next_payment_date?: string | null
          reservation_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["credit_status"]
          term_months?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credits_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          listing_id: string
          name: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          listing_id: string
          name: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          listing_id?: string
          name?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          lot_id: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          preferred_area_max: number | null
          preferred_area_min: number | null
          project_id: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          lot_id?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          preferred_area_max?: number | null
          preferred_area_min?: number | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          lot_id?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          preferred_area_max?: number | null
          preferred_area_min?: number | null
          project_id?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          area_ha: number | null
          area_m2: number | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          featured: boolean | null
          id: string
          images: string[] | null
          is_demo: boolean | null
          lat: number | null
          legal_status: string | null
          lng: number | null
          location: string
          price: number
          region: string | null
          rol: string | null
          status: string | null
          subdivision_eligible: boolean | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
          utilities: Json | null
          views_count: number | null
          zoning: string | null
        }
        Insert: {
          address?: string | null
          area_ha?: number | null
          area_m2?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          is_demo?: boolean | null
          lat?: number | null
          legal_status?: string | null
          lng?: number | null
          location: string
          price: number
          region?: string | null
          rol?: string | null
          status?: string | null
          subdivision_eligible?: boolean | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          utilities?: Json | null
          views_count?: number | null
          zoning?: string | null
        }
        Update: {
          address?: string | null
          area_ha?: number | null
          area_m2?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          is_demo?: boolean | null
          lat?: number | null
          legal_status?: string | null
          lng?: number | null
          location?: string
          price?: number
          region?: string | null
          rol?: string | null
          status?: string | null
          subdivision_eligible?: boolean | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          utilities?: Json | null
          views_count?: number | null
          zoning?: string | null
        }
        Relationships: []
      }
      lots: {
        Row: {
          area: number
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          lot_number: string
          name: string | null
          polygon: Json | null
          price: number | null
          price_per_sqm: number | null
          project_id: string
          reservation_date: string | null
          sale_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area: number
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_number: string
          name?: string | null
          polygon?: Json | null
          price?: number | null
          price_per_sqm?: number | null
          project_id: string
          reservation_date?: string | null
          sale_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: number
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_number?: string
          name?: string | null
          polygon?: Json | null
          price?: number | null
          price_per_sqm?: number | null
          project_id?: string
          reservation_date?: string | null
          sale_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          listing_id: string | null
          read: boolean | null
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          read?: boolean | null
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          listing_id?: string | null
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string | null
          available_lots: number | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          embed_map_url: string | null
          id: string
          kmz_file_url: string | null
          latitude: number | null
          legal_documents: Json | null
          legal_status: string | null
          location: string | null
          longitude: number | null
          name: string
          permits: Json | null
          region: string | null
          reserved_lots: number | null
          rol_number: string | null
          sold_lots: number | null
          status: string | null
          total_area: number | null
          total_lots: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          available_lots?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          embed_map_url?: string | null
          id?: string
          kmz_file_url?: string | null
          latitude?: number | null
          legal_documents?: Json | null
          legal_status?: string | null
          location?: string | null
          longitude?: number | null
          name: string
          permits?: Json | null
          region?: string | null
          reserved_lots?: number | null
          rol_number?: string | null
          sold_lots?: number | null
          status?: string | null
          total_area?: number | null
          total_lots?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          available_lots?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          embed_map_url?: string | null
          id?: string
          kmz_file_url?: string | null
          latitude?: number | null
          legal_documents?: Json | null
          legal_status?: string | null
          location?: string | null
          longitude?: number | null
          name?: string
          permits?: Json | null
          region?: string | null
          reserved_lots?: number | null
          rol_number?: string | null
          sold_lots?: number | null
          status?: string | null
          total_area?: number | null
          total_lots?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_approvals: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["approval_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
        }
        Relationships: [
          {
            foreignKeyName: "property_approvals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          buyer_rut: string | null
          contract_id: string | null
          converted_at: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          lead_id: string | null
          lot_id: string
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          notes: string | null
          paid_at: string | null
          reservation_amount: number
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          buyer_rut?: string | null
          contract_id?: string | null
          converted_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          lead_id?: string | null
          lot_id: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          notes?: string | null
          paid_at?: string | null
          reservation_amount?: number
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          buyer_rut?: string | null
          contract_id?: string | null
          converted_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          lead_id?: string | null
          lot_id?: string
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          notes?: string | null
          paid_at?: string | null
          reservation_amount?: number
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json
          id: string
          name: string
          notifications_enabled: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json
          id?: string
          name: string
          notifications_enabled?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json
          id?: string
          name?: string
          notifications_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mercadopago_payer_id: string | null
          mercadopago_subscription_id: string | null
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mercadopago_payer_id?: string | null
          mercadopago_subscription_id?: string | null
          plan_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mercadopago_payer_id?: string | null
          mercadopago_subscription_id?: string | null
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visit_requests: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          listing_owner_id: string
          notes: string | null
          preferred_date: string
          preferred_time: string | null
          requester_email: string
          requester_name: string
          requester_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          listing_owner_id: string
          notes?: string | null
          preferred_date: string
          preferred_time?: string | null
          requester_email: string
          requester_name: string
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          listing_owner_id?: string
          notes?: string | null
          preferred_date?: string
          preferred_time?: string | null
          requester_email?: string
          requester_name?: string
          requester_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "agent" | "admin"
      approval_status: "pending" | "approved" | "rejected"
      closing_step_status: "pending" | "in_progress" | "completed" | "blocked"
      closing_step_type: "reserva" | "promesa" | "escritura" | "inscripcion_cbr"
      credit_status: "active" | "completed" | "defaulted" | "cancelled"
      payment_status: "pending" | "paid" | "overdue" | "partial"
      reservation_status:
        | "pending_payment"
        | "paid"
        | "expired"
        | "cancelled"
        | "converted"
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
      app_role: ["buyer", "agent", "admin"],
      approval_status: ["pending", "approved", "rejected"],
      closing_step_status: ["pending", "in_progress", "completed", "blocked"],
      closing_step_type: ["reserva", "promesa", "escritura", "inscripcion_cbr"],
      credit_status: ["active", "completed", "defaulted", "cancelled"],
      payment_status: ["pending", "paid", "overdue", "partial"],
      reservation_status: [
        "pending_payment",
        "paid",
        "expired",
        "cancelled",
        "converted",
      ],
    },
  },
} as const
