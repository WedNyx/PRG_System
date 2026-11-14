/**
 * Biblioteca de publicações oficiais de D&D 5ª edição, identificadas por obra,
 * ano de publicação e geração das regras.
 *
 * Metadados bibliográficos (nomes/anos), SEM transcrever o conteúdo de livros
 * comerciais. A seleção de uma fonte só disponibiliza opções implementadas.
 *
 * 5e = livros 2014; 5.5e = regras revisadas publicadas a partir de 2024.
 * Fontes de 5e podem ter opções compatíveis com 5.5e mediante revisão do mestre.
 */
export type LivroBaseDnd = 'phb2014' | 'phb2024'
export type CategoriaLivroDnd = 'suplemento' | 'cenario' | 'aventura' | 'mestre' | 'referencia'
export type SuplementoDnd = {
  id: string; titulo: string; ano: number; versao: '5e (2014)' | '5.5e (2024)'
  categoria: CategoriaLivroDnd
  /** Permissão de escolher a obra, não garantia de que todas suas regras estão implementadas. */
  compatibilidade: '2014' | '2024' | 'ambas'
  /** Quando não existe mecânica implementada, mostrar apenas a origem e os avisos. */
  implementacao: 'referencia' | 'parcial'
  descricao: string
}
export type SelecaoLivrosDnd = { base: LivroBaseDnd; suplementos: string[] }

export const LIVROS_BASE_DND: { id: LivroBaseDnd; titulo: string; versao: string; ano: number; descricao: string }[] = [
  { id: 'phb2014', titulo: 'Livro do Jogador — Player’s Handbook', versao: '5ª edição (2014 / 5e)', ano: 2014,
    descricao: 'Criação clássica: raça e sub-raça influenciam atributos; antecedentes oferecem perícias e características. Motor SRD 5.1: atributos raciais guiados, perícias e recursos básicos automáticos; subclasses, magias e suplementos exigem o livro e conferência do mestre.' },
  { id: 'phb2024', titulo: 'Livro do Jogador — Player’s Handbook', versao: '5ª edição revisada (2024 / 5.5e)', ano: 2024,
    descricao: 'Criação revisada: espécie, antecedente com aumentos de atributos e talento de origem. Regras do SRD 5.2.1 já automatizadas.' },
]

