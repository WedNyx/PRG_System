'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import { detectarCritico } from '@/lib/dice'
import { somCritico, somFalha, somRolagem } from '@/lib/sons'
import { detalheDaRolagem, notacao3D } from '@/lib/dados3d'

export type Rolagem = {
  /** O que foi rolado (ex.: "Força", "Bola de fogo"). */
  rotulo?: string | null
  /** Quem rolou (personagem ou perfil). */
  quem?: string | null
  expressao: string
  resultados: number[]
  total: number
  /** Linha extra embaixo do total (ex.: "Sucesso especial"). */
  nota?: string | null
  privada?: boolean
}
export type RolagemCentralHandle = { mostrar: (r: Rolagem) => void }

type Corpo = { mass: number; sleepTimeLimit: number; linearDamping: number; angularDamping: number }
type DiceBox = { initialize: () => Promise<void>; roll: (notacao: string) => Promise<unknown>; clearDice: () => void; world: { addBody: (b: Corpo) => void } }

const TEMPO_MAX_DADOS = 6000, TEMPO_CARTAO = 4500, MAX_CHIPS = 24

/**
 * Rolagem no meio da tela: os dados 3D caem numa área central e, quando param,
 * aparece o cartão com o total grande e cada dado que caiu. Toque/Esc fecha.
 */
