/**
 * Mesa de Som do Mestre (v0.36.5): efeitos e ambientes gerados na hora pelo navegador (WebAudio).
 * Nenhum arquivo de áudio de terceiros: não há licença a respeitar nem download pesado.
 * O mestre envia só comandos pelo canal da mesa ("toque a espada"); cada pessoa gera o som no próprio aparelho,
 * com o volume dela, e pode recusar os sons de susto.
 */

export type CategoriaSom = 'ambiente' | 'terror' | 'combate' | 'pessoas'
export type Efeito = { id: string; nome: string; icone: string; categoria: CategoriaSom; repentino?: boolean }
export type Ambiente = { id: string; nome: string; icone: string; descricao: string }
export type Camadas = Record<string, number>
export type Aleatorio = { efeito: string; min: number; max: number }
export type CenaSonora = { id: string; nome: string; icone: string; descricao: string; camadas: Camadas; aleatorios?: Aleatorio[] }

export const CATEGORIAS: { id: CategoriaSom; nome: string; icone: string }[] = [
  { id: 'ambiente', nome: 'Natureza', icone: '🌩️' },
  { id: 'terror', nome: 'Terror', icone: '🕯️' },
  { id: 'combate', nome: 'Combate', icone: '⚔️' },
  { id: 'pessoas', nome: 'Pessoas', icone: '🎭' },
]

export const EFEITOS: Efeito[] = [
  { id: 'trovao', nome: 'Trovão', icone: '🌩️', categoria: 'ambiente' },
  { id: 'rajada', nome: 'Rajada de vento', icone: '💨', categoria: 'ambiente' },
  { id: 'galho', nome: 'Galho quebrando', icone: '🪵', categoria: 'ambiente' },
  { id: 'batidas', nome: 'Batidas na porta', icone: '🚪', categoria: 'terror' },
  { id: 'passos', nome: 'Passos', icone: '👣', categoria: 'terror' },
  { id: 'rangido', nome: 'Porta rangendo', icone: '🪦', categoria: 'terror' },
  { id: 'coracao', nome: 'Coração batendo', icone: '🫀', categoria: 'terror' },
  { id: 'sussurro', nome: 'Sussurros', icone: '👻', categoria: 'terror' },
  { id: 'sino', nome: 'Sino fúnebre', icone: '🔔', categoria: 'terror' },
  { id: 'grito', nome: 'Grito', icone: '😱', categoria: 'terror', repentino: true },
  { id: 'espada', nome: 'Espadas', icone: '⚔️', categoria: 'combate' },
  { id: 'escudo', nome: 'Bloqueio no escudo', icone: '🛡️', categoria: 'combate' },
  { id: 'flecha', nome: 'Flecha', icone: '🏹', categoria: 'combate' },
  { id: 'impacto', nome: 'Golpe', icone: '👊', categoria: 'combate' },
  { id: 'magia', nome: 'Magia', icone: '✨', categoria: 'combate' },
  { id: 'cura', nome: 'Cura', icone: '💚', categoria: 'combate' },
  { id: 'explosao', nome: 'Explosão', icone: '💥', categoria: 'combate', repentino: true },
  { id: 'rugido', nome: 'Rugido', icone: '🐉', categoria: 'combate', repentino: true },
  { id: 'palmas', nome: 'Palmas', icone: '👏', categoria: 'pessoas' },
  { id: 'aplausos', nome: 'Aplausos', icone: '🙌', categoria: 'pessoas' },
  { id: 'risadas', nome: 'Risadas', icone: '😂', categoria: 'pessoas' },
  { id: 'assobio', nome: 'Assobio', icone: '😗', categoria: 'pessoas' },
  { id: 'moedas', nome: 'Moedas', icone: '🪙', categoria: 'pessoas' },
  { id: 'fanfarra', nome: 'Fanfarra', icone: '🎺', categoria: 'pessoas' },
]

