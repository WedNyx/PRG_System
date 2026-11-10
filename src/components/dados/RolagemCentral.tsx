'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'
import { detectarCritico } from '@/lib/dice'
import { somCritico, somFalha, somRolagem } from '@/lib/sons'
import { montarNotacao } from '@/components/mesa/Dados3D'

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

type DiceBox = { init: () => Promise<unknown>; roll: (n: string | string[]) => void; clear: () => void }

const TEMPO_DADOS = 1500, TEMPO_CARTAO = 4500, MAX_CHIPS = 24

/**
 * Rolagem no meio da tela: os dados 3D caem numa área central e, quando param,
 * aparece o cartão com o total grande e cada dado que caiu. Toque/Esc fecha.
 */
const RolagemCentral = forwardRef<RolagemCentralHandle, { som?: boolean }>(function RolagemCentral({ som = true }, ref) {
  const [id] = useState(() => 'dados-centro-' + Math.random().toString(36).slice(2, 9))
  const box = useRef<DiceBox | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
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
        const { default: DiceBox } = await import('@3d-dice/dice-box')
        const b = new DiceBox({ container: '#' + id, assetPath: '/assets/dice-box/', theme: 'default', themeColor: '#8b5cf6', scale: 8, gravity: 1.6, throwForce: 5, lightIntensity: 1.1 }) as DiceBox
        await b.init()
        if (!cancelado) box.current = b
      } catch (e) { console.warn('Dados 3D indisponíveis:', e) }
    })()
    return () => { cancelado = true; timers.current.forEach(clearTimeout) }
  }, [id, noNavegador])

  const fechar = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = []
    setFase('nada'); try { box.current?.clear() } catch { /* nada */ }
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
      setAtual(r); setFase('rolando')
      if (somRef.current) somRolagem()
      let tempo = 250
      if (box.current) {
        try {
          box.current.clear()
          box.current.roll(montarNotacao(r.expressao, r.resultados) ?? r.expressao.replace(/[!]|k[hl]\d+/g, ''))
          tempo = TEMPO_DADOS
        } catch (e) { console.warn('Erro ao animar dados:', e) }
      }
      const critico = detectarCritico(r.expressao, r.resultados)
      timers.current.push(setTimeout(() => {
        setFase('cartao')
        if (critico === 'critico') {
          if (somRef.current) somCritico()
          confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 }, colors: ['#b99bff', '#ed9cd8', '#fbbf24', '#ffffff'] })
        } else if (critico === 'falha' && somRef.current) somFalha()
      }, tempo))
      timers.current.push(setTimeout(fechar, tempo + TEMPO_CARTAO))
    },
  }), [fechar])

  const critico = atual ? detectarCritico(atual.expressao, atual.resultados) : null
  const extras = atual ? atual.resultados.length - MAX_CHIPS : 0
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
      className="prg-pop pointer-events-auto w-full max-w-[420px] cursor-pointer rounded-3xl border border-[#8b6cba] bg-[#19172c]/95 p-5 text-center shadow-[0_0_60px_#7654bb88]">
      {(atual.rotulo || atual.quem) && <p className="text-sm text-[#c4b6d4]">
        {atual.quem && <span className="font-semibold text-[#e4d3ff]">{atual.quem}</span>}{atual.quem && atual.rotulo && ' · '}{atual.rotulo}{atual.privada && ' 🔒'}</p>}
      <p className={'mt-1 bg-gradient-to-b bg-clip-text text-7xl font-black tabular-nums text-transparent ' + (critico === 'critico' ? 'from-amber-200 to-amber-500' : critico === 'falha' ? 'from-red-300 to-red-600' : 'from-[#e4d3ff] to-[#9f6bff]')}>{atual.total}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {atual.resultados.slice(0, MAX_CHIPS).map((n, i) => <span key={i} className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-[#62527e] bg-[#2b2140] px-1.5 text-base font-bold tabular-nums">{n}</span>)}
        {extras > 0 && <span className="flex h-9 items-center px-1.5 text-sm text-[#b4aeca]">+{extras}</span>}
      </div>
      <p className="mt-2 text-xs text-[#9d8db0]">{atual.expressao}</p>
      {critico === 'critico' && <p className="mt-1 font-bold text-amber-300">✨ Acerto crítico!</p>}
      {critico === 'falha' && <p className="mt-1 font-bold text-red-300">💀 Falha crítica</p>}
      {atual.nota && <p className="mt-1 font-semibold text-[#ed9cd8]">{atual.nota}</p>}
    </div></div>}
  </>, document.body)
})

export default RolagemCentral
