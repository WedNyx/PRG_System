/**
 * Áreas de efeito no mapa (v0.34.9): círculo, cone, linha e quadrado, para magias, explosões e sopros.
 * Medidas em células da grade; o tamanho é guardado em metros (1 célula = METROS_POR_CELULA_MESA).
 * A mesma conta roda no navegador (desenho e destaque) e no servidor (validação).
 */
import { METROS_POR_CELULA_MESA } from '../nuvem/mesa'

export type FormaArea = 'circulo' | 'cone' | 'linha' | 'quadrado'
export const FORMAS_AREA: { id: FormaArea; nome: string; icone: string; dica: string }[] = [
  { id: 'circulo', nome: 'Círculo', icone: '◯', dica: 'Raio a partir do ponto (explosão, bola de fogo)' },
  { id: 'cone', nome: 'Cone', icone: '◣', dica: 'Sai do ponto e abre na direção que você arrastar (sopro, leque)' },
  { id: 'linha', nome: 'Linha', icone: '━', dica: 'Reta de 1 célula de largura na direção que você arrastar (raio, relâmpago)' },
  { id: 'quadrado', nome: 'Quadrado', icone: '▢', dica: 'Quadrado centrado no ponto (cubo, nuvem)' },
]
export const MAX_AREAS_POR_CENA = 30
export const CORES_AREA = ['#f97316', '#38bdf8', '#a78bfa', '#22c55e', '#f43f5e', '#facc15']

export type AreaEfeito = {
  id: string; forma: FormaArea
  /** Ponto de origem (em células; .5 = centro da célula). */
  x: number; y: number
  /** Direção em graus (0 = direita, 90 = baixo). Só vale para cone e linha. */
  angulo: number
  /** Raio (círculo), comprimento (cone, linha) ou lado (quadrado), em metros. */
  metros: number
  cor: string; nome: string; autor_id?: string | null
}

const finito = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
/** Abertura do cone: a largura no fim é igual ao comprimento (meia-abertura ≈ 26,6°), como na maioria dos d20. */
export const MEIA_ABERTURA_CONE = Math.atan(0.5)

/** Valida e limpa uma área vinda do navegador. null = inválida. */
export function normalizarAreaEfeito(v: unknown, cols: number, rows: number): AreaEfeito | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const forma = FORMAS_AREA.some(f => f.id === o.forma) ? o.forma as FormaArea : null
  if (!forma || !finito(o.x) || !finito(o.y) || !finito(o.metros)) return null
  if (o.x < 0 || o.y < 0 || o.x > cols || o.y > rows) return null
  const metros = Math.round(o.metros * 10) / 10
  if (metros < METROS_POR_CELULA_MESA / 2 || metros > 300) return null
  const angulo = finito(o.angulo) ? ((Math.round(o.angulo) % 360) + 360) % 360 : 0
  const cor = typeof o.cor === 'string' && /^#[0-9a-f]{6}$/i.test(o.cor) ? o.cor.toLowerCase() : CORES_AREA[0]
  const nome = typeof o.nome === 'string' ? o.nome.trim().slice(0, 40) : ''
  const id = typeof o.id === 'string' && /^[a-zA-Z0-9-]{8,40}$/.test(o.id) ? o.id : crypto.randomUUID()
  return { id, forma, x: Math.round(o.x * 2) / 2, y: Math.round(o.y * 2) / 2, angulo, metros, cor, nome }
}

/** Lê a lista guardada na cena (ignora o que estiver estragado). */
export function lerAreasEfeito(v: unknown, cols: number, rows: number): AreaEfeito[] {
  if (!Array.isArray(v)) return []
  return v.slice(0, MAX_AREAS_POR_CENA).flatMap(x => {
    const a = normalizarAreaEfeito(x, cols, rows)
    if (!a) return []
    const autor = (x as { autor_id?: unknown }).autor_id
    return [{ ...a, autor_id: typeof autor === 'string' ? autor : null }]
  })
}

/** O ponto (em células) está dentro da área? */
export function pontoNaArea(a: AreaEfeito, px: number, py: number): boolean {
  const L = a.metros / METROS_POR_CELULA_MESA
  const dx = px - a.x, dy = py - a.y
  if (a.forma === 'circulo') return dx * dx + dy * dy <= L * L + 1e-9
  if (a.forma === 'quadrado') return Math.abs(dx) <= L / 2 + 1e-9 && Math.abs(dy) <= L / 2 + 1e-9
  const ang = a.angulo * Math.PI / 180
  const ux = Math.cos(ang), uy = Math.sin(ang)
  const ao = dx * ux + dy * uy // ao longo da direção
  const lado = -dx * uy + dy * ux // para o lado
  if (ao < 0 || ao > L + 1e-9) return false
  if (a.forma === 'linha') return Math.abs(lado) <= 0.5 + 1e-9
  return Math.abs(lado) <= ao * Math.tan(MEIA_ABERTURA_CONE) + 1e-9
}

/** Tokens atingidos: algum centro das células que o token ocupa cai dentro da área. */
export function tokensNaArea<T extends { id: string; x: number; y: number; tamanho?: number }>(a: AreaEfeito, tokens: T[]): T[] {
  return tokens.filter(t => {
    const tam = Math.max(1, t.tamanho ?? 1)
    for (let i = 0; i < tam; i++) for (let j = 0; j < tam; j++) if (pontoNaArea(a, t.x + i + 0.5, t.y + j + 0.5)) return true
    return false
  })
}

/** Contorno da área em células, para desenhar (SVG): círculo, retângulo ou polígono. */
export function contornoArea(a: AreaEfeito): { tipo: 'circulo'; cx: number; cy: number; r: number } | { tipo: 'poligono'; pontos: [number, number][] } {
  const L = a.metros / METROS_POR_CELULA_MESA
  if (a.forma === 'circulo') return { tipo: 'circulo', cx: a.x, cy: a.y, r: L }
  if (a.forma === 'quadrado') return { tipo: 'poligono', pontos: [[a.x - L / 2, a.y - L / 2], [a.x + L / 2, a.y - L / 2], [a.x + L / 2, a.y + L / 2], [a.x - L / 2, a.y + L / 2]] }
  const ang = a.angulo * Math.PI / 180, ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux
  if (a.forma === 'linha') {
    const w = 0.5
    return { tipo: 'poligono', pontos: [[a.x + nx * w, a.y + ny * w], [a.x + ux * L + nx * w, a.y + uy * L + ny * w], [a.x + ux * L - nx * w, a.y + uy * L - ny * w], [a.x - nx * w, a.y - ny * w]] }
  }
  // Cone: triângulo com a ponta na origem e o fim reto, igual ao que pontoNaArea considera dentro.
  const larg = Math.tan(MEIA_ABERTURA_CONE) * L
  return { tipo: 'poligono', pontos: [[a.x, a.y], [a.x + ux * L + nx * larg, a.y + uy * L + ny * larg], [a.x + ux * L - nx * larg, a.y + uy * L - ny * larg]] }
}

/** Direção (graus inteiros) do ponto de origem até onde a pessoa arrastou. */
export const anguloEntre = (x1: number, y1: number, x2: number, y2: number) => Math.round(((Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) + 360) % 360)
