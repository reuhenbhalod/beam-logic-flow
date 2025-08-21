import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          status: string
          progress: number
          created_by: string
          created_at: string
          updated_at: string
          project_type: string
          fee: number
          start_date: string
          end_date: string
          budget: number
        }
        Insert: {
          id?: string
          name: string
          description: string
          status?: string
          progress?: number
          created_by: string
          created_at?: string
          updated_at?: string
          project_type: string
          fee: number
          start_date: string
          end_date?: string
          budget: number
        }
        Update: {
          id?: string
          name?: string
          description?: string
          status?: string
          progress?: number
          created_by?: string
          created_at?: string
          updated_at?: string
          project_type?: string
          fee?: number
          start_date?: string
          end_date?: string
          budget?: number
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          project_id: string
          hours: number
          description: string
          date: string
          created_at: string
          role: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          hours: number
          description: string
          date: string
          created_at?: string
          role: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          hours?: number
          description?: string
          date?: string
          created_at?: string
          role?: string
        }
      }
    }
  }
} 