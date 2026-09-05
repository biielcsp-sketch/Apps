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
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      app_terms_versions: {
        Row: {
          content: string
          id: string
          published_at: string
          version: string
        }
        Insert: {
          content: string
          id?: string
          published_at?: string
          version: string
        }
        Update: {
          content?: string
          id?: string
          published_at?: string
          version?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          notes: string | null
          participant_id: string
          registered_at: string | null
          registered_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          notes?: string | null
          participant_id: string
          registered_at?: string | null
          registered_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          notes?: string | null
          participant_id?: string
          registered_at?: string | null
          registered_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_audit_log: {
        Row: {
          created_at: string
          event: Database["public"]["Enums"]["auth_audit_event"]
          id: string
          ip_address: string | null
          metadata: Json | null
          profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event: Database["public"]["Enums"]["auth_audit_event"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event?: Database["public"]["Enums"]["auth_audit_event"]
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_erasure_requests: {
        Row: {
          id: string
          participant_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          requested_by: string | null
          status: string
        }
        Insert: {
          id?: string
          participant_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          id?: string
          participant_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_erasure_requests_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_erasure_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_erasure_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_sources: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          id: string
          label: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          created_at: string
          date: string
          id: string
          leader_id: string
          needs_return: boolean | null
          next_follow_up_date: string | null
          observation: string | null
          participant_id: string
          status: Database["public"]["Enums"]["follow_up_status"]
          type: Database["public"]["Enums"]["follow_up_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          leader_id: string
          needs_return?: boolean | null
          next_follow_up_date?: string | null
          observation?: string | null
          participant_id: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          type: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          leader_id?: string
          needs_return?: boolean | null
          next_follow_up_date?: string | null
          observation?: string | null
          participant_id?: string
          status?: Database["public"]["Enums"]["follow_up_status"]
          type?: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          address: string | null
          available_days: string[] | null
          capacity: number
          created_at: string
          host_profile_id: string | null
          id: string
          latitude: number | null
          leader_id: string
          longitude: number | null
          meeting_time: string | null
          name: string
          region: string | null
          status: Database["public"]["Enums"]["group_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          available_days?: string[] | null
          capacity: number
          created_at?: string
          host_profile_id?: string | null
          id?: string
          latitude?: number | null
          leader_id: string
          longitude?: number | null
          meeting_time?: string | null
          name: string
          region?: string | null
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          available_days?: string[] | null
          capacity?: number
          created_at?: string
          host_profile_id?: string | null
          id?: string
          latitude?: number | null
          leader_id?: string
          longitude?: number | null
          meeting_time?: string | null
          name?: string
          region?: string | null
          status?: Database["public"]["Enums"]["group_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
        ]
      }
      leaders: {
        Row: {
          admin_notes: string | null
          availability: Json | null
          city: string | null
          created_at: string
          id: string
          joined_at: string
          max_capacity: number
          meeting_address: string | null
          neighborhood: string | null
          profile_id: string
          region: string | null
          status: Database["public"]["Enums"]["leader_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          availability?: Json | null
          city?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          max_capacity?: number
          meeting_address?: string | null
          neighborhood?: string | null
          profile_id: string
          region?: string | null
          status?: Database["public"]["Enums"]["leader_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          availability?: Json | null
          city?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          max_capacity?: number
          meeting_address?: string | null
          neighborhood?: string | null
          profile_id?: string
          region?: string | null
          status?: Database["public"]["Enums"]["leader_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          participant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          participant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          date: string
          group_id: string
          id: string
          leader_id: string
          location: string | null
          ministered_by: string | null
          status: Database["public"]["Enums"]["meeting_status"]
          time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          group_id: string
          id?: string
          leader_id: string
          location?: string | null
          ministered_by?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          group_id?: string
          id?: string
          leader_id?: string
          location?: string | null
          ministered_by?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json | null
          profile_id: string
          read: boolean
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id: string
          read?: boolean
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          profile_id?: string
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_contact_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          participant_id: string
          status: Database["public"]["Enums"]["contact_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          participant_id: string
          status: Database["public"]["Enums"]["contact_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          participant_id?: string
          status?: Database["public"]["Enums"]["contact_status"]
        }
        Relationships: [
          {
            foreignKeyName: "participant_contact_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_contact_status_history_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_leader_history: {
        Row: {
          changed_by: string | null
          created_at: string
          end_date: string | null
          group_id: string | null
          id: string
          leader_id: string
          participant_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          end_date?: string | null
          group_id?: string | null
          id?: string
          leader_id: string
          participant_id: string
          reason?: string | null
          start_date?: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          end_date?: string | null
          group_id?: string | null
          id?: string
          leader_id?: string
          participant_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_leader_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_leader_history_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_leader_history_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_leader_history_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          participant_id: string
          status: Database["public"]["Enums"]["participant_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          participant_id: string
          status: Database["public"]["Enums"]["participant_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          participant_id?: string
          status?: Database["public"]["Enums"]["participant_status"]
        }
        Relationships: [
          {
            foreignKeyName: "participant_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_status_history_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          address: string | null
          admin_notes: string | null
          anonymized_at: string | null
          availability_days: string[] | null
          availability_period: string[] | null
          birth_date: string | null
          city: string | null
          consent_accepted_at: string | null
          consent_method: string | null
          consent_version: string | null
          contact_status: Database["public"]["Enums"]["contact_status"]
          created_at: string
          current_group_id: string | null
          current_leader_id: string | null
          deleted_at: string | null
          email: string | null
          enrollment_date: string
          enrollment_source: string | null
          full_name: string
          geo_lat: number | null
          geo_lng: number | null
          home_meeting_ok: boolean | null
          id: string
          location_preference: string | null
          neighborhood: string | null
          other_notes: string | null
          phone: string | null
          preferred_name: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["participant_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          anonymized_at?: string | null
          availability_days?: string[] | null
          availability_period?: string[] | null
          birth_date?: string | null
          city?: string | null
          consent_accepted_at?: string | null
          consent_method?: string | null
          consent_version?: string | null
          contact_status?: Database["public"]["Enums"]["contact_status"]
          created_at?: string
          current_group_id?: string | null
          current_leader_id?: string | null
          deleted_at?: string | null
          email?: string | null
          enrollment_date?: string
          enrollment_source?: string | null
          full_name: string
          geo_lat?: number | null
          geo_lng?: number | null
          home_meeting_ok?: boolean | null
          id?: string
          location_preference?: string | null
          neighborhood?: string | null
          other_notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          anonymized_at?: string | null
          availability_days?: string[] | null
          availability_period?: string[] | null
          birth_date?: string | null
          city?: string | null
          consent_accepted_at?: string | null
          consent_method?: string | null
          consent_version?: string | null
          contact_status?: Database["public"]["Enums"]["contact_status"]
          created_at?: string
          current_group_id?: string | null
          current_leader_id?: string | null
          deleted_at?: string | null
          email?: string | null
          enrollment_date?: string
          enrollment_source?: string | null
          full_name?: string
          geo_lat?: number | null
          geo_lng?: number | null
          home_meeting_ok?: boolean | null
          id?: string
          location_preference?: string | null
          neighborhood?: string | null
          other_notes?: string | null
          phone?: string | null
          preferred_name?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_current_group_id_fkey"
            columns: ["current_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_current_leader_id_fkey"
            columns: ["current_leader_id"]
            isOneToOne: false
            referencedRelation: "leaders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      rate_limit_events: {
        Row: {
          created_at: string
          id: number
          key: string
        }
        Insert: {
          created_at?: string
          id?: never
          key: string
        }
        Update: {
          created_at?: string
          id?: never
          key?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          id: string
          mime_type: string
          reference_month: string
          size_bytes: number
          storage_path: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          id?: string
          mime_type: string
          reference_month: string
          size_bytes: number
          storage_path: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          id?: string
          mime_type?: string
          reference_month?: string
          size_bytes?: number
          storage_path?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      app_check_claim_account_rate_limit: {
        Args: { p_key: string }
        Returns: boolean
      }
      app_check_erasure_rate_limit: {
        Args: { p_key: string }
        Returns: boolean
      }
      app_check_login_rate_limit: { Args: { p_key: string }; Returns: boolean }
      app_check_participant_write_rate_limit: {
        Args: { p_key: string }
        Returns: boolean
      }
      app_check_public_enrollment_rate_limit: {
        Args: { p_key: string }
        Returns: boolean
      }
      app_current_leader_id: { Args: never; Returns: string }
      app_current_participant_id: { Args: never; Returns: string }
      app_hosted_group_id: { Args: never; Returns: string }
      app_is_admin: { Args: never; Returns: boolean }
      app_is_responsible_for_participant: {
        Args: { p_participant_id: string }
        Returns: boolean
      }
      app_log_audit_event: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_entity: string
          // uuid nullable no banco: nem toda entidade auditável tem id uuid
          p_entity_id: string | null
        }
        Returns: undefined
      }
      app_log_auth_event: {
        Args: {
          p_event: Database["public"]["Enums"]["auth_audit_event"]
          p_ip_address: string
          p_metadata?: Json
          p_profile_id: string
          p_user_agent: string
        }
        Returns: undefined
      }
      app_rate_limit_hit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      app_revoke_user_sessions: {
        Args: { p_profile_id: string }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: "presente" | "ausente" | "justificou" | "nao_informado"
      auth_audit_event:
        | "login_success"
        | "login_failed"
        | "logout"
        | "password_reset_requested"
        | "access_denied"
        | "session_revoked"
      contact_status:
        | "em_processo"
        | "primeira_visita"
        | "segunda_visita"
        | "terceira_visita"
        | "membro"
      follow_up_status: "normal" | "atencao" | "acompanhamento_necessario"
      follow_up_type:
        | "encontro"
        | "ligacao"
        | "whatsapp"
        | "visita"
        | "oracao"
        | "acompanhamento_pastoral"
        | "outro"
      group_status: "ativo" | "inativo" | "lotado"
      leader_status: "ativa" | "inativa"
      meeting_status: "planejado" | "confirmado" | "realizado" | "cancelado"
      participant_status:
        | "nova_inscricao"
        | "aguardando_distribuicao"
        | "distribuida"
        | "ativa"
        | "acompanhamento"
        | "inativa"
      user_role:
        | "admin"
        | "lider"
        | "participante"
        | "desenvolvedor"
        | "co_lider"
        | "anfitria"
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
      attendance_status: ["presente", "ausente", "justificou", "nao_informado"],
      auth_audit_event: [
        "login_success",
        "login_failed",
        "logout",
        "password_reset_requested",
        "access_denied",
        "session_revoked",
      ],
      contact_status: [
        "em_processo",
        "primeira_visita",
        "segunda_visita",
        "terceira_visita",
        "membro",
      ],
      follow_up_status: ["normal", "atencao", "acompanhamento_necessario"],
      follow_up_type: [
        "encontro",
        "ligacao",
        "whatsapp",
        "visita",
        "oracao",
        "acompanhamento_pastoral",
        "outro",
      ],
      group_status: ["ativo", "inativo", "lotado"],
      leader_status: ["ativa", "inativa"],
      meeting_status: ["planejado", "confirmado", "realizado", "cancelado"],
      participant_status: [
        "nova_inscricao",
        "aguardando_distribuicao",
        "distribuida",
        "ativa",
        "acompanhamento",
        "inativa",
      ],
      user_role: [
        "admin",
        "lider",
        "participante",
        "desenvolvedor",
        "co_lider",
        "anfitria",
      ],
    },
  },
} as const