export const AMBIENTES: Ambiente[] = [
  { id: 'vento', nome: 'Vento', icone: '🌬️', descricao: 'Vento constante, sobe e desce' },
  { id: 'chuva', nome: 'Chuva', icone: '🌧️', descricao: 'Chuva contínua' },
  { id: 'fogueira', nome: 'Fogueira', icone: '🔥', descricao: 'Fogo estalando' },
  { id: 'floresta', nome: 'Floresta', icone: '🌲', descricao: 'Brisa e pássaros' },
  { id: 'caverna', nome: 'Caverna', icone: '🕳️', descricao: 'Gotas com eco e um zumbido grave' },
  { id: 'mar', nome: 'Mar', icone: '🌊', descricao: 'Ondas indo e vindo' },
  { id: 'multidao', nome: 'Multidão', icone: '🍻', descricao: 'Burburinho de gente' },
  { id: 'masmorra', nome: 'Masmorra', icone: '⛓️', descricao: 'Tom grave e tenso' },
]

export const CENAS_PRONTAS: CenaSonora[] = [
  { id: 'taverna', nome: 'Taverna', icone: '🍺', descricao: 'Lareira, burburinho, risadas e moedas', camadas: { fogueira: 0.55, multidao: 0.5 }, aleatorios: [{ efeito: 'risadas', min: 25, max: 60 }, { efeito: 'moedas', min: 35, max: 80 }] },
  { id: 'tempestade', nome: 'Tempestade', icone: '⛈️', descricao: 'Chuva forte, vento e trovões', camadas: { chuva: 0.8, vento: 0.55 }, aleatorios: [{ efeito: 'trovao', min: 12, max: 35 }] },
  { id: 'masmorra', nome: 'Masmorra', icone: '🗝️', descricao: 'Caverna, tom grave e passos ao longe', camadas: { caverna: 0.6, masmorra: 0.45 }, aleatorios: [{ efeito: 'passos', min: 40, max: 90 }] },
  { id: 'floresta', nome: 'Floresta', icone: '🌳', descricao: 'Pássaros, brisa e galhos', camadas: { floresta: 0.7, vento: 0.2 }, aleatorios: [{ efeito: 'galho', min: 30, max: 75 }] },
  { id: 'porto', nome: 'Porto', icone: '⚓', descricao: 'Mar, vento e gente', camadas: { mar: 0.65, vento: 0.3, multidao: 0.25 } },
  { id: 'acampamento', nome: 'Acampamento', icone: '🏕️', descricao: 'Fogueira sob as árvores', camadas: { fogueira: 0.6, floresta: 0.35 } },
  { id: 'assombrado', nome: 'Lugar assombrado', icone: '🏚️', descricao: 'Vento, tom grave, sussurros e rangidos', camadas: { vento: 0.35, masmorra: 0.5 }, aleatorios: [{ efeito: 'sussurro', min: 30, max: 70 }, { efeito: 'rangido', min: 45, max: 100 }] },
]

const efeitoPorId = new Map(EFEITOS.map(e => [e.id, e]))
const ambientePorId = new Set(AMBIENTES.map(a => a.id))
export const ehEfeito = (id: unknown): id is string => typeof id === 'string' && efeitoPorId.has(id)
export const efeitoRepentino = (id: string) => efeitoPorId.get(id)?.repentino === true

/** Confere camadas que vieram pelo canal (ou do armazenamento): só ambientes conhecidos, nível 0–1. */
export function limparCamadas(v: unknown): Camadas {
  const r: Camadas = {}
  if (!v || typeof v !== 'object' || Array.isArray(v)) return r
  for (const [k, n] of Object.entries(v as Record<string, unknown>))
    if (ambientePorId.has(k) && typeof n === 'number' && Number.isFinite(n) && n > 0) r[k] = Math.min(1, Math.round(n * 100) / 100)
  return r
}
/** Confere uma cena salva pelo mestre. */
export function limparCena(v: unknown): CenaSonora | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.nome !== 'string') return null
  const camadas = limparCamadas(o.camadas)
  const aleatorios = Array.isArray(o.aleatorios) ? (o.aleatorios as Record<string, unknown>[]).filter(a => a && ehEfeito(a.efeito) && typeof a.min === 'number' && typeof a.max === 'number')
    .slice(0, 4).map(a => { const min = Math.max(5, Math.min(600, a.min as number)); return { efeito: a.efeito as string, min, max: Math.max(min, Math.min(900, a.max as number)) } }) : []
  return { id: o.id.slice(0, 40), nome: o.nome.slice(0, 40) || 'Cena', icone: typeof o.icone === 'string' ? o.icone.slice(0, 4) : '🎧', descricao: typeof o.descricao === 'string' ? o.descricao.slice(0, 80) : '', camadas, aleatorios }
}

