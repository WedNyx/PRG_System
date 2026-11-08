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

// ---- v0.6.0: mapa em camadas, pincéis de névoa e permissão de mover tokens ----
export type Camada = { id: string; url: string; x: number; y: number; w: number; h: number }
/** Imagens que compõem o mapa (posição e tamanho em células). */
export function normalizarCamadas(v: unknown, cols: number, rows: number): Camada[] | null {
  if (!Array.isArray(v) || v.length > 30) return null
  const out: Camada[] = []
  for (const c of v) {
    if (!c || typeof c !== 'object') return null
    const o = c as Record<string, unknown>
    if (typeof o.url !== 'string' || !/^https:\/\//.test(o.url) || o.url.length > 1000) return null
    const n = (k: string, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(o[k]) || 0)))
    out.push({ id: typeof o.id === 'string' && o.id.length <= 60 ? o.id : crypto.randomUUID(), url: o.url,
      x: n('x', -100, cols), y: n('y', -100, rows), w: n('w', 1, 200), h: n('h', 1, 200) })
  }
  return out
}

/** Células de um retângulo (para revelar/esconder uma área de uma vez). */
export function celulasRetangulo(x1: number, y1: number, x2: number, y2: number): string[] {
  const out: string[] = []
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) out.push(`${x},${y}`)
  return out.slice(0, 5000)
}
/** Células cobertas por um pincel quadrado de tamanho n centrado na célula. */
export function celulasPincel(x: number, y: number, n: number): string[] {
  const r = Math.floor(Math.max(1, n) / 2)
  return celulasRetangulo(Math.max(0, x - r), Math.max(0, y - r), x + r, y + r)
}
export const todasCelulas = (cols: number, rows: number) => celulasRetangulo(0, 0, cols - 1, rows - 1)

export type Movimento = 'dono' | 'todos' | 'mestre'
/** Quem pode arrastar um token: mestre sempre; jogadores conforme a regra do token e a trava da cena. */
export function podeMoverToken(t: { movimento: Movimento; dono_id: string | null }, eu: string, admin: boolean, cenaTravada: boolean): boolean {
  if (admin) return true
  if (cenaTravada || t.movimento === 'mestre') return false
  return t.movimento === 'todos' || t.dono_id === eu
}
