/**
 * “À beira da morte”: quando a vida chega a 0, o personagem cai e faz testes contra a morte no começo
 * de cada turno dele (d20: 10+ sucesso, 9− falha, 1 = duas falhas, 20 = volta com 1 de vida).
 * 3 sucessos = estável; 3 falhas = morreu. Dano em quem está caído é uma falha (crítico: duas).
 * Regra opcional “Medidas desesperadas”: enquanto está de pé, o jogador aceita falhas futuras em troca de
 * agir além do normal; elas entram na conta assim que ele cair. Funções puras (morte.test.ts).
 */
export type RegraMorte = 'desligado' | 'testes' | 'desesperadas'
export type EstadoMorte = { estado?: 'caido' | 'estavel' | 'morto'; sucessos: number; falhas: number; futuras: number }

export const MEDIDAS: Record<1 | 3, string> = {
  1: 'sair do combate sem provocar ataques, correr o dobro ou +5 numa rolagem de d20',
  3: 'um ataque extra ou recuperar um uso de magia/poder',
}

const n03 = (v: unknown) => Math.max(0, Math.min(3, Math.floor(Number(v)) || 0))
export function lerMorte(v: unknown): EstadoMorte {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const estado = o.estado === 'caido' || o.estado === 'estavel' || o.estado === 'morto' ? o.estado : undefined
  return { ...(estado ? { estado } : {}), sucessos: n03(o.sucessos), falhas: n03(o.falhas), futuras: n03(o.futuras) }
}
export const lerRegraMorte = (v: unknown): RegraMorte => v === 'desligado' || v === 'desesperadas' ? v : 'testes'

const fechar = (m: EstadoMorte): EstadoMorte =>
  m.falhas >= 3 ? { ...m, falhas: 3, estado: 'morto' } : m.sucessos >= 3 ? { ...m, sucessos: 3, estado: 'estavel' } : m

/** A vida chegou a 0: cai, e as falhas futuras aceitas entram na conta. */
export function aoCair(m: EstadoMorte): EstadoMorte {
  return fechar({ estado: 'caido', sucessos: 0, falhas: Math.min(3, m.futuras), futuras: 0 })
}
/** Levou dano já caído (ou estável): uma falha, duas se foi crítico. */
export function danoCaido(m: EstadoMorte, critico = false): EstadoMorte {
  if (m.estado === 'morto') return m
  return fechar({ ...m, estado: 'caido', sucessos: m.estado === 'estavel' ? 0 : m.sucessos, falhas: m.falhas + (critico ? 2 : 1) })
}
/** Voltou a ter vida: zera a contagem (as falhas futuras continuam guardadas). */
export const aoLevantar = (m: EstadoMorte): EstadoMorte => ({ sucessos: 0, falhas: 0, futuras: m.futuras })

/** Teste contra a morte com o d20 já rolado. `levanta` = voltou com 1 de vida (20 natural). */
export function testeMorte(m: EstadoMorte, d20: number): { m: EstadoMorte; texto: string; levanta: boolean } {
  if (d20 >= 20) return { m: aoLevantar(m), texto: '🌟 20 natural! Volta com 1 de vida.', levanta: true }
  const novo = fechar(d20 <= 1 ? { ...m, falhas: m.falhas + 2 } : d20 >= 10 ? { ...m, sucessos: m.sucessos + 1 } : { ...m, falhas: m.falhas + 1 })
  const base = d20 <= 1 ? '💀 1 natural: duas falhas' : d20 >= 10 ? `✅ ${d20}: sucesso` : `❌ ${d20}: falha`
  const fim = novo.estado === 'morto' ? ' — morreu.' : novo.estado === 'estavel' ? ' — estável!' : ` (✅ ${novo.sucessos}/3 · ❌ ${novo.falhas}/3)`
  return { m: novo, texto: base + fim, levanta: false }
}
/** Medidas desesperadas: aceitar 1 ou 3 falhas futuras (no máximo 3 guardadas). */
export function aceitarMedida(m: EstadoMorte, n: 1 | 3): EstadoMorte | null {
  if (m.estado) return null
  if (m.futuras + n > 3) return null
  return { ...m, futuras: m.futuras + n }
}