// ---------------------------------------------------------------- motor de áudio

let ac: AudioContext | null = null
let saida: GainNode | null = null
let volumeLocal = 0.8
const ruidos: Partial<Record<'branco' | 'rosa' | 'marrom', AudioBuffer>> = {}
const camadasVivas = new Map<string, { ganho: GainNode; parar: () => void }>()

function contexto(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ac) {
    try { ac = new AudioContext(); saida = ac.createGain(); saida.gain.value = volumeLocal; saida.connect(ac.destination) } catch { return null }
  }
  return ac
}
/** Navegadores só liberam o som depois de um toque: chamar num clique/toque da pessoa. */
export function retomarSom() { const c = contexto(); if (c && c.state === 'suspended') void c.resume().catch(() => {}) }
export function somBloqueado() { return !!ac && ac.state === 'suspended' }
export function definirVolumeLocal(v: number) {
  volumeLocal = Math.min(1, Math.max(0, v))
  if (ac && saida) saida.gain.setTargetAtTime(volumeLocal, ac.currentTime, 0.1)
}

function ruido(c: AudioContext, tipo: 'branco' | 'rosa' | 'marrom'): AudioBuffer {
  const pronto = ruidos[tipo]; if (pronto && pronto.sampleRate === c.sampleRate) return pronto
  const n = c.sampleRate * 3, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, ult = 0
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1
    if (tipo === 'branco') d[i] = w
    else if (tipo === 'rosa') { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2 }
    else { ult = (ult + 0.02 * w) / 1.02; d[i] = ult * 3.5 }
  }
  ruidos[tipo] = b; return b
}
function fonte(c: AudioContext, tipo: 'branco' | 'rosa' | 'marrom', loop = false) {
  const s = c.createBufferSource(); s.buffer = ruido(c, tipo); s.loop = loop
  return s
}
function filtro(c: AudioContext, type: BiquadFilterType, freq: number, Q = 0.7) { const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = Q; return f }
function ganho(c: AudioContext, v = 1) { const g = c.createGain(); g.gain.value = v; return g }
/** Envelope: sobe até `pico` em `ataque` s e some até `t + dur`. */
function envelope(g: GainNode, t: number, ataque: number, pico: number, dur: number) {
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pico), t + Math.max(0.003, ataque))
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(ataque + 0.01, dur))
}
/** Rajada de ruído filtrado. */
function rajada(c: AudioContext, dest: AudioNode, t: number, dur: number, pico: number, tipo: 'branco' | 'rosa' | 'marrom', f: BiquadFilterType, freq: number, Q = 0.7, ataque = 0.005, freqFim?: number) {
  const s = fonte(c, tipo), fl = filtro(c, f, freq, Q), g = ganho(c, 0)
  if (freqFim) fl.frequency.exponentialRampToValueAtTime(freqFim, t + dur)
  envelope(g, t, ataque, pico, dur)
  s.connect(fl).connect(g).connect(dest)
  s.start(t, Math.random() * 2); s.stop(t + dur + 0.05)
}
/** Nota de oscilador com envelope (e glissando opcional). */
function nota(c: AudioContext, dest: AudioNode, t: number, freq: number, dur: number, pico: number, tipo: OscillatorType = 'sine', ataque = 0.01, freqFim?: number) {
  const o = c.createOscillator(), g = ganho(c, 0)
  o.type = tipo; o.frequency.setValueAtTime(freq, t)
  if (freqFim) o.frequency.exponentialRampToValueAtTime(freqFim, t + dur)
  envelope(g, t, ataque, pico, dur)
  o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05)
  return o
}

