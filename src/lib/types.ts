export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; created_at: string }
        Insert: { id: string; username: string; created_at?: string }
        Update: { id?: string; username?: string; created_at?: string }
        Relationships: []
      }
      clans: {
        Row: { id: string; name: string; invite_code: string; owner_id: string; created_at: string }
        Insert: { id?: string; name: string; invite_code?: string; owner_id: string; created_at?: string }
        Update: { id?: string; name?: string; invite_code?: string; owner_id?: string }
        Relationships: [
          { foreignKeyName: 'clans_owner_id_fkey'; columns: ['owner_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      clan_members: {
        Row: { id: string; clan_id: string; user_id: string; joined_at: string }
        Insert: { id?: string; clan_id: string; user_id: string; joined_at?: string }
        Update: { id?: string; clan_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'clan_members_clan_id_fkey'; columns: ['clan_id']; referencedRelation: 'clans'; referencedColumns: ['id'] },
          { foreignKeyName: 'clan_members_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] }
        ]
      }
      matches: {
        Row: {
          id: string; home_team: string; away_team: string; match_date: string
          home_score: number | null; away_score: number | null
          stage: string; status: 'upcoming' | 'live' | 'finished'; created_at: string
        }
        Insert: {
          id?: string; home_team: string; away_team: string; match_date: string
          home_score?: number | null; away_score?: number | null
          stage?: string; status?: 'upcoming' | 'live' | 'finished'
        }
        Update: {
          home_score?: number | null; away_score?: number | null
          status?: 'upcoming' | 'live' | 'finished'
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string; user_id: string; match_id: string; clan_id: string
          home_score: number; away_score: number; points: number
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; user_id: string; match_id: string; clan_id: string
          home_score: number; away_score: number; points?: number
        }
        Update: {
          home_score?: number; away_score?: number; points?: number; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'predictions_user_id_fkey'; columns: ['user_id']; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'predictions_match_id_fkey'; columns: ['match_id']; referencedRelation: 'matches'; referencedColumns: ['id'] },
          { foreignKeyName: 'predictions_clan_id_fkey'; columns: ['clan_id']; referencedRelation: 'clans'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Clan = Database['public']['Tables']['clans']['Row']
export type ClanMember = Database['public']['Tables']['clan_members']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']

export type RankingEntry = {
  user_id: string
  username: string
  total: number
  exact: number
  winner: number
}