const RolagemCentral = forwardRef<RolagemCentralHandle, { som?: boolean }>(function RolagemCentral({ som = true }, ref) {
  const [id] = useState(() => 'dados-centro-' + Math.random().toString(36).slice(2, 9))
  const box = useRef<DiceBox | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const rodada = useRef(0)
  const somRef = useRef(som)
  useEffect(() => { somRef.current = som }, [som])
  const [fase, setFase] = useState<'nada' | 'rolando' | 'cartao'>('nada')
  const [atual, setAtual] = useState<Rolagem | null>(null)

  // Vai direto para o <body>: assim fica no meio da tela mesmo dentro de painéis com efeitos (blur, transform).
  const noNavegador = useSyncExternalStore(() => () => {}, () => true, () => false)

  useEffect(() => {
    if (!noNavegador) return
    let cancelado = false
    void (async () => {
      try {
        // dice-box-threejs: aceita o resultado já sorteado (ex.: "1d20@7"), então a face de cima é a do servidor.
        const { default: DiceBox } = await import('@3d-dice/dice-box-threejs')
        const b = new DiceBox('#' + id, {
          sounds: false, shadows: true, light_intensity: 0.9, gravity_multiplier: 400, baseScale: 110, strength: 1,
          theme_customColorset: { name: 'prg-roxo', foreground: '#ffffff', background: '#7c3aed', outline: '#2e1065', texture: 'none', material: 'glass' },
        }) as unknown as DiceBox
        await b.initialize()
        // Os dados “assentam” mais rápido e tremem menos no fim (mesma física na simulação e na animação,
        // então a face de cima continua sendo a sorteada pelo servidor).
        const add = b.world.addBody.bind(b.world)
        b.world.addBody = corpo => { if (corpo.mass > 0) { corpo.sleepTimeLimit = 0.35; corpo.linearDamping = 0.2; corpo.angularDamping = 0.2 } return add(corpo) }
        if (!cancelado) box.current = b
      } catch (e) { console.warn('Dados 3D indisponíveis:', e) }
    })()
    return () => { cancelado = true; timers.current.forEach(clearTimeout) }
  }, [id, noNavegador])

  const fechar = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = []
    rodada.current++
    setFase('nada'); try { box.current?.clearDice() } catch { /* nada */ }
  }, [])

  useEffect(() => {
    if (fase === 'nada') return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [fase, fechar])

  useImperativeHandle(ref, () => ({
    mostrar(r) {
      timers.current.forEach(clearTimeout); timers.current = []
      const minha = ++rodada.current
      setAtual(r); setFase('rolando')
      if (somRef.current) somRolagem()
      const critico = detectarCritico(r.expressao, r.resultados)
      let mostrou = false
      const mostrarCartao = () => {
        if (mostrou || minha !== rodada.current) return
        mostrou = true
        setFase('cartao')
        if (critico === 'critico') {
          if (somRef.current) somCritico()
          confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 }, colors: ['#b99bff', '#ed9cd8', '#fbbf24', '#ffffff'] })
        } else if (critico === 'falha' && somRef.current) somFalha()
        timers.current.push(setTimeout(() => { if (minha === rodada.current) fechar() }, TEMPO_CARTAO))
      }
      const notacao = notacao3D(r.expressao, r.resultados)
      if (box.current && notacao) {
        try {
          box.current.clearDice()
          // O cartão aparece quando os dados param (ou depois de um tempo, se algo travar).
          void box.current.roll(notacao).then(() => timers.current.push(setTimeout(mostrarCartao, 250)), mostrarCartao)
          timers.current.push(setTimeout(mostrarCartao, TEMPO_MAX_DADOS))
        } catch (e) { console.warn('Erro ao animar dados:', e); timers.current.push(setTimeout(mostrarCartao, 250)) }
      } else timers.current.push(setTimeout(mostrarCartao, 250))
    },
  }), [fechar])

  const critico = atual ? detectarCritico(atual.expressao, atual.resultados) : null
  const extras = atual ? atual.resultados.length - MAX_CHIPS : 0
  const det = atual ? detalheDaRolagem(atual.expressao, atual.resultados) : null
  if (!noNavegador) return null
  return createPortal(<>
    {/* Fundo: escurece e brilha no centro enquanto rola; toque fecha. */}
    <div aria-hidden onClick={fechar} className={'fixed inset-0 z-[60] transition-opacity duration-300 ' + (fase === 'nada' ? 'pointer-events-none opacity-0' : 'opacity-100')}
      style={{ background: 'radial-gradient(circle at 50% 50%, rgba(118,84,187,.35), rgba(5,4,12,.55) 55%, rgba(5,4,12,.7))' }} />
    {/* Área onde os dados 3D caem: um quadrado no meio da tela. */}
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[61] flex items-center justify-center">
      <div id={id} className="relative mb-[22vh] h-[min(88vw,56vh,520px)] w-[min(88vw,56vh,520px)]" />
    </div>
    {fase === 'cartao' && atual && <div className="pointer-events-none fixed inset-0 z-[62] flex items-center justify-center p-4 pt-[34vh]"><div role="status" aria-live="polite" onClick={fechar}
      className="prg-pop pointer-events-auto w-full max-w-[420px] cursor-pointer rounded-3xl border border-(--a-8b6cba) bg-(--s-19172c)/95 p-5 text-center shadow-[0_0_60px_#7654bb88]">
      {(atual.rotulo || atual.quem) && <p className="text-sm text-(--a-c4b6d4)">
        {atual.quem && <span className="font-semibold text-(--a-e4d3ff)">{atual.quem}</span>}{atual.quem && atual.rotulo && ' · '}{atual.rotulo}{atual.privada && ' 🔒'}</p>}
      <p className={'mt-1 bg-gradient-to-b bg-clip-text text-7xl font-black tabular-nums text-transparent ' + (critico === 'critico' ? 'from-amber-200 to-amber-500' : critico === 'falha' ? 'from-red-300 to-red-600' : 'from-(--a-e4d3ff) to-(--a-9f6bff)')}>{atual.total}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {atual.resultados.slice(0, MAX_CHIPS).map((n, i) => { const fora = det?.descartados.has(i)
          return <span key={i} title={fora ? 'Descartado' : undefined} className={'flex h-9 min-w-9 items-center justify-center rounded-lg border px-1.5 text-base font-bold tabular-nums ' + (fora ? 'border-(--a-3d3152) bg-(--s-1a1528) text-(--a-7d6f92) line-through' : 'border-(--a-62527e) bg-(--s-2b2140)')}>{n}</span> })}
        {!!det?.modificador && <span className="flex h-9 items-center rounded-lg bg-[#1f3a2c] px-2 text-base font-bold tabular-nums text-emerald-200" title="Bônus somado aos dados">{det.modificador > 0 ? '+' : '−'}{Math.abs(det.modificador)}</span>}
        {extras > 0 && <span className="flex h-9 items-center px-1.5 text-sm text-(--a-b4aeca)">+{extras}</span>}
      </div>
      <p className="mt-2 text-xs text-(--a-9d8db0)">{atual.expressao}</p>
      {critico === 'critico' && <p className="mt-1 font-bold text-amber-300">✨ Acerto crítico!</p>}
      {critico === 'falha' && <p className="mt-1 font-bold text-red-300">💀 Falha crítica</p>}
      {atual.nota && <p className="mt-1 font-semibold text-(--a-ed9cd8)">{atual.nota}</p>}
    </div></div>}
  </>, document.body)
})

export default RolagemCentral
