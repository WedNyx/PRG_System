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
/** Tamanho máximo do mapa (células por lado). v0.33.8: 100 → 200. */
export const MAX_GRADE = 200
/** Cada célula do mapa vale 1,5 m. */
export const METROS_POR_CELULA_MESA = 1.5
/** Lê a névoa guardada: “x,y” (uma célula) ou “a-b,y” (células a até b da linha y, formato compacto da v0.33.8). */
export function expandirNevoa(lista: readonly string[] | null | undefined): Set<string> {
  const s = new Set<string>()
  for (const k of lista ?? []) {
    const m = /^(\d{1,3})(?:-(\d{1,3}))?,(\d{1,3})$/.exec(k)
    if (!m) continue
    const a = Number(m[1]), b = m[2] === undefined ? a : Number(m[2]), y = Number(m[3])
    for (let x = Math.min(a, b); x <= Math.max(a, b); x++) s.add(`${x},${y}`)
  }
  return s
}
/** Guarda a névoa em faixas por linha (um mapa 200×200 todo revelado vira 200 textos, não 40 mil). */
export function compactarNevoa(s: Set<string>, cols: number, rows: number): string[] {
  const out: string[] = []
  for (let y = 0; y < rows; y++) {
    let ini = -1
    for (let x = 0; x <= cols; x++) {
      const tem = x < cols && s.has(`${x},${y}`)
      if (tem && ini < 0) ini = x
      if (!tem && ini >= 0) { out.push(ini === x - 1 ? `${ini},${y}` : `${ini}-${x - 1},${y}`); ini = -1 }
    }
  }
  return out
}
/** Aplica células reveladas/escondidas na névoa (sem duplicar). `retangulo` revela/esconde uma área inteira. */
export function aplicarNevoa(atual: string[], celulas: unknown, revelar: boolean, cols: number, rows: number, retangulo?: unknown): string[] {
  const validas = (Array.isArray(celulas) ? celulas : []).filter((c): c is string => typeof c === 'string' && CELULA.test(c))
    .filter(c => { const [x, y] = c.split(',').map(Number); return x < cols && y < rows }).slice(0, 5000)
  const s = expandirNevoa(atual)
  for (const c of validas) { if (revelar) s.add(c); else s.delete(c) }
  const r = lerRetangulo(retangulo, cols, rows)
  if (r) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { if (revelar) s.add(`${x},${y}`); else s.delete(`${x},${y}`) }
  return compactarNevoa(s, cols, rows)
}
/** Retângulo em células, preso dentro do mapa (null se inválido). */
export function lerRetangulo(v: unknown, cols: number, rows: number): { x: number; y: number; w: number; h: number } | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const n = (k: string) => Math.round(Number(o[k]))
  let x = n('x'), y = n('y'), w = n('w'), h = n('h')
  if (![x, y, w, h].every(Number.isFinite) || w < 1 || h < 1) return null
  x = Math.max(0, Math.min(cols - 1, x)); y = Math.max(0, Math.min(rows - 1, y))
  w = Math.min(w, cols - x); h = Math.min(h, rows - y)
  return { x, y, w, h }
}

/** v0.33.8 — partes do mapa que têm névoa. Sem nenhuma área, a névoa cobre o mapa inteiro (como antes). */
export type AreaNevoa = { id: string; nome: string; x: number; y: number; w: number; h: number; revelada: boolean }
export const MAX_AREAS_NEVOA = 80
export function normalizarAreasNevoa(v: unknown, cols: number, rows: number): AreaNevoa[] | null {
  if (!Array.isArray(v) || v.length > MAX_AREAS_NEVOA) return null
  const out: AreaNevoa[] = []
  for (const a of v) {
    const r = lerRetangulo(a, cols, rows)
    if (!r) continue
    const o = a as Record<string, unknown>
    out.push({ id: typeof o.id === 'string' && /^[\w-]{1,40}$/.test(o.id) ? o.id : crypto.randomUUID(), nome: typeof o.nome === 'string' ? o.nome.trim().slice(0, 40) : '', ...r, revelada: o.revelada === true })
  }
  return out
}

/** v0.33.8 — luz própria do token, em metros: raio de luz plena e, depois dele, a penumbra. */
export type LuzToken = { brilho: number; penumbra: number; cor: string }
export const MAX_LUZ_METROS = 60
export function normalizarLuz(v: unknown): LuzToken | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const m = (k: string) => { const n = Number(o[k]); return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(MAX_LUZ_METROS, n)) * 2) / 2 : 0 }
  const brilho = m('brilho'), penumbra = m('penumbra')
  if (!brilho && !penumbra) return null
  return { brilho, penumbra, cor: corValida(o.cor) ? o.cor as string : '#ffd27a' }
}
/** Luzes prontas (o que cada fonte de luz costuma iluminar), em metros. */
export const LUZES_PRONTAS: { nome: string; brilho: number; penumbra: number; cor: string }[] = [
  { nome: 'Vela', brilho: 1.5, penumbra: 1.5, cor: '#ffcf7a' }, { nome: 'Tocha', brilho: 6, penumbra: 6, cor: '#ffb347' },
  { nome: 'Lanterna', brilho: 9, penumbra: 9, cor: '#ffe29a' }, { nome: 'Magia de luz', brilho: 6, penumbra: 6, cor: '#e0f2ff' },
  { nome: 'Fogueira', brilho: 9, penumbra: 12, cor: '#ff8c42' },
]

