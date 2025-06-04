export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          pib: string | null
          taxation_type: string | null
          porez_amount: string | null
          pio_amount: string | null
          zdravstveno_amount: string | null
          nezaposlenost_amount: string | null
          yearly_revenue_limit: string | null
          has_completed_setup: boolean | null
          has_seen_welcome_guide: boolean | null
          created_at: string
        }
        Insert: {
          id: string
          pib?: string | null
          taxation_type?: string | null
          porez_amount?: string | null
          pio_amount?: string | null
          zdravstveno_amount?: string | null
          nezaposlenost_amount?: string | null
          yearly_revenue_limit?: string | null
          has_completed_setup?: boolean | null
          has_seen_welcome_guide?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          pib?: string | null
          taxation_type?: string | null
          porez_amount?: string | null
          pio_amount?: string | null
          zdravstveno_amount?: string | null
          nezaposlenost_amount?: string | null
          yearly_revenue_limit?: string | null
          has_completed_setup?: boolean | null
          has_seen_welcome_guide?: boolean | null
          created_at?: string
        }
      }
      payment_details: {
        Row: {
          id: string
          user_id: string | null
          payment_type: string | null
          recipient: string | null
          recipient_location: string | null
          model: string | null
          reference_number: string | null
          payment_purpose: string | null
          account_number: string | null
          payment_code: string | null
          amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_type: string
          recipient?: string | null
          recipient_location?: string | null
          model?: string | null
          reference_number?: string | null
          payment_purpose?: string | null
          account_number?: string | null
          payment_code?: string | null
          amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_type?: string
          recipient?: string | null
          recipient_location?: string | null
          model?: string | null
          reference_number?: string | null
          payment_purpose?: string | null
          account_number?: string | null
          payment_code?: string | null
          amount?: number | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          payment_type: string | null
          due_date: string | null
          amount: number | null
          status: string | null
          paid_at: string | null
          recipient: string | null
          recipient_location: string | null
          model: string | null
          reference_number: string | null
          payment_purpose: string | null
          account_number: string | null
          payment_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_type?: string | null
          due_date?: string | null
          amount?: number | null
          status?: string | null
          paid_at?: string | null
          recipient?: string | null
          recipient_location?: string | null
          model?: string | null
          reference_number?: string | null
          payment_purpose?: string | null
          account_number?: string | null
          payment_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_type?: string | null
          due_date?: string | null
          amount?: number | null
          status?: string | null
          paid_at?: string | null
          recipient?: string | null
          recipient_location?: string | null
          model?: string | null
          reference_number?: string | null
          payment_purpose?: string | null
          account_number?: string | null
          payment_code?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          number: string | null
          date: string | null
          client_name: string | null
          amount: number | null
          due_date: string | null
          data: Json | null
          service_items: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          number?: string | null
          date?: string | null
          client_name?: string | null
          amount?: number | null
          due_date?: string | null
          data?: Json | null
          service_items?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          number?: string | null
          date?: string | null
          client_name?: string | null
          amount?: number | null
          due_date?: string | null
          data?: Json | null
          service_items?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
