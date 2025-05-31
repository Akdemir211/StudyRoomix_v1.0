export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          avatar_url: string | null
          created_at: string
          is_pro?: boolean
          grade?: string | null
          target_profession?: string | null
          exam_score?: number | null
          strong_subjects?: string[] | null
          weak_subjects?: string[] | null
        }
        Insert: {
          id: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          is_pro?: boolean
          grade?: string | null
          target_profession?: string | null
          exam_score?: number | null
          strong_subjects?: string[] | null
          weak_subjects?: string[] | null
        }
        Update: {
          id?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          is_pro?: boolean
          grade?: string | null
          target_profession?: string | null
          exam_score?: number | null
          strong_subjects?: string[] | null
          weak_subjects?: string[] | null
        }
      }
      chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          is_private: boolean
          password_hash: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      chat_room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      ai_chat_history: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          created_at?: string
        }
      }
      user_assignments: {
        Row: {
          id: string
          user_id: string
          description: string
          subject: string
          due_date: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          subject: string
          due_date: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          subject?: string
          due_date?: string
          is_completed?: boolean
          created_at?: string
        }
      }
      watch_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          video_url: string
          is_private: boolean
          password_hash: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          video_url: string
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          video_url?: string
          is_private?: boolean
          password_hash?: string | null
          created_at?: string
          created_by?: string | null
        }
      }
      watch_room_members: {
        Row: {
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      watch_room_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
          user?: {
            name: string | null
          }
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
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
  }
}