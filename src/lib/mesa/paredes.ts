/**
 * Paredes, portas e janelas do mapa (v0.34.10). Cada uma é um segmento em coordenadas de célula
 * (0 a cols / 0 a rows). Desde a v0.35.4 a ponta pode ficar em qualquer lugar (centésimos de célula), não só nos cantos
 * da grade, e uma forma (retângulo, círculo, triângulo, traço à mão) vira vários segmentos com o mesmo `grupo`.
 * Parede e janela sempre bloqueiam a passagem; porta bloqueia só fechada. Janela deixa passar luz e visão.
 * A mesma conta roda no navegador e no servidor.
 */
export type TipoParede = 'parede' | 'porta' | 'janela'
export type Parede = { id: string; x1: number; y1: number; x2: number; y2: number; tipo: TipoParede; aberta?: boolean; trancada?: boolean
  /** Segmentos da mesma forma: apagam juntos e, se forem porta, abrem e fecham juntos. */
  grupo?: string }
export const TIPOS_PAREDE: { id: TipoParede; nome: string; icone: string; dica: string }[] = [
  { id: 'parede', nome: 'Parede', icone: '🧱', dica: 'Ninguém passa e a luz não atravessa (os jogadores não veem a linha)' },
  { id: 'porta', nome: 'Porta', icone: '🚪', dica: 'Abre e fecha com um toque; o mestre pode trancar' },
  { id: 'janela', nome: 'Janela', icone: '🪟', dica: 'Ninguém passa, mas a luz e a visão atravessam' },
]
export type FormaParede = 'linha' | 'livre' | 'retangulo' | 'circulo' | 'triangulo'
export const FORMAS_PAREDE: { id: FormaParede; nome: string; icone: string; dica: string }[] = [
  { id: 'linha', nome: 'Linha', icone: '╱', dica: 'Arraste de uma ponta à outra' },
  { id: 'livre', nome: 'À mão livre', icone: '〰', dica: 'Desenhe com o dedo seguindo o mapa' },
  { id: 'retangulo', nome: 'Retângulo', icone: '▭', dica: 'Arraste de um canto ao outro' },
  { id: 'circulo', nome: 'Círculo', icone: '◯', dica: 'Arraste do centro para fora' },
  { id: 'triangulo', nome: 'Triângulo', icone: '△', dica: 'Arraste de um canto ao outro' },
]
export const MAX_PAREDES = 1000
/** Segmentos por pedido (uma forma grande, como um círculo, vira vários). */
export const MAX_PAREDES_PEDIDO = 80

/** Coordenada em células, arredondada ao centésimo; null se não for número ou sair do mapa. */
const coord = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v * 100) / 100 : null

/** Limpa uma parede vinda do navegador. null = inválida (fora do mapa, sem comprimento). */
export function normalizarParede(v: unknown, cols: number, rows: number): Parede | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const x1 = coord(o.x1, cols), y1 = coord(o.y1, rows), x2 = coord(o.x2, cols), y2 = coord(o.y2, rows)
  if (x1 === null || y1 === null || x2 === null || y2 === null || Math.hypot(x2 - x1, y2 - y1) < 0.05) return null
  const tipo = TIPOS_PAREDE.some(t => t.id === o.tipo) ? o.tipo as TipoParede : 'parede'
  const idOk = (v: unknown) => typeof v === 'string' && /^[a-zA-Z0-9-]{8,40}$/.test(v)
  const id = idOk(o.id) ? o.id as string : crypto.randomUUID()
  return { id, x1, y1, x2, y2, tipo, ...(idOk(o.grupo) ? { grupo: o.grupo as string } : {}), ...(tipo === 'porta' ? { aberta: o.aberta === true, trancada: o.trancada === true } : {}) }
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
 * O trajeto em linha reta de A até B atravessa alguma parede, janela ou porta fechada? (v0.35.4)
 * Encostar na ponta de uma parede não bloqueia; passar pelo ponto onde duas paredes se encontram, com uma de cada lado, bloqueia.
 */
export function atravessaParede(paredes: Parede[], ax: number, ay: number, bx: number, by: number): boolean {
  if (ax === bx && ay === by) return false
  const lado = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => { const v = (qx - px) * (ry - py) - (qy - py) * (rx - px); return Math.abs(v) < 1e-9 ? 0 : v > 0 ? 1 : -1 }
  const entre = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => Math.min(px, qx) - 1e-9 <= rx && rx <= Math.max(px, qx) + 1e-9 && Math.min(py, qy) - 1e-9 <= ry && ry <= Math.max(py, qy) + 1e-9
  const mesmo = (px: number, py: number, qx: number, qy: number) => Math.abs(px - qx) < 1e-9 && Math.abs(py - qy) < 1e-9
  // Pontas de parede que ficam no caminho: guarda de que lado do caminho vai cada parede.
  const toques = new Map<string, Set<number>>()
  for (const w of paredes) {
    if (!bloqueia(w)) continue
    const o1 = lado(ax, ay, bx, by, w.x1, w.y1), o2 = lado(ax, ay, bx, by, w.x2, w.y2)
    if (o1 === 0 && o2 === 0) continue // anda rente à parede, sem atravessar
    const o3 = lado(w.x1, w.y1, w.x2, w.y2, ax, ay), o4 = lado(w.x1, w.y1, w.x2, w.y2, bx, by)
    if (o1 * o2 < 0 && o3 * o4 < 0) return true // cruza no meio
    // Parar em cima da parede (vindo de um lado dela) também não pode.
    if (o4 === 0 && o3 !== 0 && entre(w.x1, w.y1, w.x2, w.y2, bx, by) && !mesmo(bx, by, w.x1, w.y1) && !mesmo(bx, by, w.x2, w.y2)) return true
    for (const [o, px, py, outro] of [[o1, w.x1, w.y1, o2], [o2, w.x2, w.y2, o1]] as const) {
      if (o !== 0 || !entre(ax, ay, bx, by, px, py) || mesmo(px, py, ax, ay) || mesmo(px, py, bx, by)) continue
      const k = px.toFixed(3) + ',' + py.toFixed(3)
      toques.set(k, (toques.get(k) ?? new Set()).add(outro))
    }
  }
  for (const lados of toques.values()) if (lados.has(1) && lados.has(-1)) return true
  return false
}

