export type IniciativaEntry = { nome: string; valor: number }
export type Macro = { nome: string; expressao: string }

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
          mapa_url: string | null
          grid_cols: number
          grid_rows: number
          fog_ativo: boolean
          fog_revelado: string[]
          iniciativa: IniciativaEntry[]
          iniciativa_turno: number
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
          mapa_url?: string | null
          grid_cols?: number
          grid_rows?: number
          fog_ativo?: boolean
          fog_revelado?: string[]
          iniciativa?: IniciativaEntry[]
          iniciativa_turno?: number
          created_at?: string
        }
        Update: {
          nome?: string
          descricao?: string | null
          sistema?: string
          imagem_url?: string | null
          mapa_url?: string | null
          grid_cols?: number
          grid_rows?: number
          fog_ativo?: boolean
          fog_revelado?: string[]
          iniciativa?: IniciativaEntry[]
          iniciativa_turno?: number
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
          dados: Record<string, string | number>
          pos_x: number
          pos_y: number
          token_url: string | null
          hp_atual: number
          hp_max: number
          cor: string
          visivel: boolean
          condicoes: string[]
          macros: Macro[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          player_id: string
          nome: string
          is_npc?: boolean
          dados?: Record<string, string | number>
          pos_x?: number
          pos_y?: number
          token_url?: string | null
          hp_atual?: number
          hp_max?: number
          cor?: string
          visivel?: boolean
          condicoes?: string[]
          macros?: Macro[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          nome?: string
          dados?: Record<string, string | number>
          pos_x?: number
          pos_y?: number
          token_url?: string | null
          hp_atual?: number
          hp_max?: number
          cor?: string
          visivel?: boolean
          condicoes?: string[]
          macros?: Macro[]
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
          is_secreta: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          player_id: string
          expressao: string
          resultados: number[]
          total: number
          is_secreta?: boolean
          created_at?: string
        }
        Update: {
          expressao?: string
          resultados?: number[]
          total?: number
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          id: string
          campanha_id: string
          player_id: string
          conteudo: string
          tipo: string
          destinatario_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          player_id: string
          conteudo: string
          tipo?: string
          destinatario_id?: string | null
          created_at?: string
        }
        Update: {
          conteudo?: string
        }
        Relationships: []
      }
      notas: {
        Row: {
          campanha_id: string
          conteudo: string
          updated_at: string
        }
        Insert: {
          campanha_id: string
          conteudo?: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          updated_at?: string
        }
        Relationships: []
      }
      cenas: {
        Row: {
          id: string
          campanha_id: string
          nome: string
          mapa_url: string | null
          grid_cols: number
          grid_rows: number
          created_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          nome: string
          mapa_url?: string | null
          grid_cols?: number
          grid_rows?: number
          created_at?: string
        }
        Update: {
          nome?: string
          mapa_url?: string | null
          grid_cols?: number
          grid_rows?: number
        }
        Relationships: []
      }
      handouts: {
        Row: {
          id: string
          campanha_id: string
          titulo: string
          conteudo: string
          imagem_url: string | null
          para_todos: boolean
          destinatarios: string[]
          visivel: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campanha_id: string
          titulo: string
          conteudo?: string
          imagem_url?: string | null
          para_todos?: boolean
          destinatarios?: string[]
          visivel?: boolean
          created_at?: string
        }
        Update: {
          titulo?: string
          conteudo?: string
          imagem_url?: string | null
          para_todos?: boolean
          destinatarios?: string[]
          visivel?: boolean
        }
        Relationships: []
      }
      journal: {
        Row: {
          campanha_id: string
          conteudo: string
          updated_at: string
        }
        Insert: {
          campanha_id: string
          conteudo?: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      entrar_com_codigo: {
        Args: { codigo: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Campanha = Database['public']['Tables']['campanhas']['Row']
export type Personagem = Database['public']['Tables']['personagens']['Row']
export type Mensagem = Database['public']['Tables']['mensagens']['Row']
export type Rolagem = Database['public']['Tables']['rolagens']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Cena = Database['public']['Tables']['cenas']['Row']
export type Handout = Database['public']['Tables']['handouts']['Row']
