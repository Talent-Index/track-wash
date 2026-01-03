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
      booking_activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          booking_id: string
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          booking_id: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_activity_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_code: string | null
          branch_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          location_address: string | null
          location_area: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_id: string | null
          service_type: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          booking_code?: string | null
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          location_address?: string | null
          location_area?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_id?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          booking_code?: string | null
          branch_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          location_address?: string | null
          location_area?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_id?: string | null
          service_type?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          business_id: string
          county: string | null
          created_at: string
          id: string
          is_active: boolean | null
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          town: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          county?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          town?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          county?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          town?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          booking_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          operator_id: string | null
          rating: number | null
          review: string | null
          started_at: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          rating?: number | null
          review?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          operator_id?: string | null
          rating?: number | null
          review?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          free_washes_earned: number
          free_washes_redeemed: number
          id: string
          updated_at: string
          washes_count: number
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          free_washes_earned?: number
          free_washes_redeemed?: number
          id?: string
          updated_at?: string
          washes_count?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          free_washes_earned?: number
          free_washes_redeemed?: number
          id?: string
          updated_at?: string
          washes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          booking_id: string | null
          channel: string
          created_at: string
          error: string | null
          id: string
          recipient: string | null
          status: string | null
          template: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          recipient?: string | null
          status?: string | null
          template?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          recipient?: string | null
          status?: string | null
          template?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_invites: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invite_code: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          invite_code: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_invites_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          branch_id: string
          created_at: string
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operators_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kes: number | null
          amount_usd: number | null
          booking_id: string
          chain_id: number | null
          created_at: string
          id: string
          mpesa_checkout_request_id: string | null
          mpesa_merchant_request_id: string | null
          mpesa_receipt_number: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone_number: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          token_symbol: string | null
          tx_hash: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          amount_kes?: number | null
          amount_usd?: number | null
          booking_id: string
          chain_id?: number | null
          created_at?: string
          id?: string
          mpesa_checkout_request_id?: string | null
          mpesa_merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          phone_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          token_symbol?: string | null
          tx_hash?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          amount_kes?: number | null
          amount_usd?: number | null
          booking_id?: string
          chain_id?: number | null
          created_at?: string
          id?: string
          mpesa_checkout_request_id?: string | null
          mpesa_merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          phone_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          token_symbol?: string | null
          tx_hash?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          business_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price_kes: number
          price_usd: number | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price_kes: number
          price_usd?: number | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_kes?: number
          price_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          license_plate: string | null
          make: string
          model: string
          owner_id: string
          updated_at: string
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          license_plate?: string | null
          make: string
          model: string
          owner_id: string
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          license_plate?: string | null
          make?: string
          model?: string
          owner_id?: string
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      washes: {
        Row: {
          amount: number
          branch_id: string
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          operator_id: string
          payment_method: string
          service_type: string
          vehicle_plate: string | null
          vehicle_type: string | null
        }
        Insert: {
          amount: number
          branch_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          operator_id: string
          payment_method?: string
          service_type: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          operator_id?: string
          payment_method?: string
          service_type?: string
          vehicle_plate?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "washes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "washes_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_booking_code: { Args: never; Returns: string }
      generate_invite_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      job_status:
        | "created"
        | "paid"
        | "confirmed"
        | "in_progress"
        | "ready"
        | "completed"
        | "cancelled"
      payment_method: "mpesa" | "crypto" | "cash"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      user_role: "customer" | "operator" | "owner" | "admin"
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
      job_status: [
        "created",
        "paid",
        "confirmed",
        "in_progress",
        "ready",
        "completed",
        "cancelled",
      ],
      payment_method: ["mpesa", "crypto", "cash"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      user_role: ["customer", "operator", "owner", "admin"],
    },
  },
} as const
