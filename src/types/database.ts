export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          username?: string
          avatar_url?: string | null
        }
        Relationships: []
      }
      campanhas: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          sistema: string
          codigo_convite: string
          mestre_id: string
          imagem_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          sistema?: string
          codigo_convite?: string
          mestre_id: string
          imagem_url?: string | null
          created_at?: string
        }
        Update: {
          nome?: string
          descricao?: string | null
          sistema?: string
          imagem_url?: string | null
        }
        Relationships: []
      }
      campanha_players: {
        Row: {
          campanha_id: string
          player_id: string
          joined_at: string
        }
        Insert: {
          campanha_id: string
          player_id: string
          joined_at?: string
        }
        Update: {
          joined_at?: string
        }
        Relationships: []
      }
      personagens: {
        Row: {
          id: string
          campanha_id: string
          player_id: string
          nome: string
          is_npc: boolean
          dados: Record<string, unknown>
          pos_x: number
          pos_y: number
          token_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          player_id: string
          nome: string
          is_npc?: boolean
          dados?: Record<string, unknown>
          pos_x?: number
          pos_y?: number
          token_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          nome?: string
          dados?: Record<string, unknown>
          pos_x?: number
          pos_y?: number
          token_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rolagens: {
        Row: {
          id: string
          campanha_id: string
          player_id: string
          expressao: string
          resultados: number[]
          total: number
          created_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          player_id: string
          expressao: string
          resultados: number[]
          total: number
          created_at?: string
        }
        Update: {
          expressao?: string
          resultados?: number[]
          total?: number
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