/**
 * Dá para levar o token (canto de cima à esquerda, tamanho k×k) de A até B sem atravessar parede? (v0.35.4)
 * O token vai em linha reta, como no tabuleiro: para contornar uma parede, mova em etapas.
 * Token maior que uma célula também confere as quinas (não passa por porta estreita).
 */
export function caminhoLivre(paredes: Parede[], cols: number, rows: number, de: { x: number; y: number }, para: { x: number; y: number }, tamanho = 1): boolean {
  if (de.x === para.x && de.y === para.y) return true
  if (!paredes.some(bloqueia)) return true
  void cols; void rows
  const k = Math.max(1, Math.floor(tamanho)), m = k / 2
  const pontos: [number, number][] = [[m, m], ...(k > 1 ? [[0.1, 0.1], [k - 0.1, 0.1], [0.1, k - 0.1], [k - 0.1, k - 0.1]] as [number, number][] : [])]
  return !pontos.some(([dx, dy]) => atravessaParede(paredes, de.x + dx, de.y + dy, para.x + dx, para.y + dy))
}

/** Uma forma desenhada vira segmentos (em células). `a` = onde começou, `b` = onde soltou; `pontos` = traço à mão livre. */
export function segmentosDaForma(forma: FormaParede, a: { x: number; y: number }, b: { x: number; y: number }, pontos: [number, number][] = []): [number, number, number, number][] {
  const seg = (l: [number, number][], fechar: boolean) => l.slice(0, fechar ? l.length : -1).map((p, i) => { const q = l[(i + 1) % l.length]; return [p[0], p[1], q[0], q[1]] as [number, number, number, number] })
  if (forma === 'linha') return [[a.x, a.y, b.x, b.y]]
  if (forma === 'retangulo') return seg([[a.x, a.y], [b.x, a.y], [b.x, b.y], [a.x, b.y]], true)
  if (forma === 'triangulo') return seg([[(a.x + b.x) / 2, Math.min(a.y, b.y)], [Math.max(a.x, b.x), Math.max(a.y, b.y)], [Math.min(a.x, b.x), Math.max(a.y, b.y)]], true)
  if (forma === 'circulo') {
    const r = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(12, Math.min(32, Math.round(r * 6)))
    return seg(Array.from({ length: n }, (_, i) => [a.x + r * Math.cos(2 * Math.PI * i / n), a.y + r * Math.sin(2 * Math.PI * i / n)] as [number, number]), true)
  }
  // À mão livre: simplifica o traço (menos pontas, mesma forma) até caber no limite de um pedido.
  let eps = 0.15, l = simplificar(pontos, eps)
  while (l.length - 1 > MAX_PAREDES_PEDIDO && eps < 5) { eps *= 1.6; l = simplificar(pontos, eps) }
  return seg(l, false)
}
/** Ramer–Douglas–Peucker: tira pontos que quase não mudam o desenho. */
function simplificar(l: [number, number][], eps: number): [number, number][] {
  if (l.length < 3) return l
  const [ax, ay] = l[0], [bx, by] = l[l.length - 1], L = Math.hypot(bx - ax, by - ay)
  let maior = 0, iM = 0
  for (let i = 1; i < l.length - 1; i++) {
    const d = L ? Math.abs((bx - ax) * (ay - l[i][1]) - (ax - l[i][0]) * (by - ay)) / L : Math.hypot(l[i][0] - ax, l[i][1] - ay)
    if (d > maior) { maior = d; iM = i }
  }
  if (maior <= eps) return [l[0], l[l.length - 1]]
  return [...simplificar(l.slice(0, iM + 1), eps).slice(0, -1), ...simplificar(l.slice(iM), eps)]
}

/** Distância de um ponto (em células) até a parede; para tocar e apagar. */
export function distanciaParede(p: Parede, px: number, py: number): number {
  const dx = p.x2 - p.x1, dy = p.y2 - p.y1, L = dx * dx + dy * dy
  const t = L ? Math.max(0, Math.min(1, ((px - p.x1) * dx + (py - p.y1) * dy) / L)) : 0
  return Math.hypot(px - (p.x1 + t * dx), py - (p.y1 + t * dy))
}