type Tocador = (c: AudioContext, dest: AudioNode, t: number) => void
const TOCADORES: Record<string, Tocador> = {
  trovao(c, d, t) {
    rajada(c, d, t, 0.25, 0.9, 'branco', 'highpass', 1800)
    rajada(c, d, t + 0.05, 3.6, 1.4, 'marrom', 'lowpass', 600, 0.7, 0.08, 60)
    rajada(c, d, t + 0.6, 2.4, 0.8, 'marrom', 'lowpass', 300, 0.7, 0.3, 50)
  },
  rajada(c, d, t) { rajada(c, d, t, 1.8, 0.7, 'rosa', 'bandpass', 300, 1.2, 0.6, 1400) },
  galho(c, d, t) {
    for (let i = 0; i < 4; i++) rajada(c, d, t + i * 0.035 + Math.random() * 0.02, 0.05, 0.7 - i * 0.12, 'branco', 'bandpass', 1800 + Math.random() * 1500, 1.5)
    rajada(c, d, t, 0.25, 0.4, 'marrom', 'lowpass', 500)
  },
  batidas(c, d, t) {
    for (let i = 0; i < 3; i++) { const u = t + i * 0.3; nota(c, d, u, 150, 0.12, 0.8, 'sine', 0.002, 70); rajada(c, d, u, 0.07, 0.6, 'marrom', 'lowpass', 900) }
  },
  passos(c, d, t) {
    for (let i = 0; i < 5; i++) { const u = t + i * 0.52 + Math.random() * 0.05, v = 0.55 + (i % 2) * 0.15; rajada(c, d, u, 0.11, v, 'marrom', 'lowpass', 520); rajada(c, d, u + 0.02, 0.05, v * 0.4, 'branco', 'bandpass', 2400, 2) }
  },
  rangido(c, d, t) {
    const o = c.createOscillator(), f = filtro(c, 'bandpass', 1100, 7), g = ganho(c, 0)
    o.type = 'sawtooth'
    const pontos = new Float32Array(40); for (let i = 0; i < 40; i++) pontos[i] = 70 + Math.sin(i * 0.9) * 25 + Math.random() * 45
    o.frequency.setValueCurveAtTime(pontos, t, 1.8)
    envelope(g, t, 0.15, 0.55, 1.9)
    o.connect(f).connect(g).connect(d); o.start(t); o.stop(t + 2)
  },
  coracao(c, d, t) {
    for (let i = 0; i < 4; i++) { const u = t + i * 0.85; nota(c, d, u, 75, 0.16, 1, 'sine', 0.008, 40); nota(c, d, u + 0.22, 65, 0.18, 0.75, 'sine', 0.008, 38) }
  },
  sussurro(c, d, t) {
    for (let i = 0; i < 9; i++) { const u = t + i * 0.22 + Math.random() * 0.08; rajada(c, d, u, 0.16 + Math.random() * 0.12, 0.25 + Math.random() * 0.2, 'branco', 'bandpass', 2400 + Math.random() * 2000, 3, 0.04) }
  },
  sino(c, d, t) {
    for (const [k, v] of [[1, 0.5], [2, 0.3], [2.76, 0.25], [5.4, 0.15], [8.93, 0.08]] as const) nota(c, d, t, 196 * k, 4.2 / Math.sqrt(k), v, 'sine', 0.004)
  },
  grito(c, d, t) {
    const o = c.createOscillator(), vib = c.createOscillator(), vg = ganho(c, 25), g = ganho(c, 0), f1 = filtro(c, 'bandpass', 1100, 4), f2 = filtro(c, 'bandpass', 2600, 5)
    o.type = 'sawtooth'; o.frequency.setValueAtTime(700, t); o.frequency.linearRampToValueAtTime(1150, t + 0.3); o.frequency.linearRampToValueAtTime(820, t + 1.3)
    vib.frequency.value = 7; vib.connect(vg).connect(o.frequency)
    envelope(g, t, 0.06, 0.6, 1.4)
    o.connect(f1).connect(g); o.connect(f2).connect(g); g.connect(d)
    o.start(t); vib.start(t); o.stop(t + 1.5); vib.stop(t + 1.5)
  },
  espada(c, d, t) {
    rajada(c, d, t, 0.22, 0.4, 'branco', 'bandpass', 3000, 2, 0.05, 7000)
    const u = t + 0.22
    for (const [f, v] of [[1180, 0.4], [2650, 0.3], [3900, 0.22], [5320, 0.15]] as const) nota(c, d, u, f * (0.98 + Math.random() * 0.04), 0.9, v, 'sine', 0.002)
    rajada(c, d, u, 0.06, 0.7, 'branco', 'highpass', 2500)
  },
  escudo(c, d, t) {
    nota(c, d, t, 90, 0.25, 0.9, 'sine', 0.003, 45)
    for (const [f, v] of [[420, 0.3], [1130, 0.2], [1720, 0.12]] as const) nota(c, d, t, f, 0.5, v, 'triangle', 0.002)
    rajada(c, d, t, 0.08, 0.6, 'branco', 'lowpass', 3000)
  },
  flecha(c, d, t) {
    rajada(c, d, t, 0.38, 0.55, 'rosa', 'bandpass', 700, 3, 0.02, 2600)
    nota(c, d, t + 0.4, 180, 0.12, 0.8, 'sine', 0.002, 80); rajada(c, d, t + 0.4, 0.09, 0.6, 'marrom', 'lowpass', 1200)
  },
  impacto(c, d, t) { nota(c, d, t, 110, 0.25, 1, 'sine', 0.002, 38); rajada(c, d, t, 0.12, 0.8, 'marrom', 'lowpass', 1400) },
  magia(c, d, t) {
    const eco = c.createDelay(1), fb = ganho(c, 0.35), mix = ganho(c, 0.6); eco.delayTime.value = 0.18
    eco.connect(fb).connect(eco); eco.connect(mix).connect(d)
    const notas = [523, 659, 784, 988, 1175, 1568]
    notas.forEach((f, i) => { nota(c, d, t + i * 0.07, f, 0.6, 0.22, 'triangle', 0.01); nota(c, eco, t + i * 0.07, f * 2, 0.4, 0.08, 'sine', 0.01) })
    rajada(c, d, t, 0.9, 0.2, 'branco', 'highpass', 6000, 0.7, 0.2)
  },
  cura(c, d, t) {
    ;[392, 494, 587, 784].forEach((f, i) => nota(c, d, t + i * 0.12, f, 1.4 - i * 0.15, 0.2, 'sine', 0.06))
    nota(c, d, t, 196, 1.6, 0.12, 'triangle', 0.3)
  },
  explosao(c, d, t) {
    rajada(c, d, t, 0.15, 1, 'branco', 'lowpass', 6000)
    rajada(c, d, t, 3.2, 1.5, 'marrom', 'lowpass', 1200, 0.7, 0.01, 70)
    nota(c, d, t, 70, 1.2, 1, 'sine', 0.005, 28)
  },
  rugido(c, d, t) {
    const o = c.createOscillator(), am = c.createOscillator(), amg = ganho(c, 0.45), g = ganho(c, 0), f = filtro(c, 'lowpass', 900, 3)
    o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(130, t + 0.5); o.frequency.linearRampToValueAtTime(70, t + 2)
    am.frequency.value = 28; am.connect(amg).connect(g.gain)
    envelope(g, t, 0.25, 0.8, 2.1)
    o.connect(f).connect(g).connect(d); o.start(t); am.start(t); o.stop(t + 2.2); am.stop(t + 2.2)
    rajada(c, d, t, 2, 0.35, 'marrom', 'bandpass', 400, 1, 0.3)
  },
  palmas(c, d, t) { for (let i = 0; i < 6; i++) rajada(c, d, t + i * 0.36, 0.05, 0.8, 'branco', 'bandpass', 1300 + Math.random() * 400, 1.2, 0.001) },
  aplausos(c, d, t) {
    for (let i = 0; i < 150; i++) { const x = Math.random(), u = t + x * 3.2, v = Math.sin(Math.PI * Math.min(1, x * 1.3)) * 0.35 + 0.05; rajada(c, d, u, 0.04, v, 'branco', 'bandpass', 900 + Math.random() * 1600, 1.4, 0.001) }
  },
  risadas(c, d, t) {
    for (let i = 0; i < 6; i++) {
      const u = t + i * 0.17, o = c.createOscillator(), g = ganho(c, 0), f1 = filtro(c, 'bandpass', 800, 5), f2 = filtro(c, 'bandpass', 1250, 6)
      o.type = 'sawtooth'; o.frequency.setValueAtTime(240 - i * 9, u); o.frequency.exponentialRampToValueAtTime(200 - i * 8, u + 0.12)
      envelope(g, u, 0.02, 0.5, 0.13)
      o.connect(f1).connect(g); o.connect(f2).connect(g); g.connect(d); o.start(u); o.stop(u + 0.16)
    }
  },
  assobio(c, d, t) {
    const o = nota(c, d, t, 1300, 1.2, 0.3, 'sine', 0.05)
    o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(2300, t + 0.45); o.frequency.exponentialRampToValueAtTime(1500, t + 1.1)
  },
  moedas(c, d, t) { for (let i = 0; i < 7; i++) { const u = t + i * 0.08 + Math.random() * 0.06, f = 2800 + Math.random() * 2200; nota(c, d, u, f, 0.35, 0.25, 'sine', 0.001); nota(c, d, u, f * 1.51, 0.2, 0.1, 'sine', 0.001) } },
  fanfarra(c, d, t) {
    const f = filtro(c, 'lowpass', 2200, 1); f.connect(d)
    ;([[523, 0, 0.18], [523, 0.2, 0.1], [523, 0.32, 0.1], [659, 0.44, 0.35], [784, 0.82, 0.25], [1047, 1.1, 0.8]] as const)
      .forEach(([fr, a, dur]) => { nota(c, f, t + a, fr, dur, 0.3, 'sawtooth', 0.02); nota(c, f, t + a, fr / 2, dur, 0.12, 'square', 0.02) })
  },
}

