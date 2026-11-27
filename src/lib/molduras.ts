/**
 * Molduras de perfil (v0.37.1): um enfeite em volta da foto, escolhido em Perfil › Aparência e visto por todo mundo.
 * Arte nossa (SVG em components/perfil/Moldura.tsx). Algumas são especiais e só liberam para quem cumpre a condição.
 */
export type Trava = 'mestre' | 'especial'
export type MolduraInfo = { id: string; nome: string; descricao: string; trava?: Trava }

export const MOLDURAS: MolduraInfo[] = [
  { id: 'lua', nome: 'Lua Minguante', descricao: 'Anel prateado com a lua e estrelas' },
  { id: 'estrelas', nome: 'Constelação', descricao: 'Estrelas ligadas em volta da foto' },
  { id: 'chamas', nome: 'Chamas', descricao: 'Labaredas laranja e vermelhas' },
  { id: 'gelo', nome: 'Gelo', descricao: 'Cristais azul-claros' },
  { id: 'folhas', nome: 'Floresta', descricao: 'Folhas verdes em volta' },
  { id: 'pirata', nome: 'Pirata', descricao: 'Corda de navio com âncora' },
  { id: 'neon', nome: 'Neon', descricao: 'Anel ciano e rosa, estilo cyber' },
  { id: 'runas', nome: 'Ritual', descricao: 'Anel escuro com marcas de ritual' },
  { id: 'ouro', nome: 'Ouro Real', descricao: 'Anel duplo dourado com gemas' },
  { id: 'mestre', nome: 'Coroa do Mestre', descricao: 'Para quem mestra pelo menos uma campanha', trava: 'mestre' },
  { id: 'leste', nome: 'Escamas do Dragão', descricao: 'Homenagem a Leste: só para quem ajudou a plataforma', trava: 'especial' },
]

/**
 * Quem pode usar as molduras especiais (pelo @). O Wed diz quem entra aqui.
 * Mudou a lista? É só editar e publicar.
 */
export const ESPECIAIS: string[] = []

export const molduraPorId = (id: unknown) => MOLDURAS.find(m => m.id === id)
export const ehMoldura = (id: unknown): id is string => !!molduraPorId(id)

/** Pode usar esta moldura? (`mestre`: mestra alguma campanha; `usuario`: o @ da pessoa). */
export function podeUsarMoldura(id: string, quem: { mestre: boolean; usuario?: string | null }) {
  const m = molduraPorId(id)
  if (!m) return false
  if (m.trava === 'mestre') return quem.mestre
  if (m.trava === 'especial') return !!quem.usuario && ESPECIAIS.includes(quem.usuario)
  return true
}
