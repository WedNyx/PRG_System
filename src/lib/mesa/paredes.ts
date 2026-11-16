/**
 * Paredes, portas e janelas do mapa (v0.34.10). Cada uma é um segmento entre cantos da grade
 * (coordenadas inteiras de 0 a cols / 0 a rows). Parede e janela sempre bloqueiam a passagem;
 * porta bloqueia só fechada. A mesma conta roda no navegador e no servidor.
 */
export type TipoParede = 'parede' | 'porta' | 'janela'
export type Parede = { id: string; x1: number; y1: number; x2: number; y2: number; tipo: TipoParede; aberta?: boolean; trancada?: boolean }
export const TIPOS_PAREDE: { id: TipoParede; nome: string; icone: string; dica: string }[] = [
  { id: 'parede', nome: 'Parede', icone: '🧱', dica: 'Ninguém passa (os jogadores não veem a linha)' },
  { id: 'porta', nome: 'Porta', icone: '🚪', dica: 'Abre e fecha com um toque; o mestre pode trancar' },
  { id: 'janela', nome: 'Janela', icone: '🪟', dica: 'Não dá para passar (na próxima parte, vai deixar ver)' },
]
export const MAX_PAREDES = 400

const inteiro = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : null

/** Limpa uma parede vinda do navegador. null = inválida (fora do mapa, sem comprimento). */
export function normalizarParede(v: unknown, cols: number, rows: number): Parede | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const x1 = inteiro(o.x1, 0, cols), y1 = inteiro(o.y1, 0, rows), x2 = inteiro(o.x2, 0, cols), y2 = inteiro(o.y2, 0, rows)
  if (x1 === null || y1 === null || x2 === null || y2 === null || (x1 === x2 && y1 === y2)) return null
  const tipo = TIPOS_PAREDE.some(t => t.id === o.tipo) ? o.tipo as TipoParede : 'parede'
  const id = typeof o.id === 'string' && /^[a-zA-Z0-9-]{8,40}$/.test(o.id) ? o.id : crypto.randomUUID()
  return { id, x1, y1, x2, y2, tipo, ...(tipo === 'porta' ? { aberta: o.aberta === true, trancada: o.trancada === true } : {}) }
}
export function lerParedes(v: unknown, cols: number, rows: number): Parede[] {
  return Array.isArray(v) ? v.slice(0, MAX_PAREDES).flatMap(x => { const p = normalizarParede(x, cols, rows); return p ? [p] : [] }) : []
}

export const bloqueia = (p: Parede) => p.tipo !== 'porta' || !p.aberta

/** Os segmentos AB e CD se cruzam (ou se tocam)? */
export function cruzam(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
  const o = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => { const v = (qx - px) * (ry - py) - (qy - py) * (rx - px); return Math.abs(v) < 1e-9 ? 0 : v > 0 ? 1 : -1 }
  const dentro = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => Math.min(px, rx) - 1e-9 <= qx && qx <= Math.max(px, rx) + 1e-9 && Math.min(py, ry) - 1e-9 <= qy && qy <= Math.max(py, ry) + 1e-9
  const o1 = o(ax, ay, bx, by, cx, cy), o2 = o(ax, ay, bx, by, dx, dy), o3 = o(cx, cy, dx, dy, ax, ay), o4 = o(cx, cy, dx, dy, bx, by)
  if (o1 !== o2 && o3 !== o4) return true
  return (o1 === 0 && dentro(ax, ay, cx, cy, bx, by)) || (o2 === 0 && dentro(ax, ay, dx, dy, bx, by)) || (o3 === 0 && dentro(cx, cy, ax, ay, dx, dy)) || (o4 === 0 && dentro(cx, cy, bx, by, dx, dy))
}

/**
 * Passos bloqueados entre células vizinhas: 'h:x,y' = entre (x,y) e (x+1,y); 'v:x,y' = entre (x,y) e (x,y+1).
 * Um passo é bloqueado quando a linha entre os centros das duas células cruza uma parede fechada.
 */
export function passosBloqueados(paredes: Parede[], cols: number, rows: number): Set<string> {
  const out = new Set<string>()
  for (const p of paredes) {
    if (!bloqueia(p)) continue
    const x0 = Math.max(0, Math.min(p.x1, p.x2) - 1), x1 = Math.min(cols - 1, Math.max(p.x1, p.x2))
    const y0 = Math.max(0, Math.min(p.y1, p.y2) - 1), y1 = Math.min(rows - 1, Math.max(p.y1, p.y2))
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (x + 1 < cols && cruzam(x + 0.5, y + 0.5, x + 1.5, y + 0.5, p.x1, p.y1, p.x2, p.y2)) out.add(`h:${x},${y}`)
      if (y + 1 < rows && cruzam(x + 0.5, y + 0.5, x + 0.5, y + 1.5, p.x1, p.y1, p.x2, p.y2)) out.add(`v:${x},${y}`)
    }
  }
  return out
}

/**
 * Dá para levar o token (canto de cima à esquerda, tamanho k×k) de A até B sem atravessar parede?
 * Anda célula por célula (para os lados, não na diagonal), então não passa pela quina de duas paredes.
 */
export function caminhoLivre(paredes: Parede[], cols: number, rows: number, de: { x: number; y: number }, para: { x: number; y: number }, tamanho = 1): boolean {
  if (de.x === para.x && de.y === para.y) return true
  if (!paredes.some(bloqueia)) return true
  const k = Math.max(1, Math.floor(tamanho)), W = cols - k + 1, H = rows - k + 1
  if (W <= 0 || H <= 0) return true
  const bl = passosBloqueados(paredes, cols, rows)
  const cx = (n: number, max: number) => Math.max(0, Math.min(max - 1, n))
  const ini = { x: cx(de.x, W), y: cx(de.y, H) }, fim = { x: cx(para.x, W), y: cx(para.y, H) }
  const visto = new Uint8Array(W * H), fila: number[] = [ini.y * W + ini.x]
  visto[fila[0]] = 1
  const livre = (x: number, y: number, dx: number, dy: number) => {
    for (let i = 0; i < k; i++) {
      if (dx === 1 && bl.has(`h:${x + k - 1},${y + i}`)) return false
      if (dx === -1 && bl.has(`h:${x - 1},${y + i}`)) return false
      if (dy === 1 && bl.has(`v:${x + i},${y + k - 1}`)) return false
      if (dy === -1 && bl.has(`v:${x + i},${y - 1}`)) return false
    }
    return true
  }
  for (let i = 0; i < fila.length; i++) {
    const x = fila[i] % W, y = Math.floor(fila[i] / W)
    if (x === fim.x && y === fim.y) return true
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || visto[ny * W + nx] || !livre(x, y, dx, dy)) continue
      visto[ny * W + nx] = 1; fila.push(ny * W + nx)
    }
  }
  return false
}

/** Distância de um ponto (em células) até a parede; para tocar e apagar. */
export function distanciaParede(p: Parede, px: number, py: number): number {
  const dx = p.x2 - p.x1, dy = p.y2 - p.y1, L = dx * dx + dy * dy
  const t = L ? Math.max(0, Math.min(1, ((px - p.x1) * dx + (py - p.y1) * dy) / L)) : 0
  return Math.hypot(px - (p.x1 + t * dx), py - (p.y1 + t * dy))
}
