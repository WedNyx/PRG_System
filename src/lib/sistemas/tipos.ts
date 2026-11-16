/** Formato de um sistema de RPG. Os modelos prontos e os sistemas autorais usam o mesmo formato. */
/** Opção de um campo “escolha” (classe, espécie, origem…): o que o jogador escolhe pode dar bônus automáticos. */
/** `progressao`: id da tabela de níveis (progressoes.classes) que passa a valer quando esta opção é escolhida. */
/** `vars`: números que a opção define para as fórmulas (ex.: Guerreiro → pv_ini 20). Sem escolha, valem 0. */
export type OpcaoCampo = { nome: string; descricao?: string; bonus?: { alvo: string; valor: number }[]; progressao?: string; vars?: Record<string, number>
  /** D&D: opção de livro comercial (id em dnd2024Fontes) — só aparece se o mestre liberar a fonte. */
  fonte?: string }
export type CampoDef = { id: string; nome: string; tipo: 'texto' | 'numero' | 'area' | 'escolha'; padrao?: string | number; opcoes?: OpcaoCampo[]; /** Escolha de classe: campo de número com o nível dela (multiclasse). */ nivel?: string
  /** Explicação curta que aparece na ficha (v0.35.6). */ dica?: string }
export type AtributoDef = { id: string; nome: string; min: number; max: number; padrao: number; /** Explicação do atributo (v0.35.6). */ dica?: string }
export type TreinoDef = { id: string; nome: string; formula: string; custo?: number }
/** atributo pode ser 'FOR/DES': usa o melhor modificador dos dois. */
/** `base`: valor inicial das perícias em porcentagem (fórmula, ex.: '25' ou 'DES * 2'): fichas novas já começam com ele. */
export type PericiaDef = { id: string; nome: string; atributo?: string; grupo?: string; base?: string; dica?: string }
export type DerivadoDef = { id: string; nome: string; formula: string; dica?: string }
/** `sugerido`: id de um valor calculado usado como máximo enquanto a pessoa não digitar outro (ex.: PV pela classe). */
/** `contador`: marcador que começa em 0 e não enche no descanso (Morrendo, Exaustão, Estresse…); `baixaNoDescanso`: quanto cai no descanso longo. */
/** `ocultarSemMax`: some da ficha quando o máximo é 0 (ex.: Fúrias para quem não é Bárbaro); `voltaNoCurto`: enche também no descanso curto. */
/** `dica`: como se acha o máximo (ex.: “Role Físico + Fortitude”), aparece debaixo da barra (v0.35.6). */
export type RecursoDef = { id: string; nome: string; dica?: string; formula?: string; maxFixo?: number; sugerido?: string; contador?: boolean; baixaNoDescanso?: number; ocultarSemMax?: boolean; voltaNoCurto?: boolean }
export type LimiteDef = { nome: string; uso: string; max: string }
/**
 * Graus de dado (v0.35.6): atributos e perícias valem um dado (d4, d6, d8…) em vez de um número.
 * O valor guardado é o número de lados; 0 = “não tem” e rola o dado `zero` (ex.: d4). `maxPericia` limita o grau das perícias.
 */
export type GrausDef = { lados: number[]; zero?: number; maxPericia?: number }
/** Tabela rolável do sistema (v0.35.6): rola `dado` e mostra a linha; `campo` = campo de texto onde dá para guardar o resultado. */
export type TabelaDef = { id: string; nome: string; dado: string; linhas: { de: number; ate: number; texto: string }[]; campo?: string }
/** Capítulo das regras do sistema, escrito pelo autor (v0.35.6). Aparece na ficha, em “Regras”. */
export type CapituloRegra = { titulo: string; texto: string }
export type SecaoFicha = 'principal' | 'atributos' | 'habilidades' | 'equipamentos' | 'anotacoes'

