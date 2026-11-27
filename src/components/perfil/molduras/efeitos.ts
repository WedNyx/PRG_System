/**
 * Molduras de perfil v0.37.2 — os efeitos vivos (canvas e SVG animado) que entram só na moldura grande:
 * fogo de verdade, neve, luar e névoa, nebulosa e cometa, vagalumes, mar, raios de neon, fumaça do ritual,
 * brilho do ouro, raios de luz da coroa e a luz do livro do Criador.
 * Cada efeito devolve uma função para parar tudo (a moldura liga quando aparece na tela e desliga quando sai).
 * Só roda no navegador; quem chama já conferiu “movimento reduzido” e “efeitos leves”.
 */
import { f, pol, semente } from './arte'

type Ctx = CanvasRenderingContext2D
type Desenho = (g: Ctx, t: number, dt: number, P: (x: number, y: number) => [number, number], k: number) => void
type Sessao = { palco: HTMLElement; tam: number; avatar: number; svg: SVGSVGElement; paradas: (() => void)[] }

const TAU = Math.PI * 2
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

const SPRITES: Record<string, HTMLCanvasElement> = {}
function brilho(cor: string, tam = 64, duro = .35) {
  const chave = cor + '|' + tam + '|' + duro
  if (SPRITES[chave]) return SPRITES[chave]
  const c = document.createElement('canvas'); c.width = c.height = tam
  const g = c.getContext('2d')!, gr = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2)
  gr.addColorStop(0, `rgba(${cor},1)`); gr.addColorStop(duro, `rgba(${cor},.5)`); gr.addColorStop(1, `rgba(${cor},0)`)
  g.fillStyle = gr; g.fillRect(0, 0, tam, tam)
  return (SPRITES[chave] = c)
}
const coresFogo = () => ['255,250,225', '255,214,102', '255,140,30', '235,70,20', '150,25,10'].map(c => brilho(c))

/** Laço de quadros que para junto com a sessão (e não desenha com a aba escondida). */
function laco(s: Sessao, fn: (t: number, dt: number) => void) {
  let vivo = true, t0 = performance.now(), t = 0, id = 0
  const q = (agora: number) => {
    if (!vivo) return
    const dt = Math.max(0, Math.min(.05, (agora - t0) / 1000)); t0 = agora
    if (!document.hidden) { t += dt; fn(t, dt) }
    id = requestAnimationFrame(q)
  }
  id = requestAnimationFrame(q)
  s.paradas.push(() => { vivo = false; cancelAnimationFrame(id) })
}
/** Uma camada de canvas no palco: atrás da foto (frente=false) ou por cima da moldura. */
function camada(s: Sessao, frente: boolean, desenhar: Desenho) {
  const cv = document.createElement('canvas')
  cv.style.cssText = `position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:${frente ? 3 : 0}`
  s.palco.append(cv)
  const dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(s.tam * dpr); cv.height = Math.round(s.tam * dpr)
  const g = cv.getContext('2d')!; g.scale(dpr, dpr)
  const k = s.avatar / 100, P = (x: number, y: number): [number, number] => [s.tam / 2 + (x - 68) * k, s.tam / 2 + (y - 68) * k]
  laco(s, (t, dt) => {
    g.clearRect(0, 0, s.tam, s.tam); desenhar(g, t, dt, P, k)
    // Atrás da foto: nada aparece por dentro dela (fotos e letras com fundo transparente continuam limpas).
    if (!frente) { g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 1; g.beginPath(); g.arc(s.tam / 2, s.tam / 2, s.avatar / 2 - .5, 0, TAU); g.fill(); g.restore() }
  })
  s.paradas.push(() => cv.remove())
}
function estrela4(g: Ctx, x: number, y: number, r: number, cor: string, a = 1) {
  g.save(); g.globalAlpha = a; g.globalCompositeOperation = 'lighter'
  g.drawImage(brilho(cor, 32, .2), x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2)
  g.strokeStyle = `rgba(${cor},${a})`; g.lineWidth = Math.max(.6, r * .18)
  g.beginPath(); g.moveTo(x - r * 2.6, y); g.lineTo(x + r * 2.6, y); g.moveTo(x, y - r * 2.6); g.lineTo(x, y + r * 2.6); g.stroke()
  g.restore()
}

