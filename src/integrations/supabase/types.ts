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
      agentes: {
        Row: {
          created_at: string
          id: string
          instrucoes: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrucoes: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instrucoes?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_api_limites: {
        Row: {
          chave: string
          created_at: string
          expires_at: string
          quantidade: number
          updated_at: string
        }
        Insert: {
          chave: string
          created_at?: string
          expires_at?: string
          quantidade?: number
          updated_at?: string
        }
        Update: {
          chave?: string
          created_at?: string
          expires_at?: string
          quantidade?: number
          updated_at?: string
        }
        Relationships: []
      }
      app_dados: {
        Row: {
          colecao: string
          created_at: string
          dados: Json
          id: string
          projeto_id: string
          updated_at: string
        }
        Insert: {
          colecao: string
          created_at?: string
          dados?: Json
          id?: string
          projeto_id: string
          updated_at?: string
        }
        Update: {
          colecao?: string
          created_at?: string
          dados?: Json
          id?: string
          projeto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_dados_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      app_dados_privados: {
        Row: {
          colecao: string
          created_at: string
          dados: Json
          id: string
          projeto_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colecao: string
          created_at?: string
          dados?: Json
          id?: string
          projeto_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colecao?: string
          created_at?: string
          dados?: Json
          id?: string
          projeto_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_dados_privados_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      app_perfis: {
        Row: {
          cargo: string
          created_at: string
          foto_url: string | null
          id: string
          nome: string
          preferencias: Json
          projeto_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          preferencias?: Json
          projeto_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string
          created_at?: string
          foto_url?: string | null
          id?: string
          nome?: string
          preferencias?: Json
          projeto_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_perfis_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      backups: {
        Row: {
          arquivos: Json
          created_at: string
          id: string
          projeto_id: string
          rotulo: string
          user_id: string
        }
        Insert: {
          arquivos?: Json
          created_at?: string
          id?: string
          projeto_id: string
          rotulo?: string
          user_id: string
        }
        Update: {
          arquivos?: Json
          created_at?: string
          id?: string
          projeto_id?: string
          rotulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backups_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      chaves_ia: {
        Row: {
          api_key: string
          api_url: string | null
          created_at: string
          id: string
          provider: string
          testada_em: string | null
          testada_ok: boolean
          ultimo_erro: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          api_url?: string | null
          created_at?: string
          id?: string
          provider: string
          testada_em?: string | null
          testada_ok?: boolean
          ultimo_erro?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          api_url?: string | null
          created_at?: string
          id?: string
          provider?: string
          testada_em?: string | null
          testada_ok?: boolean
          ultimo_erro?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      escola_cron: {
        Row: {
          created_at: string
          id: boolean
          token: string
        }
        Insert: {
          created_at?: string
          id?: boolean
          token?: string
        }
        Update: {
          created_at?: string
          id?: boolean
          token?: string
        }
        Relationships: []
      }
      escola_estado: {
        Row: {
          dia: number
          lease_ate: string | null
          licoes_total: number
          media: number
          motivo: string | null
          pausado: boolean
          ultimo_ciclo: string | null
          ultimo_resumo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          dia?: number
          lease_ate?: string | null
          licoes_total?: number
          media?: number
          motivo?: string | null
          pausado?: boolean
          ultimo_ciclo?: string | null
          ultimo_resumo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          dia?: number
          lease_ate?: string | null
          licoes_total?: number
          media?: number
          motivo?: string | null
          pausado?: boolean
          ultimo_ciclo?: string | null
          ultimo_resumo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      etapas_construcao: {
        Row: {
          arquivos_produzidos: string[]
          concluida_em: string | null
          created_at: string
          entrada_resumo: string | null
          erro: string | null
          estado: string
          etapa: string
          execucao_id: string
          id: string
          modelo: string | null
          resultado_resumo: string | null
          tentativa: number
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivos_produzidos?: string[]
          concluida_em?: string | null
          created_at?: string
          entrada_resumo?: string | null
          erro?: string | null
          estado?: string
          etapa: string
          execucao_id: string
          id?: string
          modelo?: string | null
          resultado_resumo?: string | null
          tentativa?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivos_produzidos?: string[]
          concluida_em?: string | null
          created_at?: string
          entrada_resumo?: string | null
          erro?: string | null
          estado?: string
          etapa?: string
          execucao_id?: string
          id?: string
          modelo?: string | null
          resultado_resumo?: string | null
          tentativa?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_construcao_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes_construcao"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes_construcao: {
        Row: {
          concluida_em: string | null
          created_at: string
          estado: string
          etapa_atual: string
          id: string
          modelos_usados: string[]
          pedido: string
          projeto_id: string
          provas: Json
          tentativa: number
          ultimo_erro: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          estado?: string
          etapa_atual?: string
          id?: string
          modelos_usados?: string[]
          pedido: string
          projeto_id: string
          provas?: Json
          tentativa?: number
          ultimo_erro?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          estado?: string
          etapa_atual?: string
          id?: string
          modelos_usados?: string[]
          pedido?: string
          projeto_id?: string
          provas?: Json
          tentativa?: number
          ultimo_erro?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_construcao_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      github_contas: {
        Row: {
          branch: string
          created_at: string
          id: string
          login: string
          repo: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch?: string
          created_at?: string
          id?: string
          login?: string
          repo?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch?: string
          created_at?: string
          id?: string
          login?: string
          repo?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      licoes: {
        Row: {
          created_at: string
          id: string
          origem: string
          peso: number
          regra: string
          tema: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          origem?: string
          peso?: number
          regra: string
          tema: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          origem?: string
          peso?: number
          regra?: string
          tema?: string
          user_id?: string
        }
        Relationships: []
      }
      memorias: {
        Row: {
          conteudo: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          anexos: Json
          conteudo: string
          created_at: string
          id: string
          modelo: string | null
          ok: boolean
          projeto_id: string
          role: string
          user_id: string
        }
        Insert: {
          anexos?: Json
          conteudo?: string
          created_at?: string
          id?: string
          modelo?: string | null
          ok?: boolean
          projeto_id: string
          role: string
          user_id: string
        }
        Update: {
          anexos?: Json
          conteudo?: string
          created_at?: string
          id?: string
          modelo?: string | null
          ok?: boolean
          projeto_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          arquivos: Json
          created_at: string
          id: string
          modelo: string
          nome: string
          notas: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivos?: Json
          created_at?: string
          id?: string
          modelo?: string
          nome: string
          notas?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivos?: Json
          created_at?: string
          id?: string
          modelo?: string
          nome?: string
          notas?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts_salvos: {
        Row: {
          created_at: string
          id: string
          texto: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          texto: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          texto?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      provedores_custom: {
        Row: {
          created_at: string
          id: string
          modelo: string
          nome: string
          slug: string
          suporta_imagem: boolean
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modelo: string
          nome: string
          slug: string
          suporta_imagem?: boolean
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modelo?: string
          nome?: string
          slug?: string
          suporta_imagem?: boolean
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consumir_limite_app: {
        Args: { _chave: string; _limite: number }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
