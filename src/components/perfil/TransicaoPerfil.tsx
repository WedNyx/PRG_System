'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Perfil = { id: string; apelido: string; avatar?: string | null }
/** Marca para a Central tocar a animação de chegada. */
export const CHAVE_ENTRADA = 'prg-entrada-perfil'
const DURACAO = 1650

/**
 * Transição ao escolher um perfil (estilo plataformas de streaming): a foto voa do card
 * para o centro, ganha um anel de luz e estrelas, mostra o nome e “mergulha” na Central.
 * Toque na tela para pular. Quem pede menos movimento no aparelho vai direto.
 */
export default function TransicaoPerfil({ perfil, origem, aoTerminar }: { perfil: Perfil; origem: DOMRect; aoTerminar: () => void }) {
  const foto = useRef<HTMLDivElement>(null)
  const fundo = useRef<HTMLDivElement>(null)
  const [fase, setFase] = useState<'voando' | 'nome' | 'mergulho'>('voando')
  const terminou = useRef(false)
  const fim = useRef(aoTerminar)
  useEffect(() => { fim.current = aoTerminar }, [aoTerminar])
  const terminar = () => { if (terminou.current) return; terminou.current = true; try { sessionStorage.setItem(CHAVE_ENTRADA, '1') } catch {} fim.current() }

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { terminar(); return }
    const el = foto.current!, tam = Math.min(176, window.innerWidth * 0.42)
    const cx = window.innerWidth / 2 - tam / 2, cy = window.innerHeight / 2 - tam / 2 - 30
    const dx = origem.left - cx, dy = origem.top - cy, esc = origem.width / tam
    el.style.width = el.style.height = tam + 'px'; el.style.left = cx + 'px'; el.style.top = cy + 'px'
    const voo = el.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(${esc})`, borderRadius: '12px' },
      { transform: 'translate(0, 0) scale(1.06)', borderRadius: '24px', offset: 0.75 },
      { transform: 'translate(0, 0) scale(1)', borderRadius: '24px' },
    ], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' })
    fundo.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: 'forwards' })
    const t1 = setTimeout(() => setFase('nome'), 560)
    const t2 = setTimeout(() => {
      setFase('mergulho')
      el.animate([{ transform: 'scale(1)', opacity: 1, filter: 'blur(0)' }, { transform: 'scale(7)', opacity: 0, filter: 'blur(6px)' }],
        { duration: 520, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' })
    }, DURACAO - 520)
    const t3 = setTimeout(terminar, DURACAO)
    return () => { voo.cancel(); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className="fixed inset-0 z-[200] cursor-pointer select-none overflow-hidden" onClick={terminar} role="status" aria-live="polite" aria-label={'Entrando como ' + perfil.apelido}>
    <div ref={fundo} className="absolute inset-0 opacity-0" style={{ background: 'radial-gradient(circle at 50% 45%, #3b2a7a 0%, #1a1240 45%, #0b0820 100%)' }} />
    {/* estrelinhas que surgem em volta */}
    {fase !== 'voando' && <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2, r = 120 + (i % 3) * 38
        return <span key={i} className="prg-faisca absolute left-1/2 top-[calc(50%-30px)] text-[#ffd36b]"
          style={{ '--fx': `${Math.cos(a) * r}px`, '--fy': `${Math.sin(a) * r}px`, animationDelay: `${(i % 5) * 40}ms`, fontSize: 10 + (i % 4) * 5 } as React.CSSProperties}>✦</span>
      })}
    </div>}
    <div ref={foto} className={'absolute flex ' + (fase !== 'voando' ? 'prg-pulso ' : '') + ' items-center justify-center overflow-hidden border-2 border-[#b99bff] bg-[#28233e] text-6xl font-bold text-[#b99bff] shadow-[0_0_60px_#9b7bff88]'} style={{ willChange: 'transform', width: 0, height: 0 }}>
      {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0]?.toUpperCase()}
    </div>
    <div className={'pointer-events-none absolute inset-x-0 top-[calc(50%+80px)] text-center transition-all duration-500 ' + (fase === 'nome' ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0')}>
      <p className="text-xs uppercase tracking-[.3em] text-[#ed9cd8]">Bem-vindo de volta</p>
      <p className="mt-2 text-2xl font-bold text-white drop-shadow-[0_0_12px_#9b7bff]">{perfil.apelido}</p>
    </div>
    <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-xs text-[#a99bbb]">Toque para pular</p>
  </div>
}
