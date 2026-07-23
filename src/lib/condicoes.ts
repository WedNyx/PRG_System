export type Condicao = { id: string; emoji: string; nome: string }

export const condicoesDisponiveis: Condicao[] = [
  { id: 'envenenado', emoji: '☠️', nome: 'Envenenado' },
  { id: 'atordoado', emoji: '💫', nome: 'Atordoado' },
  { id: 'caido', emoji: '🔻', nome: 'Caído' },
  { id: 'agarrado', emoji: '✊', nome: 'Agarrado' },
  { id: 'amedrontado', emoji: '😱', nome: 'Amedrontado' },
  { id: 'cego', emoji: '🕶️', nome: 'Cego' },
  { id: 'invisivel', emoji: '👻', nome: 'Invisível' },
  { id: 'concentrando', emoji: '🎯', nome: 'Concentrando' },
  { id: 'inconsciente', emoji: '💤', nome: 'Inconsciente' },
  { id: 'abencoado', emoji: '✨', nome: 'Abençoado' },
]

export const emojiCondicao = Object.fromEntries(
  condicoesDisponiveis.map((c) => [c.id, c.emoji])
)