type Parar = () => void
type CriadorAmbiente = (c: AudioContext, d: GainNode) => Parar
/** Fonte de ruído em laço que começa num ponto qualquer (camadas iguais não ficam sincronizadas). */
function laco(c: AudioContext, tipo: 'branco' | 'rosa' | 'marrom') { const s = fonte(c, tipo, true); s.start(c.currentTime, Math.random() * 2.5); return s }
function lfo(c: AudioContext, freq: number, quanto: number, alvo: AudioParam) { const o = c.createOscillator(), g = ganho(c, quanto); o.frequency.value = freq; o.connect(g).connect(alvo); o.start(); return o }
/** Repete `f` em intervalos aleatórios (entre min e max ms) enquanto a camada viver. */
function repetir(f: () => void, min: number, max: number): Parar {
  let vivo = true, timer: ReturnType<typeof setTimeout> | undefined
  const prox = () => { timer = setTimeout(() => { if (!vivo) return; f(); prox() }, min + Math.random() * (max - min)) }
  prox(); return () => { vivo = false; if (timer) clearTimeout(timer) }
}
const pararTudo = (...xs: (AudioScheduledSourceNode | Parar)[]) => () => { for (const x of xs) try { if (typeof x === 'function') x(); else x.stop() } catch { /* já parou */ } }