export type Sistema = {
  id: string
  /** Indica a edição das regras, mesmo se a ficha antiga não possui dndLivros. */
  regraLivroDnd?: import('./dndLivros').LivroBaseDnd
  nome: string
  resumo: string
  /** aberto = regras sob licença livre; estrutura = só os campos (regras do seu livro); autoral = criado por você */
  tipo: 'aberto' | 'estrutura' | 'autoral'
  licenca: string
  creditos?: string
  dados: string
  /** Como a ficha rola: d20 + bônus, d100 abaixo do valor, ou sem rolagem ('assimilacao' = dados de símbolos do Assimilação RPG). Sem isso, deduz por `dados`. */
  rolagem?: 'd20' | 'd100' | 'nenhuma' | 'personalizada' | 'parada' | 'assimilacao' | 'graus'
  /** Com rolagem 'graus': quais dados existem (v0.35.6). */
  graus?: GrausDef
  /** Tabelas roláveis (v0.35.6). */
  tabelas?: TabelaDef[]
  /** Regras escritas pelo autor, em capítulos (v0.35.6). */
  regras?: CapituloRegra[]
  /** Nomes das partes da ficha (v0.35.6): ex.: “Vivências” em vez de “Atributos e perícias”. */
  nomesSecoes?: Partial<Record<SecaoFicha, string>>
  /** Com rolagem 'parada': rola tantos dados quanto o atributo e fica com o maior (0 = rola 2 e fica com o menor). Ex.: Ordem Paranormal (d20), Blades (d6). */
  parada?: { lados: number; /** Como ler o resultado (Blades: 6 = sucesso, 4–5 = parcial, dois 6 = crítico). */ leitura?: 'blades' }
  /** Valores calculados que também se rolam como parada (ex.: atributos de resistência do Blades). */
  resistencias?: string[]
  /** Atributos que mudaram de sigla (antiga → nova): fichas antigas são convertidas ao abrir. */
  apelidosAtributos?: Record<string, string>
  /** Com rolagem 'personalizada': a fórmula do teste, com VALOR no lugar do atributo/perícia (ver regrasRolagem.ts). */
  regraRolagem?: { nome: string; formula: string }
  /** Fora das listas (não dá para criar fichas novas); fichas antigas continuam abrindo. */
  oculto?: boolean
  /** Quem criou (sistemas autorais). */
  autor?: string
  /** Capa enviada pelo autor (sistemas autorais; imagem da plataforma). */
  capa?: string
  /** Nomes das abas do inventário neste sistema (ex.: “Proteções” em vez de “Armadura/escudo”) e da ala dos itens mágicos. */
  nomesItens?: Partial<Record<'arma' | 'armadura' | 'consumivel' | 'equipamento' | 'tesouro' | 'outro' | 'magico', string>>
  campos: CampoDef[]
  atributos: AtributoDef[]
  /** Nome que a ficha usa para os atributos (sistemas autorais: “Aspectos”, “Virtudes”…; v0.33.8). As perícias usam `pericias.titulo`. */
  tituloAtributos?: string
  /** Modificador do atributo; `X` é o valor do atributo. Sem isso, o modificador é o próprio valor. */
  formulaModificador?: string
  derivados: DerivadoDef[]
  pericias?: {
    titulo?: string
    lista: PericiaDef[]
    /** 'treino' = escolher grau; 'valor' = digitar número (ex.: porcentagem) */
    modo: 'treino' | 'valor'
    /** O jogador pode acrescentar perícias com o nome que quiser (v0.35.6). */
    livres?: boolean
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
  progressoes?: { classes: { id: string; nome: string; campoNivel: string; tabela: Record<string, number[]> }[]; colunas?: Record<string, string> }
  /** Árvore de habilidades padrão: toda ficha nova do sistema começa com ela (ver arvore.ts). */
  arvore?: { pontos: number; nos: unknown[] }
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
  /** Imagem do personagem (enviada pela plataforma). */
  retrato?: string
  campos: Record<string, string | number>
  atributos: Record<string, number>
  pericias: Record<string, string | number>
  recursos: Record<string, { atual: number; max?: number }>
  listas: Record<string, string>
  /** Inventário e poderes estruturados (ver inventario.ts). */
  itens?: unknown[]
  /** Pontos de atributo que vieram dos níveis e já foram colocados (id do atributo → pontos). */
  nivelAtributos?: Record<string, number>
  poderes?: unknown[]
  uso?: unknown
  /** Perícias que o próprio jogador criou (sistemas com perícias livres, v0.35.6); o valor fica em `pericias[id]`. */
  periciasExtras?: { id: string; nome: string }[]
  /** Livro do Jogador e suplementos escolhidos para ESTA ficha (mestre autoriza na campanha). */
  dndLivros?: import('./dndLivros').SelecaoLivrosDnd
  /** Atributos antes dos bônus raciais na criação 2014. Ausência = ficha antiga com totais manuais. */
  dnd2014AtributosBase?: Record<string, number>
  /** Resultado bruto do Dado de Vida por classe:nível; ausência = média fixa. */
  dnd2014VidaRolada?: Record<string,number>
  /** Alternativa de equipamento inicial de 2014: kits de classe/antecedente ou ouro da classe. */
  dnd2014EquipamentoInicial?: import('./dnd2014EquipamentoInicial').RegistroEquipamento2014
  /** Proficiências selecionáveis de idioma e ferramenta do antecedente 2014. */
  dnd2014AntecedenteExtras?: import('./dnd2014AntecedentesDetalhes').EscolhasAntecedente2014
  /** Variante do Patrulheiro do PDF fornecido: seleção de inimigo e idioma. */
  dnd2014InimigoFavorito?: string
  dnd2014IdiomaInimigo?: string
  dnd2014MetodoAtributos?: import('./dnd2014Atributos').MetodoAtributos2014
  dnd2014RolagensAtributos?: number[][]
  /** Cada marco classe:nível concede +2 ou +1/+1, no lugar de um talento. */
  dnd2014Incrementos?: Record<string, import('./dnd2014Atributos').Incremento2014>
  /** Aumentos variáveis de atributo 2014 (Meio-Elfo / Humano Variante). */
  dnd2014AtributosExtras?: string[]
  /** Perícias selecionadas na classe inicial do SRD 5.1. */
  dnd2014PericiasClasse?: string[]
  /** Duas perícias livres do Meio-Elfo ou uma do Humano Variante (2014). */
  dnd2014PericiasRaciais?: string[]
  /** Arquétipo/subclasse do Livro do Jogador 2014, escolhido no nível correto. */
  dnd2014Subclasse?: string
  /** Subclasses das classes secundárias em 2014, por id de classe; preserva o campo legado da classe inicial. */
  dnd2014Subclasses?: Record<string, string>
  /** Decisões por subclass e classe, validadas pelos níveis do PHB 2014. */
  dnd2014EscolhasSubclasse?: Record<string, import('./dnd2014EscolhasSubclasse').EscolhasSubclasse2014>
  /** Níveis em outras classes na multiclasse 2014 (não usa a tabela 2024). */
  dnd2014Multiclasse?: Record<string,number>
  /** Magias de D&D 2014, registradas separadamente do catálogo SRD 2024. */
  dnd2014Magias?: import('./dnd2014Magias').RegistroMagiaDnd2014[]
  /** Círculos de Arcana Mística já conjurados; descanso longo limpa os usos. */
  dnd2014ArcanasUsadas?: number[]
  /** Dados de Superioridade gastos do Mestre de Batalha (2014). */
  dnd2014DadosSuperioridadeUsados?: number
  /** Dádiva do Pacto e Metamagia por níveis das classes de 2014. */
  dnd2014OpcoesClasse?: import('./dnd2014OpcoesClasse').OpcoesClasseDnd2014
  /** Concentração ativa, sem aplicação automática de efeitos de magias comerciais. */
  dnd2014Concentracao?: import('./dnd2014Concentracao').ConcentracaoDnd2014
  /** Talentos do PHB 2014 adquiridos com Incrementos de Atributo ou Humano Variante. */
  dnd2014Talentos?: string[]
  /** Decisões de atributo, lista mágica e elemento dos talentos de 2014. */
  dnd2014OpcoesTalentos?: Record<string,string>
  /** Escolhas de marcos D&D. A progressão visual não concede bônus por si só. */
  dndEscolhas?: Record<string, string>
  /** Distribuição guiada de atributos de antecedente, aplicada explicitamente uma vez. */
  dndAntecedente?: import('./dnd2024Antecedentes').RegistroAntecedenteDnd
  /** Talento Iniciado em Magia do Humano Versátil, independente do antecedente. */
  dndTalentoHumano?: import('./dnd2024MagiaHumano').RegistroTalentoMagiaHumano
  /** Magias de D&D 2024: id da magia do SRD → 'preparada' (conta no limite) ou 'extra' (veio de outra fonte). */
  dndMagias?: Record<string, string>
  /** Multiclasse de D&D 2024: id da outra classe → níveis nela (a classe inicial fica com o resto do nível total). */
  dndMulticlasse?: Record<string, number>
  /** Campanha: criação livre ligada pelo mestre — o dono salva atributos, perícias etc. sem pedir aprovação (v0.33.7). */
  criacaoLivre?: boolean
  /** Árvore de habilidades (ver arvore.ts). */
  arvore?: unknown
  /**
   * Ficha manual (v0.34.8): o jogador e o mestre digitam modificadores, valores e totais das perícias.
   * Com isso, a plataforma não calcula nada; todo o resto (mesa, combate, descanso) usa estes números.
   */
  manual?: FichaManual
}

export type FichaManual = {
  mods: Record<string, number>
  derivados: Record<string, number | null>
  pericias: Record<string, number | null>
}
