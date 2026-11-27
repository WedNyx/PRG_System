'use client'

import { useEffect, useId, useMemo, useRef, type ReactNode } from 'react'
import { arteDaMoldura } from './molduras/arte'
import { ligarEfeitos, temEfeitos } from './molduras/efeitos'
import { movimentoReduzido } from '@/lib/preferencias'

/**
 * Molduras de perfil (v0.37.2): arte nossa em SVG em volta da foto redonda + efeitos vivos (fogo, neve, vagalumes…)
 * só quando a foto é grande (≥ 72 px), está na tela e a pessoa não pediu menos movimento nem efeitos leves.
 * Nos tamanhos pequenos fica só o desenho, com animações leves de CSS.
 * A foto ocupa o círculo de raio 50 no centro (68,68) de uma caixa 136×136; por isso o SVG é 18% maior para cada lado.
 */
const TAMANHO_MINIMO_EFEITOS = 72

export default function Moldura({ id, children, className = '', efeitos = true }: { id?: string | null; children: ReactNode; className?: string; efeitos?: boolean }) {
  if (!id) return <>{children}</>
  return <MolduraViva id={id} className={className} efeitos={efeitos}>{children}</MolduraViva>
}

function MolduraViva({ id, children, className, efeitos }: { id: string; children: ReactNode; className: string; efeitos: boolean }) {
  const uid = 'mo' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const arte = useMemo(() => arteDaMoldura(id, uid), [id, uid])
  const caixa = useRef<HTMLSpanElement>(null), palco = useRef<HTMLSpanElement>(null), svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const el = caixa.current
    if (!efeitos || !el || !temEfeitos(id) || typeof IntersectionObserver === 'undefined') return
    let parar: (() => void) | null = null, visivel = false
    // Pode ligar agora? (tamanho, e nem "movimento reduzido" nem "efeitos leves"); reavaliado a cada mudança.
    const pode = () => el.offsetWidth >= TAMANHO_MINIMO_EFEITOS && !movimentoReduzido() && document.documentElement.dataset.efeitos !== 'leves'
    // Liga/desliga ao vivo (achado do Codex): troca de preferência enquanto a moldura grande já está na tela.
    const atualizar = () => {
      if (visivel && pode()) { if (!parar && palco.current && svg.current) parar = ligarEfeitos(id, palco.current, el.offsetWidth, svg.current) }
      else { parar?.(); parar = null }
    }
    const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; atualizar() })
    io.observe(el)
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    media?.addEventListener('change', atualizar)
    const mo = new MutationObserver(atualizar)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-movimento', 'data-efeitos'] })
    return () => { io.disconnect(); media?.removeEventListener('change', atualizar); mo.disconnect(); parar?.() }
  }, [id, efeitos, arte])

  return <span ref={caixa} className={'relative inline-flex shrink-0 ' + className} data-moldura={id}>
    {/* Palco dos efeitos: 175% da foto, centrado (sem transform, para os canvas ficarem atrás/na frente certinho). */}
    <span ref={palco} aria-hidden className="pointer-events-none absolute left-[-37.5%] top-[-37.5%] h-[175%] w-[175%]" />
    <span className="relative z-[1] inline-flex w-full">{children}</span>
    <svg ref={svg} aria-hidden viewBox="0 0 136 136" className="moldura-arte pointer-events-none absolute left-[-18%] top-[-18%] z-[2] h-[136%] w-[136%] overflow-visible"
      dangerouslySetInnerHTML={{ __html: arte }} />
  </span>
}

/** Vitrine de escolha (pequena: só o desenho). */
export function AmostraMoldura({ id, letra = '✦' }: { id: string; letra?: string }) {
  return <Moldura id={id} efeitos={false}><span className="flex size-12 items-center justify-center rounded-full border border-(--a-62527e) bg-(--s-342749) text-lg font-bold text-(--a-d8c0ff)">{letra}</span></Moldura>
}
