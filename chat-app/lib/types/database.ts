export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanup_logs: {
        Row: {
          executed_at: string | null
          id: string
          job_name: string
          records_deleted: number | null
        }
        Insert: {
          executed_at?: string | null
          id?: string
          job_name: string
          records_deleted?: number | null
        }
        Update: {
          executed_at?: string | null
          id?: string
          job_name?: string
          records_deleted?: number | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          notifications_enabled: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          ended_at: string | null
          id: string
          name: string | null
          type: string
          updated_at: string | null
          visitor_session_id: string | null
          widget_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name?: string | null
          type: string
          updated_at?: string | null
          visitor_session_id?: string | null
          widget_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          id?: string
          name?: string | null
          type?: string
          updated_at?: string | null
          visitor_session_id?: string | null
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_visitor_session_id_fkey"
            columns: ["visitor_session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string | null
          id: string
          user1: string
          user2: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1: string
          user2: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user1?: string
          user2?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_user1_fkey"
            columns: ["user1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user2_fkey"
            columns: ["user2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string
          message_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          message_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_mentions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_edited: boolean | null
          is_pinned: boolean | null
          link_previews: Json | null
          pinned_at: string | null
          pinned_by: string | null
          reply_to_id: string | null
          search_vector: unknown
          sender_id: string
          type: string | null
          updated_at: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          link_previews?: Json | null
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
          search_vector?: unknown
          sender_id: string
          type?: string | null
          updated_at?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          is_pinned?: boolean | null
          link_previews?: Json | null
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
          search_vector?: unknown
          sender_id?: string
          type?: string | null
          updated_at?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
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
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          is_platform_admin: boolean
          last_seen_at: string | null
          status: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_platform_admin?: boolean
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_platform_admin?: boolean
          last_seen_at?: string | null
          status?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_name: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          dest_user_id: string
          id: string
          reason: string
          source_user_id: string
        }
        Insert: {
          created_at?: string | null
          dest_user_id: string
          id?: string
          reason: string
          source_user_id: string
        }
        Update: {
          created_at?: string | null
          dest_user_id?: string
          id?: string
          reason?: string
          source_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_dest_user_id_fkey"
            columns: ["dest_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          accent_color: string | null
          bio: string | null
          created_at: string | null
          desktop_notifications: boolean | null
          dnd_enabled: boolean | null
          dnd_end_time: string | null
          dnd_start_time: string | null
          emoji_skin_tone: string | null
          enter_key_behavior: string | null
          font_size: string | null
          high_contrast: boolean | null
          id: string
          link_previews_enabled: boolean | null
          message_density: string | null
          online_status_preference: string | null
          reduce_motion: boolean | null
          send_read_receipts: boolean | null
          send_typing_indicators: boolean | null
          show_online_status: boolean | null
          show_read_receipts: boolean | null
          show_typing_indicator: boolean | null
          sound_notifications: boolean | null
          theme: string | null
          ui_scale: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          bio?: string | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          dnd_enabled?: boolean | null
          dnd_end_time?: string | null
          dnd_start_time?: string | null
          emoji_skin_tone?: string | null
          enter_key_behavior?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          link_previews_enabled?: boolean | null
          message_density?: string | null
          online_status_preference?: string | null
          reduce_motion?: boolean | null
          send_read_receipts?: boolean | null
          send_typing_indicators?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_typing_indicator?: boolean | null
          sound_notifications?: boolean | null
          theme?: string | null
          ui_scale?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string | null
          bio?: string | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          dnd_enabled?: boolean | null
          dnd_end_time?: string | null
          dnd_start_time?: string | null
          emoji_skin_tone?: string | null
          enter_key_behavior?: string | null
          font_size?: string | null
          high_contrast?: boolean | null
          id?: string
          link_previews_enabled?: boolean | null
          message_density?: string | null
          online_status_preference?: string | null
          reduce_motion?: boolean | null
          send_read_receipts?: boolean | null
          send_typing_indicators?: boolean | null
          show_online_status?: boolean | null
          show_read_receipts?: boolean | null
          show_typing_indicator?: boolean | null
          sound_notifications?: boolean | null
          theme?: string | null
          ui_scale?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          id: string
          ip_address: string | null
          last_active_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          last_seen_at: string | null
          metadata: Json | null
          name: string
          session_token: string | null
          widget_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          name: string
          session_token?: string | null
          widget_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          name?: string
          session_token?: string | null
          widget_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_sessions_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      widgets: {
        Row: {
          allowed_origins: string[] | null
          collect_name: boolean | null
          created_at: string | null
          embed_token: string | null
          id: string
          is_active: boolean | null
          name: string
          offline_message: string | null
          position: string | null
          primary_color: string | null
          require_email: boolean | null
          updated_at: string | null
          welcome_message: string | null
          workspace_id: string
        }
        Insert: {
          allowed_origins?: string[] | null
          collect_name?: boolean | null
          created_at?: string | null
          embed_token?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          offline_message?: string | null
          position?: string | null
          primary_color?: string | null
          require_email?: boolean | null
          updated_at?: string | null
          welcome_message?: string | null
          workspace_id: string
        }
        Update: {
          allowed_origins?: string[] | null
          collect_name?: boolean | null
          created_at?: string | null
          embed_token?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          offline_message?: string | null
          position?: string | null
          primary_color?: string | null
          require_email?: boolean | null
          updated_at?: string | null
          welcome_message?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "widgets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          auto_reply_enabled: boolean
          auto_reply_message: string | null
          business_hours: Json | null
          business_hours_enabled: boolean
          created_at: string
          default_offline_message: string | null
          default_primary_color: string | null
          default_welcome_message: string | null
          id: string
          max_conversations_per_agent: number | null
          notify_on_new_conversation: boolean
          notify_on_unassigned_timeout: boolean
          timezone: string | null
          unassigned_timeout_minutes: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          auto_reply_enabled?: boolean
          auto_reply_message?: string | null
          business_hours?: Json | null
          business_hours_enabled?: boolean
          created_at?: string
          default_offline_message?: string | null
          default_primary_color?: string | null
          default_welcome_message?: string | null
          id?: string
          max_conversations_per_agent?: number | null
          notify_on_new_conversation?: boolean
          notify_on_unassigned_timeout?: boolean
          timezone?: string | null
          unassigned_timeout_minutes?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          auto_reply_enabled?: boolean
          auto_reply_message?: string | null
          business_hours?: Json | null
          business_hours_enabled?: boolean
          created_at?: string
          default_offline_message?: string | null
          default_primary_color?: string | null
          default_welcome_message?: string | null
          id?: string
          max_conversations_per_agent?: number | null
          notify_on_new_conversation?: boolean
          notify_on_unassigned_timeout?: boolean
          timezone?: string | null
          unassigned_timeout_minutes?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          include_owners_in_availability: boolean | null
          name: string
          owner_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          include_owners_in_availability?: boolean | null
          name: string
          owner_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          include_owners_in_availability?: boolean | null
          name?: string
          owner_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
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
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_get_dashboard_metrics: { Args: never; Returns: Json }
      admin_log_action: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_target_id?: string
          p_target_type: string
        }
        Returns: string
      }
      admin_regenerate_widget_token: {
        Args: { p_widget_id: string }
        Returns: string
      }
      admin_reset_user_mfa: { Args: { p_user_id: string }; Returns: undefined }
      admin_set_user_suspended: {
        Args: { p_suspended: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_set_workspace_suspended: {
        Args: { p_suspended: boolean; p_workspace_id: string }
        Returns: undefined
      }
      admin_update_setting: {
        Args: { p_key: string; p_value: string }
        Returns: undefined
      }
      cleanup_expired_sessions: { Args: never; Returns: number }
      create_direct_conversation: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      get_allow_signups: { Args: never; Returns: boolean }
      get_unread_count: {
        Args: { conv_id: string; usr_id: string }
        Returns: number
      }
      is_conversation_participant: {
        Args: { conv_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_workspace_admin: { Args: { ws_id: string }; Returns: boolean }
      is_workspace_member: {
        Args: { workspace_uuid: string }
        Returns: boolean
      }
      is_workspace_owner: { Args: { ws_id: string }; Returns: boolean }
      regenerate_widget_token: {
        Args: { p_widget_id: string }
        Returns: string
      }
      revoke_other_sessions: {
        Args: { p_current_session_token: string }
        Returns: number
      }
      revoke_user_session: { Args: { p_session_id: string }; Returns: boolean }
      upsert_user_session: {
        Args: {
          p_ip_address?: string
          p_session_token: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
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

// Utility types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Conversation = Tables<'conversations'>
export type ConversationParticipant = Tables<'conversation_participants'>
export type Message = Tables<'messages'>
export type Notification = Tables<'notifications'>
export type MessageReaction = {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string | null
}

export type MessageReadReceipt = {
  id: string
  message_id: string
  user_id: string
  read_at: string | null
}

// User preferences for settings
export type UserPreferences = {
  id: string
  user_id: string
  // Profile
  bio: string | null
  online_status_preference: 'online' | 'away' | 'dnd' | 'invisible'
  // Appearance
  theme: 'light' | 'dark' | 'system'
  ui_scale: 'compact' | 'comfortable' | 'spacious'
  font_size: 'small' | 'medium' | 'large'
  accent_color: string
  message_density: 'compact' | 'default' | 'relaxed'
  // Messages & Chat
  enter_key_behavior: 'send' | 'newline'
  link_previews_enabled: boolean
  send_typing_indicators: boolean
  send_read_receipts: boolean
  emoji_skin_tone: 'default' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark'
  // Notifications
  desktop_notifications: boolean
  sound_notifications: boolean
  dnd_enabled: boolean
  dnd_start_time: string | null
  dnd_end_time: string | null
  // Privacy
  show_online_status: boolean
  show_read_receipts: boolean
  show_typing_indicator: boolean
  // Accessibility
  reduce_motion: boolean
  high_contrast: boolean
  // Timestamps
  created_at: string
  updated_at: string
}

export type BlockedUser = {
  id: string
  user_id: string
  blocked_user_id: string
  created_at: string
}

export type BlockedUserWithProfile = BlockedUser & {
  blocked_profile: Profile
}

// Widget system types
export type Workspace = Tables<'workspaces'>
export type WorkspaceMember = Tables<'workspace_members'>
export type WorkspaceSettings = Tables<'workspace_settings'>
export type Widget = Tables<'widgets'>
export type VisitorSession = Tables<'visitor_sessions'>

// Workspace role union type
export type WorkspaceRole = 'admin' | 'agent' | 'member'

// Extended workspace with members
export type WorkspaceWithMembers = Workspace & {
  members: (WorkspaceMember & { profile: Profile })[]
  widgets?: Widget[]
}

// Extended widget with workspace
export type WidgetWithWorkspace = Widget & {
  workspace: Workspace
}

// Extended visitor session with widget
export type VisitorSessionWithWidget = VisitorSession & {
  widget: Widget
}

// Extended types with relations
export type ConversationWithParticipants = Conversation & {
  participants: (ConversationParticipant & { profile: Profile })[]
  last_message?: Message & { sender: Profile }
  unread_count?: number
  // Widget conversation extras
  visitor_session?: VisitorSession
  widget?: WidgetWithWorkspace
}

export type MessageWithSender = Message & {
  sender: Profile
  reply_to?: Message & { sender: Profile }
  reactions?: MessageReaction[]
  read_receipts?: MessageReadReceipt[]
  // Client-only: true while an optimistic message is in flight (not yet
  // confirmed by the server). Never persisted; used purely for send feedback.
  pending?: boolean
}

// Widget-specific message type (for visitor messages without full sender profile)
export type WidgetMessage = {
  id: string
  content: string
  conversation_id: string
  created_at: string | null
  type: string | null
  // Visitor info (for visitor-sent messages)
  visitor_name?: string | null
  visitor_email?: string | null
  // Agent info (for agent-sent messages)
  sender?: Profile
  is_from_visitor: boolean
}