const AMBIENTE: Record<string, CriadorAmbiente> = {
  vento(c, d) {
    const s = laco(c, 'marrom'), f = filtro(c, 'bandpass', 420, 0.9), g = ganho(c, 0.7)
    const l1 = lfo(c, 0.09, 260, f.frequency), l2 = lfo(c, 0.13, 0.35, g.gain)
    s.connect(f).connect(g).connect(d); return pararTudo(s, l1, l2)
  },
  chuva(c, d) {
    const s = laco(c, 'branco'), hp = filtro(c, 'highpass', 900), lp = filtro(c, 'lowpass', 7500), g = ganho(c, 0.32)
    const r = laco(c, 'marrom'), rl = filtro(c, 'lowpass', 280), rg = ganho(c, 0.4)
    s.connect(hp).connect(lp).connect(g).connect(d); r.connect(rl).connect(rg).connect(d)
    const gotas = repetir(() => rajada(c, d, c.currentTime, 0.02, 0.15 + Math.random() * 0.2, 'branco', 'bandpass', 3000 + Math.random() * 3000, 3), 40, 160)
    return pararTudo(s, r, gotas)
  },
  fogueira(c, d) {
    const s = laco(c, 'marrom'), f = filtro(c, 'lowpass', 420), g = ganho(c, 0.55)
    s.connect(f).connect(g).connect(d)
    const estalos = repetir(() => { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) rajada(c, d, c.currentTime + i * 0.03, 0.012 + Math.random() * 0.02, 0.3 + Math.random() * 0.5, 'branco', 'highpass', 1500 + Math.random() * 2500, 0.7, 0.001) }, 60, 420)
    return pararTudo(s, estalos)
  },
  floresta(c, d) {
    const s = laco(c, 'rosa'), f = filtro(c, 'bandpass', 900, 0.6), g = ganho(c, 0.15)
    s.connect(f).connect(g).connect(d)
    const passaros = repetir(() => {
      const t = c.currentTime, base = 2400 + Math.random() * 2000, n = 2 + Math.floor(Math.random() * 4)
      for (let i = 0; i < n; i++) nota(c, d, t + i * 0.11, base, 0.08, 0.12, 'sine', 0.01, base * (1.2 + Math.random() * 0.4))
    }, 900, 3500)
    return pararTudo(s, passaros)
  },
  caverna(c, d) {
    const z1 = c.createOscillator(), z2 = c.createOscillator(), zg = ganho(c, 0.12)
    z1.frequency.value = 55; z2.frequency.value = 82.4; z1.connect(zg); z2.connect(zg); zg.connect(d); z1.start(); z2.start()
    const eco = c.createDelay(1.5), fb = ganho(c, 0.45), saidaEco = ganho(c, 0.6); eco.delayTime.value = 0.38
    eco.connect(fb).connect(eco); eco.connect(saidaEco).connect(d)
    const gotas = repetir(() => { const t = c.currentTime, f = 900 + Math.random() * 900; nota(c, d, t, f, 0.09, 0.3, 'sine', 0.002, f * 0.55); nota(c, eco, t, f, 0.09, 0.3, 'sine', 0.002, f * 0.55) }, 700, 2600)
    return pararTudo(z1, z2, gotas)
  },
  mar(c, d) {
    const s = laco(c, 'marrom'), f = filtro(c, 'lowpass', 700), g = ganho(c, 0.4)
    const l1 = lfo(c, 0.11, 0.38, g.gain), l2 = lfo(c, 0.11, 350, f.frequency)
    const e = laco(c, 'rosa'), ef = filtro(c, 'highpass', 2500), eg = ganho(c, 0.04), l3 = lfo(c, 0.11, 0.04, eg.gain)
    s.connect(f).connect(g).connect(d); e.connect(ef).connect(eg).connect(d)
    return pararTudo(s, e, l1, l2, l3)
  },
  multidao(c, d) {
    const s = laco(c, 'rosa'), f1 = filtro(c, 'bandpass', 550, 1.4), f2 = filtro(c, 'bandpass', 1400, 2), g1 = ganho(c, 0.5), g2 = ganho(c, 0.25)
    const l1 = lfo(c, 3.1, 0.2, g1.gain), l2 = lfo(c, 4.7, 0.12, g2.gain), l3 = lfo(c, 0.4, 150, f1.frequency)
    s.connect(f1).connect(g1).connect(d); s.connect(f2).connect(g2).connect(d)
    return pararTudo(s, l1, l2, l3)
  },
  masmorra(c, d) {
    const o = c.createOscillator(), sub = c.createOscillator(), f = filtro(c, 'lowpass', 140, 2), g = ganho(c, 0.3)
    o.type = 'sawtooth'; o.frequency.value = 41; sub.frequency.value = 30.5
    const l = lfo(c, 0.05, 60, f.frequency), lg = lfo(c, 0.07, 0.12, g.gain)
    o.connect(f).connect(g).connect(d); sub.connect(g); o.start(); sub.start()
    return pararTudo(o, sub, l, lg)
  },
}