/**
 * Quais células ficam com névoa (1) para quem não é o mestre.
 * Névoa = (dentro de uma área escondida, ou o mapa todo se não houver áreas) − células reveladas − luz dos personagens.
 */
export function mapaDeNevoa(o: { cols: number; rows: number; areas: AreaNevoa[]; reveladas: Set<string>; luzes?: { x: number; y: number; raio: number }[] }): Uint8Array {
  const { cols, rows } = o
  const m = new Uint8Array(cols * rows)
  if (!o.areas.length) m.fill(1)
  else for (const a of o.areas) if (!a.revelada) for (let y = a.y; y < Math.min(rows, a.y + a.h); y++) m.fill(1, y * cols + a.x, y * cols + Math.min(cols, a.x + a.w))
  for (const k of o.reveladas) { const [x, y] = k.split(',').map(Number); if (x < cols && y < rows) m[y * cols + x] = 0 }
  for (const l of o.luzes ?? []) {
    const r = Math.ceil(l.raio)
    for (let y = Math.max(0, Math.floor(l.y - r)); y <= Math.min(rows - 1, Math.ceil(l.y + r)); y++)
      for (let x = Math.max(0, Math.floor(l.x - r)); x <= Math.min(cols - 1, Math.ceil(l.x + r)); x++)
        if ((x + 0.5 - l.x) ** 2 + (y + 0.5 - l.y) ** 2 <= l.raio ** 2) m[y * cols + x] = 0
  }
  return m
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
/** Recorte (cx, cy, cw, ch) em frações da imagem original (0 a 1): qual parte da imagem aparece. */
export type Camada = { id: string; url: string; x: number; y: number; w: number; h: number; cx?: number; cy?: number; cw?: number; ch?: number }
/** Imagens que compõem o mapa (posição e tamanho em células). */
export function normalizarCamadas(v: unknown, cols: number, rows: number): Camada[] | null {
  if (!Array.isArray(v) || v.length > 30) return null
  const out: Camada[] = []
  for (const c of v) {
    if (!c || typeof c !== 'object') return null
    const o = c as Record<string, unknown>
    if (typeof o.url !== 'string' || !/^https:\/\//.test(o.url) || o.url.length > 1000) return null
    const n = (k: string, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(o[k]) || 0)))
    const camada: Camada = { id: typeof o.id === 'string' && o.id.length <= 60 ? o.id : crypto.randomUUID(), url: o.url,
      x: n('x', -100, cols), y: n('y', -100, rows), w: n('w', 1, 200), h: n('h', 1, 200) }
    const r = normalizarRecorte(o)
    if (r) Object.assign(camada, r)
    out.push(camada)
  }
  return out
}

/** Células de um retângulo (para revelar/esconder uma área de uma vez). */
export function celulasRetangulo(x1: number, y1: number, x2: number, y2: number, max = 5000): string[] {
  const out: string[] = []
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2) && out.length < max; y++) for (let x = Math.min(x1, x2); x <= Math.max(x1, x2) && out.length < max; x++) out.push(`${x},${y}`)
  return out
}
/** Células cobertas por um pincel quadrado de tamanho n centrado na célula. */
export function celulasPincel(x: number, y: number, n: number): string[] {
  const r = Math.floor(Math.max(1, n) / 2)
  return celulasRetangulo(Math.max(0, x - r), Math.max(0, y - r), x + r, y + r)
}
export const todasCelulas = (cols: number, rows: number) => celulasRetangulo(0, 0, cols - 1, rows - 1, cols * rows)

export type Movimento = 'dono' | 'todos' | 'mestre'
/** Quem pode arrastar um token: mestre sempre; jogadores conforme a regra do token e a trava da cena. */
export function podeMoverToken(t: { movimento: Movimento; dono_id: string | null }, eu: string, admin: boolean, cenaTravada: boolean): boolean {
  if (admin) return true
  if (cenaTravada || t.movimento === 'mestre') return false
  return t.movimento === 'todos' || t.dono_id === eu
}

const fr = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(1, n)) * 10000) / 10000 : null }
/** Recorte válido (mínimo 2% da imagem, sem passar da borda) ou null para "imagem inteira". */
export function normalizarRecorte(o: Record<string, unknown>): { cx: number; cy: number; cw: number; ch: number } | null {
  if (o.cw === undefined && o.ch === undefined) return null
  let cx = fr(o.cx) ?? 0, cy = fr(o.cy) ?? 0
  let cw = fr(o.cw) ?? 1, ch = fr(o.ch) ?? 1
  cw = Math.max(0.02, cw); ch = Math.max(0.02, ch)
  cx = Math.min(cx, 1 - cw); cy = Math.min(cy, 1 - ch)
  if (cx === 0 && cy === 0 && cw === 1 && ch === 1) return null
  return { cx, cy, cw, ch }
}