/** Índice oficial inicial, ampliável sem criar uma nova ficha/sistema a cada livro. */
export const SUPLEMENTOS_DND: SuplementoDnd[] = [
  { id: 'xanathar2017', titulo: 'Xanathar’s Guide to Everything', ano: 2017, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Subclasses e ferramentas de criação; uso de opções legadas exige aprovação do mestre.' },
  { id: 'tasha2020', titulo: 'Tasha’s Cauldron of Everything', ano: 2020, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Artífice, opções de classe, talentos e outras opções; não aplicadas automaticamente.' },
  { id: 'monsters2022', titulo: 'Mordenkainen Presents: Monsters of the Multiverse', ano: 2022, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Espécies adicionais e variantes de monstros. Fichas de jogador somente com referência.' },
  { id: 'fizban2021', titulo: 'Fizban’s Treasury of Dragons', ano: 2021, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Opções dracônicas, subclasses e itens mágicos.' },
  { id: 'bigby2023', titulo: 'Bigby Presents: Glory of the Giants', ano: 2023, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Talentos, opções gigantes e itens mágicos.' },
  { id: 'bookmany2023', titulo: 'The Book of Many Things', ano: 2023, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Talentos, antecedentes, opções de personagem e itens.' },
  { id: 'swordcoast2015', titulo: 'Sword Coast Adventurer’s Guide', ano: 2015, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Subclasses e tradições dos Reinos Esquecidos (legado).' },
  { id: 'volo2016', titulo: 'Volo’s Guide to Monsters', ano: 2016, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Espécies de legado; algumas possuem versões atualizadas em outros livros.' },
  { id: 'mordenkainen2018', titulo: 'Mordenkainen’s Tome of Foes', ano: 2018, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Opções de espécies e criaturas, legado.' },
  { id: 'eberron2019', titulo: 'Eberron: Rising from the Last War', ano: 2019, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Artífice original, espécies, marcas dracônicas e opções de Eberron.' },
  { id: 'ravnica2018', titulo: 'Guildmasters’ Guide to Ravnica', ano: 2018, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Espécies, guildas e antecedentes específicos de Ravnica.' },
  { id: 'theroes2020', titulo: 'Mythic Odysseys of Theros', ano: 2020, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Espécies, dádivas sobrenaturais e subclasses de Theros.' },
  { id: 'wildemount2020', titulo: 'Explorer’s Guide to Wildemount', ano: 2020, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Opções de Wildemount, magias e subclasse (publicação oficial licenciada).' },
  { id: 'ravenloft2021', titulo: 'Van Richten’s Guide to Ravenloft', ano: 2021, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Linhagens, opções de personagem e cenários de horror.' },
  { id: 'spelljammer2022', titulo: 'Spelljammer: Adventures in Space', ano: 2022, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Espécies e equipamentos de fantasia espacial.' },
  { id: 'dragonlance2022', titulo: 'Dragonlance: Shadow of the Dragon Queen', ano: 2022, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Talentos, antecedentes e equipamentos de Krynn.' },
  { id: 'strixhaven2021', titulo: 'Strixhaven: A Curriculum of Chaos', ano: 2021, versao: '5e (2014)', categoria: 'cenario', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Antecedentes acadêmicos, talentos e magias.' },
  { id: 'elemental2015', titulo: 'Elemental Evil Player’s Companion', ano: 2015, versao: '5e (2014)', categoria: 'suplemento', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Espécies, magias e opções elementais.' },
  { id: 'dmg2014', titulo: 'Dungeon Master’s Guide', ano: 2014, versao: '5e (2014)', categoria: 'mestre', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Regras opcionais, itens e ferramentas do mestre.' },
  { id: 'mm2014', titulo: 'Monster Manual', ano: 2014, versao: '5e (2014)', categoria: 'referencia', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Criaturas e estatísticas de adversários; não concede opções de personagem automaticamente.' },
  { id: 'dmg2024', titulo: 'Dungeon Master’s Guide', ano: 2024, versao: '5.5e (2024)', categoria: 'mestre', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Regras do mestre, itens mágicos e ferramentas de campanha.' },
  { id: 'mm2025', titulo: 'Monster Manual', ano: 2025, versao: '5.5e (2024)', categoria: 'referencia', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Criaturas revisadas; sem poderes automáticos de jogador.' },
  { id: 'eberron2025', titulo: 'Eberron: Forge of the Artificer', ano: 2025, versao: '5.5e (2024)', categoria: 'cenario', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Revisão de Artífice, subclasses, espécies e opções de Eberron.' },
  { id: 'faerunheroes2025', titulo: 'Forgotten Realms: Heroes of Faerûn', ano: 2025, versao: '5.5e (2024)', categoria: 'suplemento', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Opções de personagem e ambientação dos Reinos Esquecidos.' },
  { id: 'faerunadventures2025', titulo: 'Forgotten Realms: Adventures in Faerûn', ano: 2025, versao: '5.5e (2024)', categoria: 'cenario', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Cenário e orientação para aventuras nos Reinos Esquecidos.' },
  { id: 'ravenloft2026', titulo: 'Ravenloft: The Horrors Within', ano: 2026, versao: '5.5e (2024)', categoria: 'cenario', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Horror e opções de personagens, com regras na obra oficial.' },
  { id: 'arcana2026', titulo: 'Arcana Unleashed', ano: 2026, versao: '5.5e (2024)', categoria: 'suplemento', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Opções arcanas, magia e itens especiais.' },
  { id: 'deadfall2026', titulo: 'Arcana Unleashed: Deadfall', ano: 2026, versao: '5.5e (2024)', categoria: 'aventura', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Aventura e artefatos de Thay; não adiciona automaticamente poderes de jogador.' },
  { id: 'curse2016', titulo: 'Curse of Strahd', ano: 2016, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Vampiros, itens e características de aventura de Baróvia.' },
  { id: 'storm2016', titulo: 'Storm King’s Thunder', ano: 2016, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Itens e conteúdo de aventura com gigantes.' },
  { id: 'tomb2017', titulo: 'Tomb of Annihilation', ano: 2017, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Armas regionais e opções de Chult.' },
  { id: 'dragonheist2018', titulo: 'Waterdeep: Dragon Heist', ano: 2018, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Equipamentos e itens ligados a Águas Profundas.' },
  { id: 'dungeonmage2018', titulo: 'Waterdeep: Dungeon of the Mad Mage', ano: 2018, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Itens e opções do megacalabouço.' },
  { id: 'avernus2019', titulo: 'Baldur’s Gate: Descent into Avernus', ano: 2019, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Equipamentos infernais, itens e cenário.' },
  { id: 'icewind2020', titulo: 'Icewind Dale: Rime of the Frostmaiden', ano: 2020, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Equipamentos e itens regionais do Vale do Vento Gélido.' },
  { id: 'candlekeep2021', titulo: 'Candlekeep Mysteries', ano: 2021, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Itens e magias de aventuras ambientadas em Candlekeep.' },
  { id: 'witchlight2021', titulo: 'The Wild Beyond the Witchlight', ano: 2021, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Itens feéricos e equipamentos da aventura.' },
  { id: 'radiant2022', titulo: 'Journeys Through the Radiant Citadel', ano: 2022, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Aventuras e itens de diferentes culturas e cenários.' },
  { id: 'goldenvault2023', titulo: 'Keys from the Golden Vault', ano: 2023, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Itens e recompensas de aventuras de infiltração.' },
  { id: 'phandelver2023', titulo: 'Phandelver and Below: The Shattered Obelisk', ano: 2023, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Itens e equipamentos de Phandalin e da campanha.' },
  { id: 'vecna2024', titulo: 'Vecna: Eve of Ruin', ano: 2024, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Artefatos e itens da aventura multiversal.' },
  { id: 'quess2024', titulo: 'Quests from the Infinite Staircase', ano: 2024, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Reedições de aventuras clássicas com itens de campanha.' },
  { id: 'tyranny2019', titulo: 'Tyranny of Dragons', ano: 2019, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Compilação de campanhas contra o Culto do Dragão, itens e espólios.' },
  { id: 'yawning2017', titulo: 'Tales from the Yawning Portal', ano: 2017, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Antologia de masmorras com itens clássicos.' },
  { id: 'saltmarsh2019', titulo: 'Ghosts of Saltmarsh', ano: 2019, versao: '5e (2014)', categoria: 'aventura', compatibilidade: 'ambas', implementacao: 'referencia', descricao: 'Navios, aventura marítima e itens.' },
  { id: 'wow2026', titulo: 'D&D: World of Warcraft Gameplay Expansion', ano: 2026, versao: '5.5e (2024)', categoria: 'cenario', compatibilidade: '2024', implementacao: 'referencia', descricao: 'Expansão com acesso antecipado em novembro de 2026; regras comerciais sob consulta da obra.' },
]

export const suplementoDndPorId = (id: unknown): SuplementoDnd | null =>
  typeof id === 'string' ? SUPLEMENTOS_DND.find(s => s.id === id) ?? null : null

export const compativelLivroDnd = (id: string, base: LivroBaseDnd) => {
  if (id === 'phb2014') return base === 'phb2024' // conteúdo legado opcional em mesa revisada
  const sup = suplementoDndPorId(id)
  return !!sup && (sup.compatibilidade === 'ambas' ||
    (base === 'phb2014' && sup.compatibilidade === '2014') ||
    (base === 'phb2024' && sup.compatibilidade === '2024'))
}

export const baseDndValida = (v: unknown): v is LivroBaseDnd => v === 'phb2014' || v === 'phb2024'

/** Documentos antigos sem dndLivros seguem 2024; não converter silenciosamente nenhum atributo. */
export function lerLivrosDnd(v: unknown, padrao: LivroBaseDnd = 'phb2024'): SelecaoLivrosDnd {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { base: padrao, suplementos: [] }
  const raw = v as Record<string, unknown>
  const base = baseDndValida(raw.base) ? raw.base : padrao
  const suplementos = Array.isArray(raw.suplementos) ? [...new Set(raw.suplementos.filter((x): x is string =>
    typeof x === 'string' && compativelLivroDnd(x, base)))].slice(0, 30) : []
  return { base, suplementos }
}

/** Permissões do mestre e edição incompatível também são verificadas no servidor. */
export function validarLivrosDnd(
  antes: unknown, depois: unknown,
  config: { baseLivro?: LivroBaseDnd; fontes?: string[] } | null = null,
  admin = false,
): string[] {
  if (depois === undefined) return []
  if (!depois || typeof depois !== 'object' || Array.isArray(depois)) return ['Seleção de livros D&D inválida.']
  const bruto = depois as Record<string, unknown>
  if (!baseDndValida(bruto.base) || !Array.isArray(bruto.suplementos)) return ['Escolha um Livro do Jogador e uma lista de suplementos válidos.']
  const lista = bruto.suplementos
  if (lista.length > 30 || lista.some(x => typeof x !== 'string') || new Set(lista).size !== lista.length)
    return ['Lista de suplementos D&D inválida ou repetida.']
  const erros: string[] = []
  const anterior = lerLivrosDnd(antes)
  if (config?.baseLivro && config.baseLivro !== bruto.base && !admin)
    erros.push('A edição-base de D&D foi fixada pelo mestre: ' + (config.baseLivro === 'phb2014' ? '2014' : '2024') + '.')
  const permitidas = config?.fontes ? new Set(config.fontes) : null
  for (const id of lista) {
    if (!compativelLivroDnd(id as string, bruto.base)) erros.push('Suplemento não reconhecido ou incompatível com a edição: ' + id)
    if (permitidas && !permitidas.has(id as string) && !anterior.suplementos.includes(id as string) && !admin)
      erros.push('O mestre não liberou o suplemento ' + (suplementoDndPorId(id)?.titulo ?? id) + ' para esta campanha.')
  }
  return erros
}