// ---------------------------------------------------------------- sons enviados pelo mestre (Howler)

type Howl = import('howler').Howl
const arquivosTocando = new Set<Howl>()
/**
 * Toca um áudio enviado pelo mestre (Howler.js, carregado só quando precisa).
 * O endereço já foi conferido (audioDaPlataforma) por quem chama.
 */
export async function tocarArquivo(url: string, vol = 0.9) {
  if (typeof window === 'undefined') return false
  const { Howl } = await import('howler')
  const h: Howl = new Howl({ src: [url], volume: Math.min(1, Math.max(0.05, vol)) * volumeLocal, html5: true })
  arquivosTocando.add(h)
  const fim = () => { arquivosTocando.delete(h); h.unload() }
  h.once('end', fim); h.once('loaderror', fim); h.once('playerror', fim)
  h.play()
  return true
}
/** Para os áudios enviados que ainda estão tocando (Silenciar). */
export function pararArquivos() { for (const h of arquivosTocando) { h.fade(h.volume(), 0, 400); setTimeout(() => { h.stop(); h.unload() }, 450) } arquivosTocando.clear() }

/** Toca um efeito para esta pessoa. `vol` vem do mestre (0–1); o volume local é aplicado na saída. */
export function tocarEfeito(id: string, vol = 0.9) {
  const toca = TOCADORES[id]; const c = contexto()
  if (!toca || !c || !saida) return false
  if (c.state === 'suspended') void c.resume().catch(() => {})
  const g = ganho(c, Math.min(1, Math.max(0.05, vol))); g.connect(saida)
  try { toca(c, g, c.currentTime + 0.03) } catch { return false }
  setTimeout(() => g.disconnect(), 6000)
  return true
}