/* ---------------- Fogo: partículas de luz que nascem no anel, sobem e esfriam ---------------- */
function fogo(s: Sessao) {
  const CORES = coresFogo(), FAISCA = brilho('255,230,150', 16)
  const R = s.avatar / 2, k = s.avatar / 132, cx = s.tam / 2, cy = s.tam / 2
  type Part = { x: number; y: number; vx: number; vy: number; vida: number; max: number; tam: number; sem: number }
  const parts: Part[] = [], faiscas: Omit<Part, 'tam' | 'sem'>[] = []
  camada(s, false, (g, t, dt) => {
    const halo = g.createRadialGradient(cx, cy, R * .9, cx, cy, R * 1.55)
    halo.addColorStop(0, 'rgba(255,120,30,.45)'); halo.addColorStop(1, 'rgba(255,60,0,0)')
    g.fillStyle = halo; g.beginPath(); g.arc(cx, cy, R * 1.55, 0, TAU); g.fill()
    for (let i = 0, n = Math.round(16 * k * k + 4); i < n; i++) {
      const a = Math.random() * TAU, r = R + rnd(-2, 3) * k, nx = Math.cos(a), ny = Math.sin(a)
      parts.push({ x: cx + nx * r, y: cy + ny * r, vx: nx * rnd(.15, .55) * k, vy: (ny * rnd(.1, .4) - rnd(.55, 1.25)) * k, vida: 0, max: rnd(.45, 1), tam: rnd(10, 17) * k, sem: Math.random() * 100 })
    }
    if (Math.random() < .25) { const a = Math.random() * TAU; faiscas.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, vx: rnd(-.6, .6) * k, vy: rnd(-2.2, -1) * k, vida: 0, max: rnd(1, 2) }) }
    g.globalCompositeOperation = 'lighter'
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.vida += dt; const u = p.vida / p.max
      if (u >= 1) { parts.splice(i, 1); continue }
      p.vx += Math.sin(t * 5.5 + p.sem) * .02 * k; p.vy -= .015 * k; p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt
      const z = p.tam * (1 - u * .75)
      g.globalAlpha = u < .1 ? u * 10 : 1 - u * .85; g.drawImage(CORES[Math.min(4, Math.floor(u * 5))], p.x - z, p.y - z, z * 2, z * 2)
    }
    for (let i = faiscas.length - 1; i >= 0; i--) {
      const p = faiscas[i]; p.vida += dt; const u = p.vida / p.max
      if (u >= 1) { faiscas.splice(i, 1); continue }
      p.vx += Math.sin(t * 8 + i) * .03; p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt
      g.globalAlpha = 1 - u; const z = 3 * k; g.drawImage(FAISCA, p.x - z, p.y - z, z * 2, z * 2)
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  })
}

/* ---------------- Neve caindo em volta do gelo ---------------- */
function neve(s: Sessao) {
  const k = s.avatar / 132, R = s.avatar / 2, c = s.tam / 2
  const flocos = Array.from({ length: Math.round(46 * k) + 6 }, () => ({ x: rnd(0, s.tam), y: rnd(0, s.tam), r: rnd(.6, 2.2) * Math.max(.6, k), v: rnd(.2, .6), f: rnd(0, 6) }))
  camada(s, true, (g, t, dt) => {
    g.fillStyle = '#fff'; g.globalAlpha = .85
    for (const p of flocos) {
      p.y += p.v * 60 * dt; p.x += Math.sin(t * 1.1 + p.f) * .25
      if (p.y > s.tam + 4) { p.y = -4; p.x = rnd(0, s.tam) }
      if (Math.hypot(p.x - c, p.y - c) < R - 2) continue
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill()
    }
    g.globalAlpha = 1
  })
}

/* ---------------- Luz passeando pelo metal (ouro, prata) ---------------- */
function luzMovel(s: Sessao) {
  const ls = s.svg.querySelectorAll('.luz-movel')
  if (ls.length) laco(s, t => ls.forEach(l => { l.setAttribute('x', String(f(68 + 70 * Math.cos(t * .7)))); l.setAttribute('y', String(f(68 + 70 * Math.sin(t * .7)))) }))
}

