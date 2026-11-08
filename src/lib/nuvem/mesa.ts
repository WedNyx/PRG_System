/** Regras puras da mesa virtual (testadas em mesa.test.ts). */
import { condicoesDisponiveis } from '../condicoes'

export type Visibilidade = 'publica' | 'mestre' | 'privada'
export type Evento = { autor_id: string | null; visibilidade: Visibilidade; destinatario_id: string | null }

/** Quem pode ver um evento do chat/rolagem. */
export function podeVerEvento(e: Evento, eu: string, admin: boolean): boolean {
  if (e.visibilidade === 'publica') return true
  if (e.autor_id === eu) return true
  if (e.visibilidade === 'mestre') return admin
  return e.destinatario_id === eu
}
/** Filtro PostgREST equivalente (para buscar só o que a pessoa pode ver). */
export function filtroVisibilidade(eu: string, admin: boolean): string {
  const partes = ['visibilidade.eq.publica', `autor_id.eq.${eu}`, `destinatario_id.eq.${eu}`]
  if (admin) partes.push('visibilidade.eq.mestre')
  return `or=(${partes.join(',')})`
}

const CELULA = /^\d{1,3},\d{1,3}$/
/** Aplica células reveladas/escondidas na névoa (sem duplicar, com limite). */
export function aplicarNevoa(atual: string[], celulas: unknown, revelar: boolean, cols: number, rows: number): string[] {
  const validas = (Array.isArray(celulas) ? celulas : []).filter((c): c is string => typeof c === 'string' && CELULA.test(c))
    .filter(c => { const [x, y] = c.split(',').map(Number); return x < cols && y < rows }).slice(0, 5000)
  const s = new Set(atual)
  for (const c of validas) revelar ? s.add(c) : s.delete(c)
  return [...s].slice(0, 10000)
}

export type EntradaIniciativa = { id: string; nome: string; valor: number; tokenId?: string | null }
/** Valida e ordena a lista de iniciativa (maior primeiro). */
export function normalizarIniciativa(v: unknown): EntradaIniciativa[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, 60).flatMap(e => {
    if (!e || typeof e !== 'object') return []
    const o = e as Record<string, unknown>
    const nome = typeof o.nome === 'string' ? o.nome.trim().slice(0, 60) : ''
    const valor = Number(o.valor)
    if (!nome || !Number.isFinite(valor)) return []
    return [{ id: typeof o.id === 'string' ? o.id.slice(0, 60) : crypto.randomUUID(), nome, valor: Math.round(valor), tokenId: typeof o.tokenId === 'string' ? o.tokenId : null }]
  }).sort((a, b) => b.valor - a.valor)
}

const CONDICOES = new Set(condicoesDisponiveis.map(c => c.id))
export const normalizarCondicoes = (v: unknown) => (Array.isArray(v) ? v : []).filter((c): c is string => typeof c === 'string' && CONDICOES.has(c)).slice(0, 10)
export const corValida = (v: unknown) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v)
export const urlValida = (v: unknown) => v === null || v === '' || (typeof v === 'string' && v.length <= 1000 && /^https:\/\//.test(v))

/** Pontos de um desenho: lista par de números, limitada. */
export function normalizarPontos(v: unknown): number[] | null {
  if (!Array.isArray(v) || v.length < 4 || v.length > 2000 || v.length % 2) return null
  const n = v.map(Number)
  return n.every(Number.isFinite) ? n.map(x => Math.round(x * 10) / 10) : null
}
