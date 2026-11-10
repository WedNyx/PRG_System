/** Formato de um sistema de RPG. Os modelos prontos e os sistemas autorais usam o mesmo formato. */
export type CampoDef = { id: string; nome: string; tipo: 'texto' | 'numero' | 'area'; padrao?: string | number }
export type AtributoDef = { id: string; nome: string; min: number; max: number; padrao: number }
export type TreinoDef = { id: string; nome: string; formula: string; custo?: number }
/** atributo pode ser 'FOR/DES': usa o melhor modificador dos dois. */
export type PericiaDef = { id: string; nome: string; atributo?: string; grupo?: string }
export type DerivadoDef = { id: string; nome: string; formula: string; dica?: string }
export type RecursoDef = { id: string; nome: string; formula?: string; maxFixo?: number }
export type LimiteDef = { nome: string; uso: string; max: string }

export type Sistema = {
  id: string
  nome: string
  resumo: string
  /** aberto = regras sob licença livre; estrutura = só os campos (regras do seu livro); autoral = criado por você */
  tipo: 'aberto' | 'estrutura' | 'autoral'
  licenca: string
  creditos?: string
  dados: string
  /** Como a ficha rola: d20 + bônus, d100 abaixo do valor, ou sem rolagem. Sem isso, deduz por `dados`. */
  rolagem?: 'd20' | 'd100' | 'nenhuma'
  /** Fora das listas (não dá para criar fichas novas); fichas antigas continuam abrindo. */
  oculto?: boolean
  /** Quem criou (sistemas autorais). */
  autor?: string
  campos: CampoDef[]
  atributos: AtributoDef[]
  /** Modificador do atributo; `X` é o valor do atributo. Sem isso, o modificador é o próprio valor. */
  formulaModificador?: string
  derivados: DerivadoDef[]
  pericias?: {
    titulo?: string
    lista: PericiaDef[]
    /** 'treino' = escolher grau; 'valor' = digitar número (ex.: porcentagem) */
    modo: 'treino' | 'valor'
    treinos?: TreinoDef[]
    /** Variáveis: MOD (modificador do atributo), ATR (valor), TREINO (bônus do grau) ou VALOR */
    total: string
  }
  recursos: RecursoDef[]
  /**
   * Tabelas por classe e nível (estilo d20): para cada coluna (ex.: bba, fort), soma os
   * valores de todas as classes no nível informado em `campoNivel` (multiclasse).
   * Gera as variáveis prog_<coluna> e nivel_total.
   */
  progressoes?: { classes: { id: string; nome: string; campoNivel: string; tabela: Record<string, number[]> }[] }
  /** Avisos de criação/evolução (não bloqueiam; mostram quando passa do limite). */
  limites?: LimiteDef[]
  listas: { id: string; nome: string }[]
  observacoes?: string[]
  /** Capacidade de carga (fórmula) e a unidade do peso dos itens. */
  carga?: { formula?: string; unidade: string; dica?: string }
}

export type DadosFicha = {
  sistema: string
  nome: string
  campos: Record<string, string | number>
  atributos: Record<string, number>
  pericias: Record<string, string | number>
  recursos: Record<string, { atual: number; max?: number }>
  listas: Record<string, string>
  /** Inventário e poderes estruturados (ver inventario.ts). */
  itens?: unknown[]
  poderes?: unknown[]
  uso?: unknown
}
