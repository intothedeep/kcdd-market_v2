export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      campaign_details: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          campaign_id: string
          change_summary: string | null
          changed_by: string
          content: Json
          created_at: string
          id: string
          review_note: string | null
          status: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id: string
          change_summary?: string | null
          changed_by: string
          content: Json
          created_at?: string
          id?: string
          review_note?: string | null
          status?: string
          version: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          campaign_id?: string
          change_summary?: string | null
          changed_by?: string
          content?: Json
          created_at?: string
          id?: string
          review_note?: string | null
          status?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_details_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          campaign_id: string
          created_at: string | null
          id: string
          is_public: boolean | null
          question: string
          status: string | null
          submitter_email: string | null
          submitter_name: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          campaign_id: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          question: string
          status?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          campaign_id?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          question?: string
          status?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_questions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_reports: {
        Row: {
          admin_notes: string | null
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_email: string | null
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_email?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_email?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          amount_raised: number | null
          created_at: string | null
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          first_approved_at: string | null
          id: string
          last_edit_approved_at: string | null
          last_edited_at: string | null
          organization_id: string | null
          requires_reapproval: boolean
          slug: string | null
          supporters_count: number | null
          updated_at: string | null
        }
        Insert: {
          amount_raised?: number | null
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          first_approved_at?: string | null
          id?: string
          last_edit_approved_at?: string | null
          last_edited_at?: string | null
          organization_id?: string | null
          requires_reapproval?: boolean
          slug?: string | null
          supporters_count?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_raised?: number | null
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          first_approved_at?: string | null
          id?: string
          last_edit_approved_at?: string | null
          last_edited_at?: string | null
          organization_id?: string | null
          requires_reapproval?: boolean
          slug?: string | null
          supporters_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      cause_areas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      challenge_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      donor_cause_areas: {
        Row: {
          cause_area_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          cause_area_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          cause_area_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_cause_areas_cause_area_id_fkey"
            columns: ["cause_area_id"]
            isOneToOne: false
            referencedRelation: "cause_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_cause_areas_cause_area_id_fkey"
            columns: ["cause_area_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["cause_area_id"]
          },
        ]
      }
      donor_documents: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          donation_amount: number | null
          donation_date: string | null
          donor_email: string | null
          donor_name: string | null
          file_url: string | null
          id: string
          name: string
          organization_ein: string | null
          organization_id: string | null
          organization_name: string | null
          quarter: number | null
          receipt_number: string | null
          request_id: string | null
          size: string | null
          status: string | null
          transaction_id: string | null
          type: string
          user_id: string
          year: number
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          donation_amount?: number | null
          donation_date?: string | null
          donor_email?: string | null
          donor_name?: string | null
          file_url?: string | null
          id?: string
          name: string
          organization_ein?: string | null
          organization_id?: string | null
          organization_name?: string | null
          quarter?: number | null
          receipt_number?: string | null
          request_id?: string | null
          size?: string | null
          status?: string | null
          transaction_id?: string | null
          type: string
          user_id: string
          year: number
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          donation_amount?: number | null
          donation_date?: string | null
          donor_email?: string | null
          donor_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
          organization_ein?: string | null
          organization_id?: string | null
          organization_name?: string | null
          quarter?: number | null
          receipt_number?: string | null
          request_id?: string | null
          size?: string | null
          status?: string | null
          transaction_id?: string | null
          type?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "donor_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      donor_profiles: {
        Row: {
          allow_leaderboard: boolean | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          location: string | null
          max_per_request: number | null
          name: string | null
          notification_preferences: Json | null
          phone: string | null
          profile_picture_url: string | null
          profile_visibility: string | null
          service_area_zipcode: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          allow_leaderboard?: boolean | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          location?: string | null
          max_per_request?: number | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          service_area_zipcode?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          allow_leaderboard?: boolean | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          location?: string | null
          max_per_request?: number | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          profile_picture_url?: string | null
          profile_visibility?: string | null
          service_area_zipcode?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "request_details"
            referencedColumns: ["donor_id"]
          },
          {
            foreignKeyName: "donor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fulfillment_records: {
        Row: {
          confirmed_at: string | null
          confirmed_by_cbo: boolean | null
          created_at: string | null
          donor_id: string
          fulfillment_method: string | null
          id: string
          notes: string | null
          request_id: string
          tracking_number: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by_cbo?: boolean | null
          created_at?: string | null
          donor_id: string
          fulfillment_method?: string | null
          id?: string
          notes?: string | null
          request_id: string
          tracking_number?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by_cbo?: boolean | null
          created_at?: string | null
          donor_id?: string
          fulfillment_method?: string | null
          id?: string
          notes?: string | null
          request_id?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_records_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["donor_id"]
          },
          {
            foreignKeyName: "fulfillment_records_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_records_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          dedupe_key: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          kind: string
          link_url: string | null
          payload: Json
          read_at: string | null
          recipient_clerk_user_id: string
        }
        Insert: {
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind: string
          link_url?: string | null
          payload?: Json
          read_at?: string | null
          recipient_clerk_user_id: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          kind?: string
          link_url?: string | null
          payload?: Json
          read_at?: string | null
          recipient_clerk_user_id?: string
        }
        Relationships: []
      }
      organization_cause_areas: {
        Row: {
          cause_area_id: string
          id: string
          organization_id: string
        }
        Insert: {
          cause_area_id: string
          id?: string
          organization_id: string
        }
        Update: {
          cause_area_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_cause_areas_cause_area_id_fkey"
            columns: ["cause_area_id"]
            isOneToOne: false
            referencedRelation: "cause_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_cause_areas_cause_area_id_fkey"
            columns: ["cause_area_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["cause_area_id"]
          },
          {
            foreignKeyName: "organization_cause_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_cause_areas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          name: string
          organization_id: string
          size: string | null
          status: string | null
          type: string
          updated_at: string | null
          uploaded_by: string
          year: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          organization_id: string
          size?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          uploaded_by: string
          year?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          organization_id?: string
          size?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          uploaded_by?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_populations: {
        Row: {
          created_at: string | null
          id: string
          identity_category_id: string
          organization_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          identity_category_id: string
          organization_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          identity_category_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_populations_identity_category_id_fkey"
            columns: ["identity_category_id"]
            isOneToOne: false
            referencedRelation: "identity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_populations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_populations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_team_members: {
        Row: {
          bio: string | null
          created_at: string | null
          display_order: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          photo_url: string | null
          role: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          photo_url?: string | null
          role?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          photo_url?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organization_updates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          organization_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          organization_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          organization_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_updates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          default_campaign_template: Json | null
          description: string | null
          ein: string | null
          email: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          logo_emoji: string | null
          logo_url: string | null
          mission: string
          name: string
          organization_size: string | null
          organization_type: string | null
          phone: string | null
          program_description: string | null
          service_area_description: string | null
          slug: string | null
          social_links: Json | null
          state: string | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_connected_at: string | null
          stripe_details_submitted: boolean | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          tagline: string | null
          technology_barriers: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string | null
          user_id: string
          website: string | null
          year_founded: number | null
          youtube_url: string | null
          zipcode: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          default_campaign_template?: Json | null
          description?: string | null
          ein?: string | null
          email: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          mission: string
          name: string
          organization_size?: string | null
          organization_type?: string | null
          phone?: string | null
          program_description?: string | null
          service_area_description?: string | null
          slug?: string | null
          social_links?: Json | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_connected_at?: string | null
          stripe_details_submitted?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tagline?: string | null
          technology_barriers?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
          year_founded?: number | null
          youtube_url?: string | null
          zipcode: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          default_campaign_template?: Json | null
          description?: string | null
          ein?: string | null
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          logo_emoji?: string | null
          logo_url?: string | null
          mission?: string
          name?: string
          organization_size?: string | null
          organization_type?: string | null
          phone?: string | null
          program_description?: string | null
          service_area_description?: string | null
          slug?: string | null
          social_links?: Json | null
          state?: string | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_connected_at?: string | null
          stripe_details_submitted?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          tagline?: string | null
          technology_barriers?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
          year_founded?: number | null
          youtube_url?: string | null
          zipcode?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "request_details"
            referencedColumns: ["donor_id"]
          },
          {
            foreignKeyName: "organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_total: number
          campaign_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          donor_id: string
          error_message: string | null
          id: string
          metadata: Json | null
          organization_amount: number
          organization_id: string
          platform_fee: number
          request_id: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string
          stripe_transfer_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_total: number
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          donor_id: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_amount: number
          organization_id: string
          platform_fee: number
          request_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id: string
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_total?: number
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          donor_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_amount?: number
          organization_id?: string
          platform_fee?: number
          request_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string
          stripe_transfer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "payment_transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
          value_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
          value_type?: string | null
        }
        Relationships: []
      }
      request_challenge_categories: {
        Row: {
          challenge_category_id: string
          id: string
          request_id: string
        }
        Insert: {
          challenge_category_id: string
          id?: string
          request_id: string
        }
        Update: {
          challenge_category_id?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_challenge_categories_challenge_category_id_fkey"
            columns: ["challenge_category_id"]
            isOneToOne: false
            referencedRelation: "challenge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_challenge_categories_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_challenge_categories_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_history: {
        Row: {
          changed_by_id: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["request_status_enum"]
          note: string | null
          old_status: Database["public"]["Enums"]["request_status_enum"] | null
          request_id: string
        }
        Insert: {
          changed_by_id?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["request_status_enum"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status_enum"] | null
          request_id: string
        }
        Update: {
          changed_by_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["request_status_enum"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["request_status_enum"] | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["donor_id"]
          },
          {
            foreignKeyName: "request_history_changed_by_id_fkey"
            columns: ["changed_by_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_identity_categories: {
        Row: {
          id: string
          identity_category_id: string
          request_id: string
        }
        Insert: {
          id?: string
          identity_category_id: string
          request_id: string
        }
        Update: {
          id?: string
          identity_category_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_identity_categories_identity_category_id_fkey"
            columns: ["identity_category_id"]
            isOneToOne: false
            referencedRelation: "identity_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_identity_categories_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_identity_categories_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          recipient_id: string
          request_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          recipient_id: string
          request_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          recipient_id?: string
          request_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["donor_id"]
          },
          {
            foreignKeyName: "request_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          amount: number
          cause_area_id: string
          claimed_at: string | null
          created_at: string | null
          denial_reason: string | null
          denied_at: string | null
          description: string
          donor_id: string | null
          donor_note: string | null
          fulfilled_at: string | null
          id: string
          organization_id: string
          payment_intent_id: string | null
          program_region_county:
            | Database["public"]["Enums"]["county_enum"]
            | null
          program_region_metro:
            | Database["public"]["Enums"]["program_region_metro_enum"]
            | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["request_status_enum"]
          updated_at: string | null
          urgency: Database["public"]["Enums"]["urgency_enum"]
          zipcode: string
        }
        Insert: {
          amount: number
          cause_area_id: string
          claimed_at?: string | null
          created_at?: string | null
          denial_reason?: string | null
          denied_at?: string | null
          description: string
          donor_id?: string | null
          donor_note?: string | null
          fulfilled_at?: string | null
          id?: string
          organization_id: string
          payment_intent_id?: string | null
          program_region_county?:
            | Database["public"]["Enums"]["county_enum"]
            | null
          program_region_metro?:
            | Database["public"]["Enums"]["program_region_metro_enum"]
            | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["request_status_enum"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_enum"]
          zipcode: string
        }
        Update: {
          amount?: number
          cause_area_id?: string
          claimed_at?: string | null
          created_at?: string | null
          denial_reason?: string | null
          denied_at?: string | null
          description?: string
          donor_id?: string | null
          donor_note?: string | null
          fulfilled_at?: string | null
          id?: string
          organization_id?: string
          payment_intent_id?: string | null
          program_region_county?:
            | Database["public"]["Enums"]["county_enum"]
            | null
          program_region_metro?:
            | Database["public"]["Enums"]["program_region_metro_enum"]
            | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["request_status_enum"]
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["urgency_enum"]
          zipcode?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_cause_area_id_fkey"
            columns: ["cause_area_id"]
            isOneToOne: false
            referencedRelation: "cause_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_cause_area_id_fkey"
            columns: ["cause_area_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["cause_area_id"]
          },
          {
            foreignKeyName: "requests_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["donor_id"]
          },
          {
            foreignKeyName: "requests_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "request_details"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      slack_notification_queue: {
        Row: {
          attempt_count: number
          channel: string
          dedupe_key: string
          id: string
          last_error: string | null
          payload: Json
          queued_at: string
          sent_at: string | null
          status: string
        }
        Insert: {
          attempt_count?: number
          channel?: string
          dedupe_key: string
          id?: string
          last_error?: string | null
          payload: Json
          queued_at?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempt_count?: number
          channel?: string
          dedupe_key?: string
          id?: string
          last_error?: string | null
          payload?: Json
          queued_at?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      stripe_connect_events: {
        Row: {
          created_at: string | null
          data: Json
          error_message: string | null
          event_type: string
          id: string
          processed: boolean | null
          stripe_account_id: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          error_message?: string | null
          event_type: string
          id?: string
          processed?: boolean | null
          stripe_account_id?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          error_message?: string | null
          event_type?: string
          id?: string
          processed?: boolean | null
          stripe_account_id?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      stripe_disputes: {
        Row: {
          amount: number
          charge_id: string | null
          created_at: string | null
          currency: string | null
          dispute_id: string
          evidence_due_by: string | null
          payment_intent_id: string | null
          reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          charge_id?: string | null
          created_at?: string | null
          currency?: string | null
          dispute_id: string
          evidence_due_by?: string | null
          payment_intent_id?: string | null
          reason?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          charge_id?: string | null
          created_at?: string | null
          currency?: string | null
          dispute_id?: string
          evidence_due_by?: string | null
          payment_intent_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          event_id: string
          event_type: string
          payload: Json | null
          received_at: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          payload?: Json | null
          received_at?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          payload?: Json | null
          received_at?: string | null
        }
        Relationships: []
      }
      support_contact_info: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          label: string
          sort_order: number | null
          type: string
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          sort_order?: number | null
          type: string
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          sort_order?: number | null
          type?: string
          value?: string
        }
        Relationships: []
      }
      support_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          onboarding_complete: boolean | null
          org_tier: string
          phone: string | null
          profile_picture_url: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type_enum"]
          verification_status: string
          vetting_note: string | null
          wants_updates: boolean | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          onboarding_complete?: boolean | null
          org_tier?: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type_enum"]
          verification_status?: string
          vetting_note?: string | null
          wants_updates?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          onboarding_complete?: boolean | null
          org_tier?: string
          phone?: string | null
          profile_picture_url?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type_enum"]
          verification_status?: string
          vetting_note?: string | null
          wants_updates?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      donor_annual_summaries: {
        Row: {
          donation_count: number | null
          organizations: string[] | null
          tax_deductible: number | null
          total_donations: number | null
          user_id: string | null
          year: number | null
        }
        Relationships: []
      }
      request_details: {
        Row: {
          amount: number | null
          cause_area_id: string | null
          cause_area_name: string | null
          claimed_at: string | null
          created_at: string | null
          description: string | null
          donor_id: string | null
          donor_note: string | null
          fulfilled_at: string | null
          id: string | null
          organization_id: string | null
          organization_logo: string | null
          organization_logo_emoji: string | null
          organization_name: string | null
          organization_vetted: boolean | null
          program_region_county:
            | Database["public"]["Enums"]["county_enum"]
            | null
          program_region_metro:
            | Database["public"]["Enums"]["program_region_metro_enum"]
            | null
          status: Database["public"]["Enums"]["request_status_enum"] | null
          updated_at: string | null
          urgency: Database["public"]["Enums"]["urgency_enum"] | null
          zipcode: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      append_lifecycle: {
        Args: { p_event: Json; p_stripe_payment_intent_id: string }
        Returns: undefined
      }
      campaign_has_approved_detail: {
        Args: { p_campaign_id: string }
        Returns: boolean
      }
      clerk_user_id: { Args: never; Returns: string }
      create_campaign_with_detail: {
        Args: {
          p_change_summary?: string
          p_content: Json
          p_created_by: string
          p_organization_id: string
          p_slug: string
        }
        Returns: Json
      }
      generate_receipt_number: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      process_charge_refunded: {
        Args: {
          p_charge_id: string
          p_event_id: string
          p_event_type: string
          p_lifecycle_entry: Json
          p_new_status: string
          p_payload: Json
          p_payment_intent_id: string
        }
        Returns: undefined
      }
      process_dispute_closed: {
        Args: {
          p_dispute_amount_cents: number
          p_event_id: string
          p_event_type: string
          p_is_dispute_lost: boolean
          p_is_full_dispute: boolean
          p_lifecycle_entry: Json
          p_new_status: string
          p_payload: Json
          p_payment_intent_id: string
        }
        Returns: undefined
      }
      process_payment_failed: {
        Args: {
          p_error_message: string
          p_event_id: string
          p_event_type: string
          p_lifecycle_entry: Json
          p_payload: Json
          p_payment_intent_id: string
        }
        Returns: undefined
      }
      process_payment_succeeded: {
        Args: {
          p_amount_cents: number
          p_campaign_id: string
          p_charge_id: string
          p_donor_id: string
          p_event_id: string
          p_event_type: string
          p_lifecycle_entry: Json
          p_organization_id: string
          p_payload: Json
          p_payment_intent_id: string
          p_request_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      county_enum:
        | "cass_mo"
        | "clay_mo"
        | "jackson_mo"
        | "lafayette_mo"
        | "platte_mo"
        | "ray_mo"
        | "johnson_ks"
        | "leavenworth_ks"
        | "wyandotte_ks"
      program_region_metro_enum: "all_kc_metro" | "kc_metro_mo" | "kc_metro_ks"
      request_status_enum: "open" | "claimed" | "fulfilled" | "denied"
      urgency_enum: "low" | "medium" | "high"
      user_type_enum: "admin" | "cbo" | "donor"
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
      county_enum: [
        "cass_mo",
        "clay_mo",
        "jackson_mo",
        "lafayette_mo",
        "platte_mo",
        "ray_mo",
        "johnson_ks",
        "leavenworth_ks",
        "wyandotte_ks",
      ],
      program_region_metro_enum: ["all_kc_metro", "kc_metro_mo", "kc_metro_ks"],
      request_status_enum: ["open", "claimed", "fulfilled", "denied"],
      urgency_enum: ["low", "medium", "high"],
      user_type_enum: ["admin", "cbo", "donor"],
    },
  },
} as const

