/**
 * Visão e luz com paredes (v0.35.0). Parede e porta fechada bloqueiam a visão e a luz; janela e porta aberta deixam ver.
 * Coordenadas em células (o centro da célula x,y é x+0.5, y+0.5). A mesma conta roda no navegador e no servidor.
 */
import { cruzam, type Parede } from './paredes'
import { compactarNevoa, expandirNevoa, METROS_POR_CELULA_MESA } from '../nuvem/mesa'

export type Segmento = [number, number, number, number]
export const bloqueiaVisao = (p: Parede) => p.tipo === 'parede' || (p.tipo === 'porta' && !p.aberta)
export const segmentosVisao = (paredes: Parede[]): Segmento[] => paredes.filter(bloqueiaVisao).map(p => [p.x1, p.y1, p.x2, p.y2])
/** Alcance da visão em células: 0 metros = sem limite (até 60 células, o bastante para qualquer sala). */
export const SEM_LIMITE_CELULAS = 60
export const alcanceCelulas = (metros: number | null | undefined) => metros && metros > 0 ? metros / METROS_POR_CELULA_MESA : SEM_LIMITE_CELULAS

/**
 * Visão de cada personagem (v0.35.2): até onde enxerga (0 = o que a cena define) e até onde enxerga no escuro
 * (visão no escuro de elfo, anão etc.; 0 = não tem). Em metros.
 */
export type VisaoToken = { alcance: number; escuro: number }
export function normalizarVisao(v: unknown): VisaoToken | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const m = (k: string) => { const n = Number(o[k]); return Number.isFinite(n) ? Math.round(Math.max(0, Math.min(300, n)) * 2) / 2 : 0 }
  const alcance = m('alcance'), escuro = m('escuro')
  return alcance || escuro ? { alcance, escuro } : null
}
/** A partir desta escuridão (0–100), só se enxerga o que está iluminado ou dentro da visão no escuro. */
export const ESCURO_A_PARTIR_DE = 50
export const estaEscuro = (escuridao: number | null | undefined) => (escuridao ?? 0) >= ESCURO_A_PARTIR_DE
/** Luz em células: centro e raio total (luz plena + penumbra). */
export type LuzCelulas = { x: number; y: number; raio: number }
/** O ponto está iluminado por alguma luz (dentro do raio e sem parede no caminho)? */
export function iluminado(px: number, py: number, luzes: LuzCelulas[], segs: Segmento[]): boolean {
  return luzes.some(l => (px - l.x) ** 2 + (py - l.y) ** 2 <= l.raio * l.raio && temLinhaDeVisao(l.x, l.y, px, py, segs))
}
/** Alcance da visão de um personagem em células: o dele, ou o da cena. */
export const alcanceDoToken = (v: VisaoToken | null | undefined, metrosCena: number | null | undefined) => alcanceCelulas(v?.alcance ? v.alcance : metrosCena)

/** Nada bloqueia a linha entre A e B? */
export function temLinhaDeVisao(ax: number, ay: number, bx: number, by: number, segs: Segmento[]): boolean {
  for (const s of segs) if (cruzam(ax, ay, bx, by, s[0], s[1], s[2], s[3])) return false
  return true
}

/**
 * Células que o personagem enxerga: dentro do alcance e com linha de visão até o centro da célula
 * (ou até perto de um dos cantos, para a célula junto da parede também aparecer).
 */
export function celulasVisiveis(ox: number, oy: number, segs: Segmento[], cols: number, rows: number, raio: number,
  /** No escuro (v0.35.2): só conta a célula iluminada ou dentro da visão no escuro (em células). */
  escuro?: { visao: number; luzes: LuzCelulas[] }): string[] {
  const out: string[] = []
  const r = Math.min(raio, SEM_LIMITE_CELULAS)
  // Só as paredes que podem estar no caminho (dentro do quadrado do alcance).
  const perto = segs.filter(s => Math.max(s[0], s[2]) >= ox - r - 1 && Math.min(s[0], s[2]) <= ox + r + 1 && Math.max(s[1], s[3]) >= oy - r - 1 && Math.min(s[1], s[3]) <= oy + r + 1)
  const pts: [number, number][] = [[0.5, 0.5], [0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]]
  for (let y = Math.max(0, Math.floor(oy - r)); y <= Math.min(rows - 1, Math.floor(oy + r)); y++)
    for (let x = Math.max(0, Math.floor(ox - r)); x <= Math.min(cols - 1, Math.floor(ox + r)); x++) {
      if ((x + 0.5 - ox) ** 2 + (y + 0.5 - oy) ** 2 > r * r) continue
      if (!pts.some(([dx, dy]) => temLinhaDeVisao(ox, oy, x + dx, y + dy, perto))) continue
      if (escuro && (x + 0.5 - ox) ** 2 + (y + 0.5 - oy) ** 2 > escuro.visao * escuro.visao && !iluminado(x + 0.5, y + 0.5, escuro.luzes, segs)) continue
      out.push(`${x},${y}`)
    }
  return out
}

/** Junta células reveladas à névoa salva (formato compacto da cena). */
export function revelarNaNevoa(atual: string[] | null | undefined, celulas: string[], cols: number, rows: number): { nevoa: string[]; mudou: boolean } {
  const s = expandirNevoa(atual ?? [])
  const antes = s.size
  for (const c of celulas) s.add(c)
  return { nevoa: s.size === antes ? (atual ?? []) : compactarNevoa(s, cols, rows), mudou: s.size !== antes }
}

/**
 * Polígono do que se vê a partir de um ponto (até as paredes e a borda do mapa), para desenhar a luz e a visão.
 * Raios para cada ponta de parede (e um pouco para cada lado), ordenados pelo ângulo.
 */
export function poligonoVisao(ox: number, oy: number, segs: Segmento[], cols: number, rows: number): [number, number][] {
  // Tira o ponto de cima de quinas exatas (token grande tem o centro num canto da grade).
  ox += 0.0013; oy += 0.0011
  const bordas: Segmento[] = [[0, 0, cols, 0], [cols, 0, cols, rows], [cols, rows, 0, rows], [0, rows, 0, 0]]
  const todos = [...segs, ...bordas]
  const angulos: number[] = []
  for (const s of todos) for (const [px, py] of [[s[0], s[1]], [s[2], s[3]]]) {
    const a = Math.atan2(py - oy, px - ox)
    angulos.push(a - 1e-4, a, a + 1e-4)
  }
  const pontos: { a: number; x: number; y: number }[] = []
  for (const a of angulos) {
    const dx = Math.cos(a), dy = Math.sin(a)
    let melhor = Infinity
    for (const s of todos) {
      const ex = s[2] - s[0], ey = s[3] - s[1]
      const den = dx * ey - dy * ex
      if (Math.abs(den) < 1e-12) continue
      const qx = s[0] - ox, qy = s[1] - oy
      const t = (qx * ey - qy * ex) / den, u = (qx * dy - qy * dx) / den
      if (t >= 0 && u >= -1e-9 && u <= 1 + 1e-9 && t < melhor) melhor = t
    }
    if (melhor < Infinity) pontos.push({ a, x: ox + dx * melhor, y: oy + dy * melhor })
  }
  pontos.sort((p, q) => p.a - q.a)
  return pontos.map(p => [p.x, p.y])
}

/** O ponto está dentro do polígono? (para ver se um token está à vista) */
export function dentroDoPoligono(px: number, py: number, pol: [number, number][]): boolean {
  let dentro = false
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [xi, yi] = pol[i], [xj, yj] = pol[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro
  }
  return dentro
}
