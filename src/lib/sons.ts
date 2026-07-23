/**
 * Sons sintetizados via WebAudio — sem arquivos, sem dependências.
 */

let ctx: AudioContext | null = null

function audioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Chocalho de dados: rajadas curtas de ruído */
export function somRolagem() {
  const ac = audioCtx()
  if (!ac) return
  const agora = ac.currentTime
  for (let i = 0; i < 5; i++) {
    const dur = 0.04
    const inicio = agora + i * 0.07 + Math.random() * 0.02
    const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate)
    const dados = buffer.getChannelData(0)
    for (let j = 0; j < dados.length; j++) {
      dados[j] = (Math.random() * 2 - 1) * (1 - j / dados.length)
    }
    const fonte = ac.createBufferSource()
    fonte.buffer = buffer
    const filtro = ac.createBiquadFilter()
    filtro.type = 'bandpass'
    filtro.frequency.value = 2200 + Math.random() * 1800
    const ganho = ac.createGain()
    ganho.gain.value = 0.25 - i * 0.03
    fonte.connect(filtro).connect(ganho).connect(ac.destination)
    fonte.start(inicio)
  }
}

function nota(freq: number, inicio: number, dur: number, vol: number, tipo: OscillatorType = 'triangle') {
  const ac = audioCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  osc.type = tipo
  osc.frequency.value = freq
  const ganho = ac.createGain()
  ganho.gain.setValueAtTime(0, inicio)
  ganho.gain.linearRampToValueAtTime(vol, inicio + 0.02)
  ganho.gain.exponentialRampToValueAtTime(0.001, inicio + dur)
  osc.connect(ganho).connect(ac.destination)
  osc.start(inicio)
  osc.stop(inicio + dur)
}

/** Fanfarra do crítico: arpejo ascendente brilhante */
export function somCritico() {
  const ac = audioCtx()
  if (!ac) return
  const t = ac.currentTime
  const acorde = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  acorde.forEach((f, i) => nota(f, t + i * 0.09, 0.5, 0.18))
  nota(1318.5, t + 0.36, 0.7, 0.14) // E6 final
}

/** Falha crítica: descida triste */
export function somFalha() {
  const ac = audioCtx()
  if (!ac) return
  const t = ac.currentTime
  nota(220, t, 0.3, 0.18, 'sawtooth')
  nota(185, t + 0.18, 0.3, 0.16, 'sawtooth')
  nota(147, t + 0.36, 0.55, 0.15, 'sawtooth')
}
