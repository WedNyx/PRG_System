/**
 * Subir de nível guiado: pontos de atributo que a tabela de progressão dá (coluna “atributos”)
 * e quanto deles o jogador já colocou em cada atributo. Funções puras (nivel.test.ts).
 */
import type { DadosFicha, Sistema } from './tipos'

const limpo = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0))

/** Pontos de nível já colocados (soma de nivelAtributos). */
export function pontosColocados(d: DadosFicha) {
  return Object.values(d.nivelAtributos ?? {}).reduce((a, v) => a + limpo(v), 0)
}

/**
 * Coloca (+1) ou tira (−1) um ponto de nível de um atributo. Respeita o máximo do atributo,
 * o total disponível e só tira pontos que vieram de nível. Devolve null se não puder.
 */
export function moverPonto(s: Sistema, d: DadosFicha, id: string, delta: 1 | -1, disponivel: number): DadosFicha | null {
  const a = s.atributos.find(x => x.id === id)
  if (!a) return null
  const ja = limpo(d.nivelAtributos?.[id]), valor = Number(d.atributos[id] ?? a.padrao) || 0
  if (delta > 0 && (pontosColocados(d) >= disponivel || valor >= a.max)) return null
  if (delta < 0 && (ja <= 0 || valor <= a.min)) return null
  const nivelAtributos = { ...(d.nivelAtributos ?? {}), [id]: ja + delta }
  if (!nivelAtributos[id]) delete nivelAtributos[id]
  return { ...d, atributos: { ...d.atributos, [id]: valor + delta }, nivelAtributos }
}