/* ---------------- Lua: luar, névoa e estrelas ---------------- */
function lua(s: Sessao) {
  const r = semente(5)
  const estrelas = Array.from({ length: 26 }, () => { const a = r() * TAU, d = 56 + r() * 14; return { x: 68 + d * Math.cos(a), y: 68 + d * Math.sin(a), s: .5 + r() * 1.4, f: r() * 6 } })
  const nevoa = Array.from({ length: 7 }, (_, i) => ({ a: i * TAU / 7, d: 58 + r() * 6, s: 16 + r() * 10 }))
  camada(s, false, (g, t, dt, P, k) => {
    for (const n of nevoa) { const a = n.a + t * .05, [x, y] = P(68 + n.d * Math.cos(a), 68 + n.d * Math.sin(a)); g.globalAlpha = .13; g.drawImage(brilho('210,200,255', 64, .1), x - n.s * k, y - n.s * k, n.s * 2 * k, n.s * 2 * k) }
    const [mx, my] = P(102, 21)
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55 + .1 * Math.sin(t * 1.3)
    g.drawImage(brilho('255,246,214', 64, .15), mx - 34 * k, my - 34 * k, 68 * k, 68 * k)
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
    for (const e of estrelas) { const [x, y] = P(e.x, e.y); estrela4(g, x, y, e.s * k, '255,250,235', .25 + .75 * Math.max(0, Math.sin(t * 1.6 + e.f))) }
  })
}

/* ---------------- Constelação: nebulosa, poeira de estrelas e cometa ---------------- */
function constelacao(s: Sessao) {
  const r = semente(9), ps = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => pol(i % 2 ? 58 : 63, 12 + i * 40))
  const nebulosa = Array.from({ length: 9 }, (_, i) => ({ a: i * TAU / 9 + r(), d: 60 + r() * 6, s: 22 + r() * 14, c: ['168,85,247', '59,130,246', '236,72,153'][i % 3] }))
  const poeira = Array.from({ length: 60 }, () => { const a = r() * TAU, d = 52 + r() * 20; return { x: 68 + d * Math.cos(a), y: 68 + d * Math.sin(a), s: .3 + r() * .8, f: r() * 6 } })
  const rastro: [number, number][] = []
  camada(s, false, (g, t, dt, P, k) => {
    g.globalCompositeOperation = 'lighter'
    for (const n of nebulosa) { const a = n.a + t * .04, [x, y] = P(68 + n.d * Math.cos(a), 68 + n.d * Math.sin(a)); g.globalAlpha = .22; g.drawImage(brilho(n.c, 64, .05), x - n.s * k, y - n.s * k, n.s * 2 * k, n.s * 2 * k) }
    for (const p of poeira) { const [x, y] = P(p.x, p.y); g.globalAlpha = .3 + .7 * Math.max(0, Math.sin(t * 2 + p.f)); g.drawImage(brilho('220,225,255', 16, .3), x - p.s * 2 * k, y - p.s * 2 * k, p.s * 4 * k, p.s * 4 * k) }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  })
  camada(s, true, (g, t, dt, P, k) => {
    ps.forEach(([sx, sy], i) => { const [x, y] = P(sx, sy); estrela4(g, x, y, (i % 3 ? 1.5 : 2.4) * k, '235,240,255', .55 + .45 * Math.sin(t * 2 + i)) })
    const a = t * .9, [cx, cy] = P(68 + 67 * Math.cos(a), 68 + 67 * Math.sin(a))
    rastro.push([cx, cy]); if (rastro.length > 40) rastro.shift()
    g.globalCompositeOperation = 'lighter'
    rastro.forEach(([x, y], i) => { const q = i / rastro.length, z = (1 + q * 3) * k; g.globalAlpha = q * .7; g.drawImage(brilho('180,200,255', 32, .25), x - z * 2, y - z * 2, z * 4, z * 4) })
    g.globalAlpha = 1; g.drawImage(brilho('255,255,255', 32, .3), cx - 5 * k, cy - 5 * k, 10 * k, 10 * k); g.globalCompositeOperation = 'source-over'
  })
}

