export type CampoFicha = {
  id: string
  label: string
  tipo: 'numero' | 'texto' | 'area'
  /** Mostra o modificador estilo d20: (valor - 10) / 2 */
  mod?: boolean
}

export type SecaoFicha = {
  titulo: string
  /** Colunas do grid (padrão 3) */
  colunas?: number
  campos: CampoFicha[]
}

export type TemplateFicha = {
  nome: string
  secoes: SecaoFicha[]
}

export function modificadorD20(valor: number): string {
  const mod = Math.floor((valor - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

const atributosD20: CampoFicha[] = [
  { id: 'for', label: 'Força', tipo: 'numero', mod: true },
  { id: 'des', label: 'Destreza', tipo: 'numero', mod: true },
  { id: 'con', label: 'Constituição', tipo: 'numero', mod: true },
  { id: 'int', label: 'Inteligência', tipo: 'numero', mod: true },
  { id: 'sab', label: 'Sabedoria', tipo: 'numero', mod: true },
  { id: 'car', label: 'Carisma', tipo: 'numero', mod: true },
]

export const templatesFicha: Record<string, TemplateFicha> = {
  dnd5e: {
    nome: 'D&D 5e',
    secoes: [
      {
        titulo: 'Identidade',
        colunas: 3,
        campos: [
          { id: 'raca', label: 'Raça', tipo: 'texto' },
          { id: 'classe', label: 'Classe', tipo: 'texto' },
          { id: 'nivel', label: 'Nível', tipo: 'numero' },
          { id: 'antecedente', label: 'Antecedente', tipo: 'texto' },
          { id: 'alinhamento', label: 'Alinhamento', tipo: 'texto' },
          { id: 'xp', label: 'XP', tipo: 'numero' },
        ],
      },
      { titulo: 'Atributos', colunas: 6, campos: atributosD20 },
      {
        titulo: 'Combate',
        colunas: 4,
        campos: [
          { id: 'ca', label: 'CA', tipo: 'numero' },
          { id: 'iniciativa', label: 'Iniciativa', tipo: 'numero' },
          { id: 'deslocamento', label: 'Deslocamento', tipo: 'texto' },
          { id: 'dados_vida', label: 'Dados de Vida', tipo: 'texto' },
        ],
      },
      {
        titulo: 'Perícias e Salvaguardas',
        colunas: 1,
        campos: [
          { id: 'proficiencias', label: 'Proficiências', tipo: 'area' },
          { id: 'pericias', label: 'Perícias', tipo: 'area' },
        ],
      },
      {
        titulo: 'Ataques e Magias',
        colunas: 1,
        campos: [
          { id: 'ataques', label: 'Ataques', tipo: 'area' },
          { id: 'magias', label: 'Magias e Espaços de Magia', tipo: 'area' },
        ],
      },
      {
        titulo: 'Equipamento',
        colunas: 1,
        campos: [
          { id: 'equipamento', label: 'Inventário', tipo: 'area' },
          { id: 'ouro', label: 'Ouro (PO)', tipo: 'numero' },
        ],
      },
      {
        titulo: 'Personalidade e História',
        colunas: 1,
        campos: [
          { id: 'personalidade', label: 'Traços, Ideais, Vínculos e Fraquezas', tipo: 'area' },
          { id: 'historia', label: 'História do Personagem', tipo: 'area' },
        ],
      },
    ],
  },

  tormenta20: {
    nome: 'Tormenta 20',
    secoes: [
      {
        titulo: 'Identidade',
        colunas: 3,
        campos: [
          { id: 'raca', label: 'Raça', tipo: 'texto' },
          { id: 'classe', label: 'Classe', tipo: 'texto' },
          { id: 'nivel', label: 'Nível', tipo: 'numero' },
          { id: 'origem', label: 'Origem', tipo: 'texto' },
          { id: 'divindade', label: 'Divindade', tipo: 'texto' },
        ],
      },
      { titulo: 'Atributos', colunas: 6, campos: atributosD20 },
      {
        titulo: 'Combate e Recursos',
        colunas: 3,
        campos: [
          { id: 'defesa', label: 'Defesa', tipo: 'numero' },
          { id: 'pm', label: 'Pontos de Mana', tipo: 'numero' },
          { id: 'deslocamento', label: 'Deslocamento', tipo: 'texto' },
        ],
      },
      {
        titulo: 'Perícias',
        colunas: 1,
        campos: [{ id: 'pericias', label: 'Perícias Treinadas', tipo: 'area' }],
      },
      {
        titulo: 'Poderes e Magias',
        colunas: 1,
        campos: [
          { id: 'poderes', label: 'Poderes e Habilidades', tipo: 'area' },
          { id: 'magias', label: 'Magias', tipo: 'area' },
        ],
      },
      {
        titulo: 'Equipamento',
        colunas: 1,
        campos: [
          { id: 'equipamento', label: 'Inventário', tipo: 'area' },
          { id: 'tibar', label: 'Tibares (T$)', tipo: 'numero' },
        ],
      },
      {
        titulo: 'História',
        colunas: 1,
        campos: [{ id: 'historia', label: 'História do Personagem', tipo: 'area' }],
      },
    ],
  },

  pathfinder2e: {
    nome: 'Pathfinder 2e',
    secoes: [
      {
        titulo: 'Identidade',
        colunas: 3,
        campos: [
          { id: 'ancestralidade', label: 'Ancestralidade', tipo: 'texto' },
          { id: 'classe', label: 'Classe', tipo: 'texto' },
          { id: 'nivel', label: 'Nível', tipo: 'numero' },
          { id: 'background', label: 'Background', tipo: 'texto' },
          { id: 'heranca', label: 'Herança', tipo: 'texto' },
        ],
      },
      { titulo: 'Atributos', colunas: 6, campos: atributosD20 },
      {
        titulo: 'Combate',
        colunas: 4,
        campos: [
          { id: 'ca', label: 'CA', tipo: 'numero' },
          { id: 'percepcao', label: 'Percepção', tipo: 'numero' },
          { id: 'velocidade', label: 'Velocidade', tipo: 'texto' },
          { id: 'classe_dc', label: 'CD de Classe', tipo: 'numero' },
        ],
      },
      {
        titulo: 'Perícias e Talentos',
        colunas: 1,
        campos: [
          { id: 'pericias', label: 'Perícias (com proficiência)', tipo: 'area' },
          { id: 'talentos', label: 'Talentos', tipo: 'area' },
        ],
      },
      {
        titulo: 'Equipamento e Magias',
        colunas: 1,
        campos: [
          { id: 'equipamento', label: 'Inventário', tipo: 'area' },
          { id: 'magias', label: 'Magias', tipo: 'area' },
        ],
      },
      {
        titulo: 'História',
        colunas: 1,
        campos: [{ id: 'historia', label: 'História do Personagem', tipo: 'area' }],
      },
    ],
  },

  coc: {
    nome: 'Call of Cthulhu',
    secoes: [
      {
        titulo: 'Identidade',
        colunas: 3,
        campos: [
          { id: 'ocupacao', label: 'Ocupação', tipo: 'texto' },
          { id: 'idade', label: 'Idade', tipo: 'numero' },
          { id: 'residencia', label: 'Residência', tipo: 'texto' },
        ],
      },
      {
        titulo: 'Características (0-100)',
        colunas: 5,
        campos: [
          { id: 'for', label: 'FOR', tipo: 'numero' },
          { id: 'con', label: 'CON', tipo: 'numero' },
          { id: 'tam', label: 'TAM', tipo: 'numero' },
          { id: 'des', label: 'DES', tipo: 'numero' },
          { id: 'apa', label: 'APA', tipo: 'numero' },
          { id: 'int', label: 'INT', tipo: 'numero' },
          { id: 'pod', label: 'POD', tipo: 'numero' },
          { id: 'edu', label: 'EDU', tipo: 'numero' },
          { id: 'sorte', label: 'Sorte', tipo: 'numero' },
        ],
      },
      {
        titulo: 'Estado Mental',
        colunas: 3,
        campos: [
          { id: 'sanidade', label: 'Sanidade', tipo: 'numero' },
          { id: 'sanidade_max', label: 'Sanidade Máx.', tipo: 'numero' },
          { id: 'pm', label: 'Pontos de Magia', tipo: 'numero' },
        ],
      },
      {
        titulo: 'Perícias',
        colunas: 1,
        campos: [{ id: 'pericias', label: 'Perícias (nome — %)', tipo: 'area' }],
      },
      {
        titulo: 'Armas e Equipamento',
        colunas: 1,
        campos: [
          { id: 'armas', label: 'Armas', tipo: 'area' },
          { id: 'equipamento', label: 'Equipamento', tipo: 'area' },
        ],
      },
      {
        titulo: 'História',
        colunas: 1,
        campos: [
          { id: 'historia', label: 'História do Investigador', tipo: 'area' },
          { id: 'fobias', label: 'Fobias e Manias', tipo: 'area' },
        ],
      },
    ],
  },

  vtm: {
    nome: 'Vampire: The Masquerade',
    secoes: [
      {
        titulo: 'Identidade',
        colunas: 3,
        campos: [
          { id: 'cla', label: 'Clã', tipo: 'texto' },
          { id: 'geracao', label: 'Geração', tipo: 'numero' },
          { id: 'senhor', label: 'Senhor (Sire)', tipo: 'texto' },
        ],
      },
      {
        titulo: 'Atributos Físicos',
        colunas: 3,
        campos: [
          { id: 'forca', label: 'Força', tipo: 'numero' },
          { id: 'destreza', label: 'Destreza', tipo: 'numero' },
          { id: 'vigor', label: 'Vigor', tipo: 'numero' },
        ],
      },
      {
        titulo: 'Atributos Sociais',
        colunas: 3,
        campos: [
          { id: 'carisma', label: 'Carisma', tipo: 'numero' },
          { id: 'manipulacao', label: 'Manipulação', tipo: 'numero' },
          { id: 'compostura', label: 'Compostura', tipo: 'numero' },
        ],
      },
      {
        titulo: 'Atributos Mentais',
        colunas: 3,
        campos: [
          { id: 'inteligencia', label: 'Inteligência', tipo: 'numero' },
          { id: 'raciocinio', label: 'Raciocínio', tipo: 'numero' },
          { id: 'determinacao', label: 'Determinação', tipo: 'numero' },
        ],
      },
      {
        titulo: 'A Besta Interior',
        colunas: 3,
        campos: [
          { id: 'humanidade', label: 'Humanidade', tipo: 'numero' },
          { id: 'fome', label: 'Fome', tipo: 'numero' },
          { id: 'vontade', label: 'Força de Vontade', tipo: 'numero' },
        ],
      },
      {
        titulo: 'Habilidades e Disciplinas',
        colunas: 1,
        campos: [
          { id: 'habilidades', label: 'Habilidades', tipo: 'area' },
          { id: 'disciplinas', label: 'Disciplinas', tipo: 'area' },
        ],
      },
      {
        titulo: 'Crônica',
        colunas: 1,
        campos: [
          { id: 'vantagens', label: 'Vantagens e Defeitos', tipo: 'area' },
          { id: 'historia', label: 'História', tipo: 'area' },
        ],
      },
    ],
  },

  custom: {
    nome: 'Sistema Customizado',
    secoes: [
      {
        titulo: 'Conceito',
        colunas: 2,
        campos: [
          { id: 'conceito', label: 'Conceito', tipo: 'texto' },
          { id: 'nivel', label: 'Nível/Poder', tipo: 'texto' },
        ],
      },
      {
        titulo: 'Atributos',
        colunas: 1,
        campos: [{ id: 'atributos', label: 'Atributos (formato livre)', tipo: 'area' }],
      },
      {
        titulo: 'Habilidades',
        colunas: 1,
        campos: [{ id: 'habilidades', label: 'Habilidades e Poderes', tipo: 'area' }],
      },
      {
        titulo: 'Inventário',
        colunas: 1,
        campos: [{ id: 'inventario', label: 'Itens e Equipamento', tipo: 'area' }],
      },
      {
        titulo: 'Anotações',
        colunas: 1,
        campos: [{ id: 'anotacoes', label: 'História e Anotações', tipo: 'area' }],
      },
    ],
  },
}

export const sistemasDisponiveis = Object.entries(templatesFicha).map(([id, t]) => ({
  id,
  nome: t.nome,
}))

export const sistemaLabel: Record<string, string> = Object.fromEntries(
  Object.entries(templatesFicha).map(([id, t]) => [id, t.nome])
)
