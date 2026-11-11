import { rolarExpressao } from './dice'

/** `dano`: sugestão de dano por turno (o mestre pode mudar ou tirar). */
export type Condicao = { id: string; emoji: string; nome: string; dano?: string }

export const condicoesDisponiveis: Condicao[] = [
  { id: 'envenenado', emoji: '☠️', nome: 'Envenenado', dano: '1d4' },
  { id: 'atordoado', emoji: '💫', nome: 'Atordoado' },
  { id: 'caido', emoji: '🔻', nome: 'Caído' },
  { id: 'agarrado', emoji: '✊', nome: 'Agarrado' },
  { id: 'amedrontado', emoji: '😱', nome: 'Amedrontado' },
  { id: 'cego', emoji: '🕶️', nome: 'Cego' },
  { id: 'invisivel', emoji: '👻', nome: 'Invisível' },
  { id: 'concentrando', emoji: '🎯', nome: 'Concentrando' },
  { id: 'inconsciente', emoji: '💤', nome: 'Inconsciente' },
  { id: 'abencoado', emoji: '✨', nome: 'Abençoado' },
  { id: 'sangrando', emoji: '🩸', nome: 'Sangrando', dano: '1d4' },
  { id: 'queimando', emoji: '🔥', nome: 'Queimando', dano: '1d6' },
  { id: 'lento', emoji: '🐌', nome: 'Lento' },
  { id: 'paralisado', emoji: '⛓️', nome: 'Paralisado' },
]

export const emojiCondicao = Object.fromEntries(
  condicoesDisponiveis.map((c) => [c.id, c.emoji])
)
export const nomeCondicao = (id: string) => condicoesDisponiveis.find(c => c.id === id)?.nome ?? id

/** Rodadas restantes por condição (só as ativas, de 1 a 99). Sem número = sem limite. */
export function normalizarRodadas(v: unknown, ativas: string[]): Record<string, number> {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
  const out: Record<string, number> = {}
  for (const id of ativas) { const n = Math.floor(Number(o[id])); if (n >= 1 && n <= 99) out[id] = n }
  return out
}

/**
 * Fim do turno de um token: cada condição com duração perde 1 rodada; as que chegam a 0 saem.
 * Devolve as condições e durações novas e quais acabaram.
 */
export function passarRodada(condicoes: string[], rodadas: Record<string, number>) {
  const r = normalizarRodadas(rodadas, condicoes), acabaram: string[] = [], novas: Record<string, number> = {}
  for (const [id, n] of Object.entries(r)) { if (n <= 1) acabaram.push(id); else novas[id] = n - 1 }
  return { condicoes: condicoes.filter(c => !acabaram.includes(c)), rodadas: novas, acabaram }
}

/** Dano por turno de cada condição ativa: só expressões de dados válidas e pequenas (ex.: “1d6”, “2d4+1”, “3”). */
export function normalizarDanos(v: unknown, ativas: string[]): Record<string, string> {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
  const out: Record<string, string> = {}
  for (const id of ativas) {
    const e = typeof o[id] === 'string' ? (o[id] as string).toLowerCase().replace(/\s+/g, '').slice(0, 20) : ''
    if (!e || !/^[0-9d+-]+$/.test(e)) continue
    const r = rolarExpressao(e)
    if (r && r.resultados.length <= 10) out[id] = e
  }
  return out
}