/* ---------------- Floresta: vagalumes e folhas caindo ---------------- */
function floresta(s: Sessao) {
  const r = semente(8), vaga = Array.from({ length: 14 }, () => ({ a: r() * TAU, d: 58 + r() * 14, f: r() * 6, v: .2 + r() * .3 }))
  const caindo: { x: number; y: number; rot: number; vr: number; c: string; vida: number }[] = []
  camada(s, true, (g, t, dt, P, k) => {
    g.globalCompositeOperation = 'lighter'
    for (const v of vaga) {
      v.a += v.v * dt * .3
      const d = v.d + 3 * Math.sin(t * 1.3 + v.f), [x, y] = P(68 + d * Math.cos(v.a), 68 + d * Math.sin(v.a) + 2 * Math.sin(t * 2 + v.f)), a = Math.max(0, Math.sin(t * 1.7 + v.f))
      g.globalAlpha = a; g.drawImage(brilho('217,249,157', 32, .18), x - 6 * k, y - 6 * k, 12 * k, 12 * k); g.drawImage(brilho('255,255,220', 16, .4), x - 1.6 * k, y - 1.6 * k, 3.2 * k, 3.2 * k)
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
    if (Math.random() < .015) { const a = r() * TAU; caindo.push({ x: 68 + 60 * Math.cos(a), y: 68 + 60 * Math.sin(a), rot: r() * 6, vr: (r() - .5) * 3, c: r() > .5 ? '#a3e635' : '#facc15', vida: 0 }) }
    for (let i = caindo.length - 1; i >= 0; i--) {
      const c = caindo[i]; c.vida += dt; c.y += 9 * dt; c.x += Math.sin(t * 2 + i) * 6 * dt; c.rot += c.vr * dt
      if (c.vida > 4) { caindo.splice(i, 1); continue }
      const [x, y] = P(c.x, c.y); g.save(); g.globalAlpha = Math.min(1, 4 - c.vida); g.translate(x, y); g.rotate(c.rot); g.fillStyle = c.c; g.beginPath(); g.ellipse(0, 0, 1.4 * k, 3 * k, 0, 0, TAU); g.fill(); g.restore()
    }
  })
}

/* ---------------- Pirata: o mar balançando embaixo ---------------- */
function mar(s: Sessao) {
  const gotas: { x: number; y: number; vx: number; vy: number; v: number }[] = []
  camada(s, false, (g, t, dt, P, k) => {
    const tam = s.tam, base = tam * .74
    g.save(); g.beginPath(); g.arc(tam / 2, tam / 2, tam * .47, 0, TAU); g.clip()
    const ondas: [string, number, number, number][] = [['#0c4a6e', .9, 0, 1], ['#0369a1', .85, 1.6, .8], ['#0ea5e9', .55, 3.1, .6]]
    ondas.forEach(([cor, a, fase, amp], i) => {
      const y = (x: number) => base + i * 7 * k + Math.sin(x / (18 * k) + t * (1.2 + i * .3) + fase) * 4 * k * amp
      g.globalAlpha = a; g.fillStyle = cor; g.beginPath(); g.moveTo(0, tam)
      for (let x = 0; x <= tam; x += 4) g.lineTo(x, y(x))
      g.lineTo(tam, tam); g.fill()
      g.globalAlpha = .7; g.strokeStyle = '#e0f2fe'; g.lineWidth = 1.2 * k; g.beginPath()
      for (let x = 0; x <= tam; x += 4) { if (x) g.lineTo(x, y(x)); else g.moveTo(x, y(x)) }
      g.stroke()
    })
    g.restore()
    if (Math.random() < .3) gotas.push({ x: Math.random() * tam, y: base, vx: (Math.random() - .5) * 20 * k, vy: -(20 + Math.random() * 30) * k, v: 0 })
    g.fillStyle = '#f0f9ff'
    for (let i = gotas.length - 1; i >= 0; i--) {
      const d = gotas[i]; d.v += dt; d.vy += 60 * k * dt; d.x += d.vx * dt; d.y += d.vy * dt
      if (d.v > 1.2) { gotas.splice(i, 1); continue }
      g.globalAlpha = 1 - d.v / 1.2; g.beginPath(); g.arc(d.x, d.y, .9 * k, 0, TAU); g.fill()
    }
    g.globalAlpha = 1
    void P
  })
}

/* ---------------- Neon: tubos piscando e girando, raios elétricos ---------------- */
function neon(s: Sessao) {
  const a = s.svg.querySelector<SVGGElement>('.tubo-a'), b = s.svg.querySelector<SVGGElement>('.tubo-b')
  laco(s, t => {
    const pisca = (x: number) => (Math.sin(t * 13 + x) > .985 || t % 7 < .12) ? '.25' : '1'
    if (a) { a.style.opacity = pisca(0); a.setAttribute('transform', `rotate(${f(t * 12)} 68 68)`) }
    if (b) { b.style.opacity = pisca(2); b.setAttribute('transform', `rotate(${f(-t * 20)} 68 68)`) }
  })
  const raios: { pts: [number, number][]; v: number; c: string }[] = []
  camada(s, true, (g, t, dt, P, k) => {
    if (Math.random() < .035) {
      const a0 = Math.random() * TAU, a1 = a0 + (Math.random() - .5) * 1.2, pts: [number, number][] = []
      for (let i = 0; i <= 10; i++) { const u = i / 10, an = a0 + (a1 - a0) * u, d = 57 + (Math.random() - .5) * 9 * Math.sin(u * Math.PI); pts.push(P(68 + d * Math.cos(an), 68 + d * Math.sin(an))) }
      raios.push({ pts, v: 0, c: Math.random() > .5 ? '103,232,249' : '244,114,182' })
    }
    g.globalCompositeOperation = 'lighter'
    for (let i = raios.length - 1; i >= 0; i--) {
      const r = raios[i]; r.v += dt
      if (r.v > .18) { raios.splice(i, 1); continue }
      for (const [lw, al] of [[4 * k, .25], [1.6 * k, .7], [.6 * k, 1]]) {
        g.strokeStyle = al === 1 ? '#fff' : `rgba(${r.c},${al})`; g.lineWidth = lw; g.beginPath()
        r.pts.forEach(([x, y], j) => { if (j) g.lineTo(x, y); else g.moveTo(x, y) }); g.stroke()
      }
    }
    g.globalCompositeOperation = 'source-over'
  })
}

/* ---------------- Ritual: círculo girando, runas acendendo, fumaça e cinzas ---------------- */
function ritual(s: Sessao) {
  const ext = s.svg.querySelector('.anel-ext'), int = s.svg.querySelector('.anel-int'), runas = [...s.svg.querySelectorAll<SVGPathElement>('.r1 path')]
  laco(s, t => {
    ext?.setAttribute('transform', `rotate(${f(t * 6)} 68 68)`); int?.setAttribute('transform', `rotate(${f(-t * 10)} 68 68)`)
    runas.forEach((r, i) => { r.style.opacity = String(.35 + .65 * Math.max(0, Math.sin(t * 2.2 - i * .4))) })
  })
  const fumaca = Array.from({ length: 16 }, (_, i) => ({ a: i * TAU / 16, d: 58 + Math.random() * 8, s: 14 + Math.random() * 10 }))
  const cinzas: { x: number; y: number; v: number; vx: number; vy: number }[] = []
  camada(s, false, (g, t, dt, P, k) => {
    for (const n of fumaca) { const a = n.a + t * .12, d = n.d + 3 * Math.sin(t + n.a * 3), [x, y] = P(68 + d * Math.cos(a), 68 + d * Math.sin(a)); g.globalAlpha = .28; g.drawImage(brilho('120,10,15', 64, .1), x - n.s * k, y - n.s * k, n.s * 2 * k, n.s * 2 * k) }
    g.globalAlpha = 1
    if (Math.random() < .5) { const a = Math.random() * TAU; cinzas.push({ x: 68 + 56 * Math.cos(a), y: 68 + 56 * Math.sin(a), v: 0, vx: (Math.random() - .5) * 4, vy: -6 - Math.random() * 8 }) }
    g.globalCompositeOperation = 'lighter'
    for (let i = cinzas.length - 1; i >= 0; i--) {
      const c = cinzas[i]; c.v += dt; c.x += c.vx * dt; c.y += c.vy * dt
      if (c.v > 2) { cinzas.splice(i, 1); continue }
      const [x, y] = P(c.x, c.y); g.globalAlpha = 1 - c.v / 2; g.drawImage(brilho('255,80,50', 16, .3), x - 2 * k, y - 2 * k, 4 * k, 4 * k)
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
  })
}

/* ---------------- Cintilar dourado (ouro e coroa) ---------------- */
function cintilar(s: Sessao, cor = '255,240,190', n = 16, raio: [number, number] = [54, 66]) {
  const r = semente(3), pts = Array.from({ length: n }, () => { const a = r() * TAU, d = raio[0] + r() * (raio[1] - raio[0]); return { x: 68 + d * Math.cos(a), y: 68 + d * Math.sin(a), f: r() * 6, s: .8 + r() * 1.4 } })
  camada(s, true, (g, t, dt, P, k) => { for (const p of pts) { const a = Math.pow(Math.max(0, Math.sin(t * 1.8 + p.f)), 6); if (a < .02) continue; const [x, y] = P(p.x, p.y); estrela4(g, x, y, p.s * k, cor, a) } })
}

/* ---------------- Coroa: raios de luz atrás ---------------- */
function raiosDeLuz(s: Sessao) {
  camada(s, false, (g, t, dt, P, k) => {
    const [cx, cy] = P(68, 8)
    g.save(); g.translate(cx, cy); g.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 12; i++) {
      g.rotate(TAU / 12 + (i === 0 ? t * .25 : 0))
      const gr = g.createLinearGradient(0, 0, 0, -48 * k)
      gr.addColorStop(0, `rgba(255,220,120,${.32 + .12 * Math.sin(t * 2 + i)})`); gr.addColorStop(1, 'rgba(255,220,120,0)')
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(-4 * k, -48 * k); g.lineTo(4 * k, -48 * k); g.closePath(); g.fill()
    }
    g.restore()
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.drawImage(brilho('255,214,120', 64, .1), cx - 30 * k, cy - 30 * k, 60 * k, 60 * k)
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
  })
}

/* ---------------- Criador: pena dando a volta, runas acendendo e luz subindo do livro ---------------- */
function criador(s: Sessao) {
  const pena = s.svg.querySelector('.pena'), luzP = s.svg.querySelector('.pagina-brilho'), runas = [...s.svg.querySelectorAll<SVGPathElement>('.runa-c')]
  laco(s, t => {
    const a = 200 + (t * 40) % 360, [x, y] = pol(62, a)
    pena?.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(a - 160)})`)
    luzP?.setAttribute('opacity', String(f(.2 + .2 * Math.sin(t * 2))))
    runas.forEach((r, i) => { r.style.opacity = String(.25 + .75 * Math.max(0, Math.sin(t * 1.6 - i * .3))) })
  })
  const motes: { x: number; y: number; v: number; vx: number; vy: number; c: string }[] = []
  camada(s, true, (g, t, dt, P, k) => {
    if (Math.random() < .35) motes.push({ x: 68 + (Math.random() - .5) * 36, y: 120, v: 0, vx: (Math.random() - .5) * 6, vy: -10 - Math.random() * 10, c: Math.random() > .3 ? '94,234,212' : '232,196,106' })
    g.globalCompositeOperation = 'lighter'
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i]; m.v += dt; m.x += (m.vx + Math.sin(t * 2 + i) * 4) * dt; m.y += m.vy * dt
      if (m.v > 2.6) { motes.splice(i, 1); continue }
      const [x, y] = P(m.x, m.y); g.globalAlpha = Math.sin(Math.PI * m.v / 2.6); g.drawImage(brilho(m.c, 16, .3), x - 2.4 * k, y - 2.4 * k, 4.8 * k, 4.8 * k)
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
  })
}

const EFEITOS: Record<string, (s: Sessao) => void> = {
  chamas: fogo, gelo: neve, lua: s => { luzMovel(s); lua(s) }, estrelas: constelacao, folhas: floresta, pirata: s => { luzMovel(s); mar(s) },
  neon, runas: ritual, ouro: s => { luzMovel(s); cintilar(s) }, mestre: s => { luzMovel(s); raiosDeLuz(s); cintilar(s, '255,240,190', 10, [52, 64]) },
  criador: s => { luzMovel(s); criador(s) },
}

/** Liga os efeitos vivos da moldura no `palco` (175% do tamanho da foto, centrado). Devolve a função que desliga. */
export function ligarEfeitos(moldura: string, palco: HTMLElement, avatar: number, svg: SVGSVGElement): () => void {
  const fx = EFEITOS[moldura]
  if (!fx) return () => {}
  const s: Sessao = { palco, tam: palco.offsetWidth || avatar * 1.75, avatar, svg, paradas: [] }
  try { fx(s) } catch { /* um efeito que falhar não pode quebrar a página */ }
  return () => { s.paradas.forEach(p => p()); s.paradas = [] }
}
export const temEfeitos = (moldura: string) => moldura in EFEITOS
