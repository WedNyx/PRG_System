/**
 * Molduras de perfil: um enfeite em volta da foto, escolhido em Perfil › Aparência e visto por todo mundo.
 * v0.37.2: redesenhadas com cara de verdade (arte em components/perfil/molduras/arte.ts, efeitos em efeitos.ts).
 * Especiais liberam sozinhas: Coroa do Mestre (mestrou 15 min ou mais na mesa), Criador de Mundos (criou um sistema).
 */
export type Trava = 'mestre' | 'criador' | 'especial'
export type MolduraInfo = { id: string; nome: string; descricao: string; trava?: Trava }
/** Minutos de mesa mestrando para liberar a Coroa do Mestre. */
export const MINUTOS_COROA = 15

export const MOLDURAS: MolduraInfo[] = [
  { id: 'lua', nome: 'Lua Minguante', descricao: 'Lua com crateras e luar, anel de prata e estrelas' },
  { id: 'estrelas', nome: 'Constelação', descricao: 'Nebulosa, poeira de estrelas e um cometa' },
  { id: 'chamas', nome: 'Chamas', descricao: 'Fogo de verdade e anel em brasa' },
  { id: 'gelo', nome: 'Gelo', descricao: 'Cristais lapidados, geada e neve' },
  { id: 'folhas', nome: 'Floresta', descricao: 'Cipós, folhas, flores, cogumelos e vagalumes' },
  { id: 'pirata', nome: 'Pirata', descricao: 'Corda trançada, leme, âncora e o mar' },
  { id: 'neon', nome: 'Neon', descricao: 'Tubos de neon piscando e raios elétricos' },
  { id: 'runas', nome: 'Ritual', descricao: 'Círculo de runas, fumaça vermelha e cinzas' },
  { id: 'ouro', nome: 'Ouro Real', descricao: 'Ouro brilhando, filigrana e gemas lapidadas' },
  { id: 'mestre', nome: 'Coroa do Mestre', descricao: `Para quem já mestrou na mesa por ${MINUTOS_COROA} minutos ou mais`, trava: 'mestre' },
  { id: 'criador', nome: 'Criador de Mundos', descricao: 'Para quem criou um sistema de RPG no site', trava: 'criador' },
  { id: 'leste', nome: 'Escamas do Dragão', descricao: 'Homenagem a Leste: só para quem ajudou a plataforma', trava: 'especial' },
]

/**
 * Quem pode usar as molduras de homenagem (pelo @). O Wed diz quem entra aqui.
 * Mudou a lista? É só editar e publicar.
 */
export const ESPECIAIS: string[] = []

export const molduraPorId = (id: unknown) => MOLDURAS.find(m => m.id === id)
export const ehMoldura = (id: unknown): id is string => !!molduraPorId(id)

export type Conquistas = { mestre: boolean; criador: boolean; usuario?: string | null }
/** Pode usar esta moldura? (`mestre`: mestrou 15 min; `criador`: criou um sistema; `usuario`: o @ da pessoa). */
export function podeUsarMoldura(id: string, quem: Conquistas) {
  const m = molduraPorId(id)
  if (!m) return false
  if (m.trava === 'mestre') return quem.mestre
  if (m.trava === 'criador') return quem.criador
  if (m.trava === 'especial') return !!quem.usuario && ESPECIAIS.includes(quem.usuario)
  return true
}
