/**
 * Liga cada referência de arma ao livro exato escolhido na ficha.
 * Referências sem publicação verificável NÃO entram nos arsenais oficiais.
 * Não é um catálogo de efeitos mágicos: o texto do suplemento continua na fonte.
 */
import type { ReferenciaArmaDnd } from './dnd2024ArmasExpandidas'
import { ARMAS_DND_2014 } from './dnd2014Armas'
import { ARMAS_DND_2024 } from './dnd2024Armas'
import { compativelLivroDnd, suplementoDndPorId, type LivroBaseDnd } from './dndLivros'

export const ARMAS_BASE_DND = { phb2014: ARMAS_DND_2014, phb2024: ARMAS_DND_2024 } as const

const FONTES_DAS_ARMAS: Record<string, string> = {
  'Guia do Mestre 2024': 'dmg2024',
  'Xanathar’s Guide to Everything': 'xanathar2017',
  'Tasha’s Cauldron of Everything': 'tasha2020',
  'Eberron: Rising from the Last War': 'eberron2019',
  'Explorer’s Guide to Wildemount': 'wildemount2020',
  'Mythic Odysseys of Theros': 'theroes2020',
  'Fizban’s Treasury of Dragons': 'fizban2021',
  'Bigby Presents: Glory of the Giants': 'bigby2023',
  'The Book of Many Things': 'bookmany2023',
  'Tomb of Annihilation': 'tomb2017',
  'Dragonlance: Shadow of the Dragon Queen': 'dragonlance2022',
  'Curse of Strahd': 'curse2016',
  'Baldur’s Gate: Descent into Avernus': 'avernus2019',
  'Waterdeep: Dungeon of the Mad Mage': 'dungeonmage2018',
  'Waterdeep: Dragon Heist': 'dragonheist2018',
  'Tales from the Yawning Portal': 'yawning2017',
  'Storm King’s Thunder': 'storm2016',
  'Van Richten’s Guide to Ravenloft': 'ravenloft2021',
  'Guildmasters’ Guide to Ravnica': 'ravnica2018',
  'Phandelver and Below: The Shattered Obelisk': 'phandelver2023',
  'Candlekeep Mysteries': 'candlekeep2021',
  'Tyranny of Dragons': 'tyranny2019',
  'The Wild Beyond the Witchlight': 'witchlight2021',
  'Ravenloft: The Horrors Within': 'ravenloft2026',
  'Arcana Unleashed: Deadfall': 'deadfall2026',
  'D&D: World of Warcraft (acesso antecipado 2026)': 'wow2026',
}
export const fonteDeReferenciaArma = (ref: ReferenciaArmaDnd): string | null => {
  if (!ref.conferida) return null
  if (ref.livro === 'Dungeon Master’s Guide 2014 / 2024') return null // duas fontes: conferir separadamente
  return FONTES_DAS_ARMAS[ref.livro] ?? null
}
/** Tanto DMG 2014 quanto 2024 listam itens com o mesmo nome; os efeitos
 * devem ser conferidos na edição específica escolhida, sem assumir identidade.
 */
export const referenciaPertenceAoLivro = (ref: ReferenciaArmaDnd, livro: string): boolean =>
  !!ref.conferida && (ref.livro === 'Dungeon Master’s Guide 2014 / 2024'
    ? livro === 'dmg2014' || livro === 'dmg2024'
    : fonteDeReferenciaArma(ref) === livro)

export function arsenaisPermitidosDnd(base: LivroBaseDnd, suplementos: string[]): string[] {
  return [
    base, ...(base === 'phb2024' && suplementos.includes('phb2014') ? ['phb2014'] : []),
    ...suplementos.filter(id => suplementoDndPorId(id) && compativelLivroDnd(id, base)),
  ].filter((id, i, lista) => lista.indexOf(id) === i)
}
/** Nome completo e EDIÇÃO (não apenas 'D&D') no seletor de arsenal. */
export function rotuloArsenalDnd(id: string): string {
  if (id === 'phb2014') return 'Livro do Jogador / Player’s Handbook (2014 · D&D 5e)'
  if (id === 'phb2024') return 'Livro do Jogador / Player’s Handbook (2024 · D&D 5.5e)'
  const s = suplementoDndPorId(id)
  return s ? s.titulo + ' (' + s.ano + ' · ' + s.versao + ')' : id
}