/** Liga, desliga e ajusta as camadas de ambiente com transição suave (sem cortes). */
export function definirCamadas(camadas: Camadas, transicao = 1.5) {
  const c = contexto(); if (!c || !saida) return
  const t = c.currentTime
  for (const [id, viva] of camadasVivas) if (!camadas[id]) {
    viva.ganho.gain.cancelScheduledValues(t); viva.ganho.gain.setValueAtTime(Math.max(0.0001, viva.ganho.gain.value), t)
    viva.ganho.gain.exponentialRampToValueAtTime(0.0001, t + transicao)
    camadasVivas.delete(id); setTimeout(() => { viva.parar(); viva.ganho.disconnect() }, transicao * 1000 + 200)
  }
  for (const [id, nivel] of Object.entries(camadas)) {
    const alvo = Math.max(0.0001, Math.min(1, nivel))
    const viva = camadasVivas.get(id)
    if (viva) { viva.ganho.gain.cancelScheduledValues(t); viva.ganho.gain.setValueAtTime(Math.max(0.0001, viva.ganho.gain.value), t); viva.ganho.gain.exponentialRampToValueAtTime(alvo, t + Math.min(0.6, transicao)); continue }
    const criar = AMBIENTE[id]; if (!criar) continue
    const g = ganho(c, 0.0001); g.connect(saida)
    try { const parar = criar(c, g); g.gain.exponentialRampToValueAtTime(alvo, t + transicao); camadasVivas.set(id, { ganho: g, parar }) } catch { g.disconnect() }
  }
}
export function pararSons() { definirCamadas({}, 0.4); pararArquivos() }
