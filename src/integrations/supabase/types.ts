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
      agent_commissions: {
        Row: {
          agent_id: string
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          lead_id: string | null
          listing_id: string | null
          lot_id: string | null
          notes: string | null
          paid_at: string | null
          project_id: string | null
          referral_amount: number | null
          referral_rate: number | null
          referral_status: string | null
          referring_agent_id: string | null
          reservation_id: string | null
          sale_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          lot_id?: string | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          referral_amount?: number | null
          referral_rate?: number | null
          referral_status?: string | null
          referring_agent_id?: string | null
          reservation_id?: string | null
          sale_amount?: number
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          lot_id?: string | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          referral_amount?: number | null
          referral_rate?: number | null
          referral_status?: string | null
          referring_agent_id?: string | null
          reservation_id?: string | null
          sale_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commissions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commissions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commissions_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_goals: {
        Row: {
          agent_id: string
          commission_achieved: number
          commission_target: number
          created_at: string
          id: string
          leads_achieved: number
          leads_target: number
          notes: string | null
          period: string
          period_end: string
          period_start: string
          sales_achieved: number
          sales_target: number
          units_achieved: number
          units_target: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          commission_achieved?: number
          commission_target?: number
          created_at?: string
          id?: string
          leads_achieved?: number
          leads_target?: number
          notes?: string | null
          period?: string
          period_end: string
          period_start: string
          sales_achieved?: number
          sales_target?: number
          units_achieved?: number
          units_target?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          commission_achieved?: number
          commission_target?: number
          created_at?: string
          id?: string
          leads_achieved?: number
          leads_target?: number
          notes?: string | null
          period?: string
          period_end?: string
          period_start?: string
          sales_achieved?: number
          sales_target?: number
          units_achieved?: number
          units_target?: number
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          scopes?: string[]
          user_id?: string
        }
        Relationships: []
      }
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
      cached_listings: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          fetched_at: string
          id: string
          payload: Json
          source_portals: string[]
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at: string
          fetched_at?: string
          id?: string
          payload: Json
          source_portals?: string[]
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          payload?: Json
          source_portals?: string[]
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
          currency: string
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
          currency?: string
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
          currency?: string
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
      featured_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          new_featured: boolean
          new_until: string | null
          notes: string | null
          previous_featured: boolean | null
          previous_until: string | null
          project_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_featured: boolean
          new_until?: string | null
          notes?: string | null
          previous_featured?: boolean | null
          previous_until?: string | null
          project_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_featured?: boolean
          new_until?: string | null
          notes?: string | null
          previous_featured?: boolean | null
          previous_until?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          last_scored_at: string | null
          lead_score: number | null
          listing_id: string | null
          lot_id: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          preferred_area_max: number | null
          preferred_area_min: number | null
          project_id: string | null
          referral_notes: string | null
          referring_agent_id: string | null
          score_breakdown: Json | null
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
          last_scored_at?: string | null
          lead_score?: number | null
          listing_id?: string | null
          lot_id?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          preferred_area_max?: number | null
          preferred_area_min?: number | null
          project_id?: string | null
          referral_notes?: string | null
          referring_agent_id?: string | null
          score_breakdown?: Json | null
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
          last_scored_at?: string | null
          lead_score?: number | null
          listing_id?: string | null
          lot_id?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          preferred_area_max?: number | null
          preferred_area_min?: number | null
          project_id?: string | null
          referral_notes?: string | null
          referring_agent_id?: string | null
          score_breakdown?: Json | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
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
      listing_designs: {
        Row: {
          created_at: string
          design: Json
          id: string
          listing_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          design: Json
          id?: string
          listing_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          design?: Json
          id?: string
          listing_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          search_vector: unknown
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
          search_vector?: unknown
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
          search_vector?: unknown
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
          elevation_avg: number | null
          features: Json | null
          id: string
          images: string[] | null
          latitude: number | null
          listing_id: string | null
          longitude: number | null
          lot_number: string
          name: string | null
          polygon: Json | null
          price: number | null
          price_per_sqm: number | null
          project_id: string
          reservation_date: string | null
          sale_date: string | null
          slope_category: string | null
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
          elevation_avg?: number | null
          features?: Json | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          lot_number: string
          name?: string | null
          polygon?: Json | null
          price?: number | null
          price_per_sqm?: number | null
          project_id: string
          reservation_date?: string | null
          sale_date?: string | null
          slope_category?: string | null
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
          elevation_avg?: number | null
          features?: Json | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          listing_id?: string | null
          longitude?: number | null
          lot_number?: string
          name?: string | null
          polygon?: Json | null
          price?: number | null
          price_per_sqm?: number | null
          project_id?: string
          reservation_date?: string | null
          sale_date?: string | null
          slope_category?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
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
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          primary_color: string | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          primary_color?: string | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
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
      price_history: {
        Row: {
          currency: string
          id: string
          listing_id: string
          price: number
          recorded_at: string
        }
        Insert: {
          currency?: string
          id?: string
          listing_id: string
          price: number
          recorded_at?: string
        }
        Update: {
          currency?: string
          id?: string
          listing_id?: string
          price?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          email: string | null
          email_notifications: boolean | null
          first_name: string | null
          id: string
          is_public: boolean
          last_name: string | null
          logo_url: string | null
          marketing_emails: boolean | null
          new_listing_alerts: boolean | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          phone: string | null
          preferred_currency: string | null
          preferred_language: string | null
          price_drop_alerts: boolean | null
          public_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          is_public?: boolean
          last_name?: string | null
          logo_url?: string | null
          marketing_emails?: boolean | null
          new_listing_alerts?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          phone?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          price_drop_alerts?: boolean | null
          public_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          is_public?: boolean
          last_name?: string | null
          logo_url?: string | null
          marketing_emails?: boolean | null
          new_listing_alerts?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          phone?: string | null
          preferred_currency?: string | null
          preferred_language?: string | null
          price_drop_alerts?: boolean | null
          public_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_approvals: {
        Row: {
          created_at: string
          id: string
          project_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          available_lots: number | null
          boundary: Json | null
          city: string | null
          commercial_conditions: Json | null
          country: string | null
          created_at: string
          description: string | null
          embed_map_url: string | null
          featured: boolean
          featured_until: string | null
          id: string
          images: string[] | null
          kmz_file_url: string | null
          latitude: number | null
          legal_documents: Json | null
          legal_status: string | null
          location: string | null
          longitude: number | null
          name: string
          organization_id: string | null
          permits: Json | null
          plan_images: string[] | null
          region: string | null
          reservation_deposit: number | null
          reserved_lots: number | null
          rol_number: string | null
          sold_lots: number | null
          status: string | null
          total_area: number | null
          total_lots: number | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          address?: string | null
          available_lots?: number | null
          boundary?: Json | null
          city?: string | null
          commercial_conditions?: Json | null
          country?: string | null
          created_at?: string
          description?: string | null
          embed_map_url?: string | null
          featured?: boolean
          featured_until?: string | null
          id?: string
          images?: string[] | null
          kmz_file_url?: string | null
          latitude?: number | null
          legal_documents?: Json | null
          legal_status?: string | null
          location?: string | null
          longitude?: number | null
          name: string
          organization_id?: string | null
          permits?: Json | null
          plan_images?: string[] | null
          region?: string | null
          reservation_deposit?: number | null
          reserved_lots?: number | null
          rol_number?: string | null
          sold_lots?: number | null
          status?: string | null
          total_area?: number | null
          total_lots?: number | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          address?: string | null
          available_lots?: number | null
          boundary?: Json | null
          city?: string | null
          commercial_conditions?: Json | null
          country?: string | null
          created_at?: string
          description?: string | null
          embed_map_url?: string | null
          featured?: boolean
          featured_until?: string | null
          id?: string
          images?: string[] | null
          kmz_file_url?: string | null
          latitude?: number | null
          legal_documents?: Json | null
          legal_status?: string | null
          location?: string | null
          longitude?: number | null
          name?: string
          organization_id?: string | null
          permits?: Json | null
          plan_images?: string[] | null
          region?: string | null
          reservation_deposit?: number | null
          reserved_lots?: number | null
          rol_number?: string | null
          sold_lots?: number | null
          status?: string | null
          total_area?: number | null
          total_lots?: number | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_id: string
          reward_amount: number | null
          reward_claimed: boolean
          reward_type: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          reward_claimed?: boolean
          reward_type?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          reward_claimed?: boolean
          reward_type?: string | null
          status?: string
        }
        Relationships: []
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
          parcel_design: Json | null
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
          parcel_design?: Json | null
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
          parcel_design?: Json | null
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
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          project_id: string | null
          rating: number
          updated_at: string
          user_id: string
          verified_buyer: boolean
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          project_id?: string | null
          rating: number
          updated_at?: string
          user_id: string
          verified_buyer?: boolean
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          project_id?: string | null
          rating?: number
          updated_at?: string
          user_id?: string
          verified_buyer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      shared_designs: {
        Row: {
          area: number | null
          created_at: string
          created_by: string | null
          design_json: Json
          id: string
          latitude: number | null
          longitude: number | null
          lot_number: string | null
          polygon: Json | null
          title: string | null
          token: string
        }
        Insert: {
          area?: number | null
          created_at?: string
          created_by?: string | null
          design_json: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_number?: string | null
          polygon?: Json | null
          title?: string | null
          token?: string
        }
        Update: {
          area?: number | null
          created_at?: string
          created_by?: string | null
          design_json?: Json
          id?: string
          latitude?: number | null
          longitude?: number | null
          lot_number?: string | null
          polygon?: Json | null
          title?: string | null
          token?: string
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
      tasaciones_publicadas: {
        Row: {
          blockchain_anchor: Json | null
          comuna: string | null
          created_at: string
          direccion: string | null
          fecha_emision: string | null
          firma_data_hash: string | null
          id: string
          lang: string | null
          listing_id: string | null
          payload_hash: string
          payload_json: Json
          pdf_final_path: string | null
          pdf_final_sha256: string | null
          pdf_path: string
          pdf_sha256: string
          publisher_user_id: string
          region: string | null
          revoked_at: string | null
          revoked_reason: string | null
          rol: string | null
          superficie_m2: number | null
          tasador_nombre: string | null
          updated_at: string
          valor_clp: number | null
          valor_m2_uf: number | null
          valor_uf: number | null
          version: number
        }
        Insert: {
          blockchain_anchor?: Json | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          fecha_emision?: string | null
          firma_data_hash?: string | null
          id?: string
          lang?: string | null
          listing_id?: string | null
          payload_hash: string
          payload_json: Json
          pdf_final_path?: string | null
          pdf_final_sha256?: string | null
          pdf_path: string
          pdf_sha256: string
          publisher_user_id: string
          region?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          rol?: string | null
          superficie_m2?: number | null
          tasador_nombre?: string | null
          updated_at?: string
          valor_clp?: number | null
          valor_m2_uf?: number | null
          valor_uf?: number | null
          version?: number
        }
        Update: {
          blockchain_anchor?: Json | null
          comuna?: string | null
          created_at?: string
          direccion?: string | null
          fecha_emision?: string | null
          firma_data_hash?: string | null
          id?: string
          lang?: string | null
          listing_id?: string | null
          payload_hash?: string
          payload_json?: Json
          pdf_final_path?: string | null
          pdf_final_sha256?: string | null
          pdf_path?: string
          pdf_sha256?: string
          publisher_user_id?: string
          region?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          rol?: string | null
          superficie_m2?: number | null
          tasador_nombre?: string | null
          updated_at?: string
          valor_clp?: number | null
          valor_m2_uf?: number | null
          valor_uf?: number | null
          version?: number
        }
        Relationships: []
      }
      tour_scenes: {
        Row: {
          created_at: string | null
          description: string | null
          hotspots: Json | null
          id: string
          name: string
          panorama_url: string
          pitch_default: number | null
          polygon_overlays: Json | null
          position_index: number | null
          project_id: string
          thumbnail_url: string | null
          user_id: string
          yaw_default: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          hotspots?: Json | null
          id?: string
          name: string
          panorama_url: string
          pitch_default?: number | null
          polygon_overlays?: Json | null
          position_index?: number | null
          project_id: string
          thumbnail_url?: string | null
          user_id: string
          yaw_default?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          hotspots?: Json | null
          id?: string
          name?: string
          panorama_url?: string
          pitch_default?: number | null
          polygon_overlays?: Json | null
          position_index?: number | null
          project_id?: string
          thumbnail_url?: string | null
          user_id?: string
          yaw_default?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_documents: {
        Row: {
          created_at: string
          deadline: string | null
          doc_type: Database["public"]["Enums"]["transaction_doc_type"]
          file_name: string | null
          file_url: string | null
          id: string
          notes: string | null
          rejection_reason: string | null
          reservation_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["doc_status"]
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          doc_type: Database["public"]["Enums"]["transaction_doc_type"]
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reservation_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          doc_type?: Database["public"]["Enums"]["transaction_doc_type"]
          file_name?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reservation_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_documents_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
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
      webhook_deliveries: {
        Row: {
          delivered_at: string
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          subscription_id: string
          success: boolean
        }
        Insert: {
          delivered_at?: string
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id: string
          success?: boolean
        }
        Update: {
          delivered_at?: string
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_triggered_at: string | null
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_lot_prices: {
        Args: {
          p_mode: string
          p_only_status?: string
          p_project_id: string
          p_value: number
        }
        Returns: number
      }
      admin_set_project_featured: {
        Args: {
          p_active: boolean
          p_notes?: string
          p_project_id: string
          p_until?: string
        }
        Returns: {
          featured: boolean
          featured_until: string
          project_id: string
        }[]
      }
      create_public_lead: {
        Args: {
          p_email?: string
          p_first_name: string
          p_message?: string
          p_phone?: string
          p_project_id?: string
          p_slug: string
        }
        Returns: string
      }
      create_referral_lead: {
        Args: {
          p_budget_max?: number
          p_budget_min?: number
          p_email?: string
          p_first_name: string
          p_last_name?: string
          p_listing_id: string
          p_notes?: string
          p_phone?: string
        }
        Returns: string
      }
      expire_featured_projects: { Args: never; Returns: number }
      expire_stale_reservations: { Args: never; Returns: number }
      extend_reservation: {
        Args: { p_hours?: number; p_reservation_id: string }
        Returns: string
      }
      find_tasacion_by_hash: {
        Args: { _hash: string }
        Returns: {
          comuna: string
          direccion: string
          fecha_emision: string
          id: string
          matched_field: string
          region: string
          revoked_at: string
          tasador_nombre: string
          valor_clp: number
          valor_uf: number
        }[]
      }
      get_agency_by_slug: {
        Args: { p_slug: string }
        Returns: {
          avatar_url: string
          bio: string
          company_name: string
          created_at: string
          first_name: string
          last_name: string
          logo_url: string
          phone: string
          public_slug: string
          user_id: string
        }[]
      }
      get_shared_design: {
        Args: { p_token: string }
        Returns: {
          area: number
          created_at: string
          design_json: Json
          id: string
          latitude: number
          longitude: number
          lot_number: string
          polygon: Json
          title: string
          token: string
        }[]
      }
      get_tasacion_by_id: {
        Args: { p_id: string }
        Returns: {
          blockchain_anchor: Json | null
          comuna: string | null
          created_at: string
          direccion: string | null
          fecha_emision: string | null
          firma_data_hash: string | null
          id: string
          lang: string | null
          listing_id: string | null
          payload_hash: string
          payload_json: Json
          pdf_final_path: string | null
          pdf_final_sha256: string | null
          pdf_path: string
          pdf_sha256: string
          publisher_user_id: string
          region: string | null
          revoked_at: string | null
          revoked_reason: string | null
          rol: string | null
          superficie_m2: number | null
          tasador_nombre: string | null
          updated_at: string
          valor_clp: number | null
          valor_m2_uf: number | null
          valor_uf: number | null
          version: number
        }[]
        SetofOptions: {
          from: "*"
          to: "tasaciones_publicadas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_tasacion_by_listing: {
        Args: { p_listing_id: string }
        Returns: {
          blockchain_anchor: Json
          created_at: string
          fecha_emision: string
          id: string
          listing_id: string
          revoked_at: string
          tasador_nombre: string
          valor_clp: number
          valor_uf: number
          version: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_commission_paid: {
        Args: { p_commission_id: string }
        Returns: string
      }
      mark_overdue_payments: { Args: never; Returns: undefined }
      mark_referral_paid: { Args: { p_commission_id: string }; Returns: string }
      register_sale:
        | {
            Args: {
              p_commission_rate?: number
              p_notes?: string
              p_reservation_id: string
              p_sale_amount: number
            }
            Returns: string
          }
        | {
            Args: {
              p_commission_rate?: number
              p_lead_id?: string
              p_notes?: string
              p_referral_rate?: number
              p_referring_agent_id?: string
              p_reservation_id: string
              p_sale_amount: number
            }
            Returns: string
          }
      system_activate_featured: {
        Args: { p_days: number; p_payment_ref?: string; p_project_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "buyer" | "agent" | "admin"
      approval_status: "pending" | "approved" | "rejected"
      closing_step_status: "pending" | "in_progress" | "completed" | "blocked"
      closing_step_type: "reserva" | "promesa" | "escritura" | "inscripcion_cbr"
      credit_status: "active" | "completed" | "defaulted" | "cancelled"
      doc_status:
        | "pending"
        | "uploaded"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
      payment_status: "pending" | "paid" | "overdue" | "partial"
      reservation_status:
        | "pending_payment"
        | "paid"
        | "expired"
        | "cancelled"
        | "converted"
      transaction_doc_type:
        | "cedula_identidad"
        | "dominio_vigente"
        | "certificado_hipotecas"
        | "plano_subdivision"
        | "certificado_informaciones_previas"
        | "promesa_compraventa"
        | "escritura_publica"
        | "inscripcion_cbr"
        | "comprobante_pago"
        | "poder_notarial"
        | "certificado_deuda"
        | "otro"
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
      doc_status: [
        "pending",
        "uploaded",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
      payment_status: ["pending", "paid", "overdue", "partial"],
      reservation_status: [
        "pending_payment",
        "paid",
        "expired",
        "cancelled",
        "converted",
      ],
      transaction_doc_type: [
        "cedula_identidad",
        "dominio_vigente",
        "certificado_hipotecas",
        "plano_subdivision",
        "certificado_informaciones_previas",
        "promesa_compraventa",
        "escritura_publica",
        "inscripcion_cbr",
        "comprobante_pago",
        "poder_notarial",
        "certificado_deuda",
        "otro",
      ],
    },
  },
} as const
