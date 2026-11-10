'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/** Cor da barra pelo tipo de recurso: vida vermelha, sanidade azul, esforço/energia laranja, mana anil… */
export function corDoRecurso(id: string, nome: string): { de: string; ate: string; emoji: string } {
  const t = (id + ' ' + nome).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/\b(pv|vida|hp|pontos_de_vida|saude)\b|vida/.test(t)) return { de: '#7f1d1d', ate: '#ef4444', emoji: '❤️' }
  if (/san|sanidade|mente|estabilidade/.test(t)) return { de: '#1e3a8a', ate: '#3b82f6', emoji: '🧠' }
  if (/\bpe\b|esforco|energia|stamina|vigor|folego/.test(t)) return { de: '#9a3412', ate: '#f59e0b', emoji: '⚡' }
  if (/\bpm\b|mana|magia|ki|chakra|aura|essencia/.test(t)) return { de: '#312e81', ate: '#818cf8', emoji: '✨' }
  if (/temp|escudo|barreira|armadura/.test(t)) return { de: '#334155', ate: '#94a3b8', emoji: '🛡️' }
  return { de: '#4c1d95', ate: '#a78bfa', emoji: '🔮' }
}

/**
 * Barra de recurso no estilo das fichas de Ordem Paranormal: barra grossa colorida com “atual/máximo” no meio
 * e botões dos lados (‹ −1, « −5, › +1, » +5). Toque no número para digitar. Se o máximo não é calculado
 * pelo sistema, dá para mudar o máximo também.
 */
export default function BarraRecurso({ nome, cor, atual, max, maxEditavel, somenteLeitura, mudar, mudarMax }: {
  nome: string; cor: { de: string; ate: string; emoji: string }; atual: number; max: number | null
  maxEditavel: boolean; somenteLeitura: boolean; mudar: (v: number) => void; mudarMax?: (v: number) => void
}) {
  const [editando, setEditando] = useState<'atual' | 'max' | null>(null)
  const [texto, setTexto] = useState('')
  const limite = (v: number) => Math.max(0, max ? Math.min(max, v) : v)
  const pct = max ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0
  const botao = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white/90 hover:bg-black/50 active:scale-95 disabled:opacity-30'
  const abrir = (q: 'atual' | 'max') => { if (somenteLeitura || (q === 'max' && !maxEditavel)) return; setTexto(String(q === 'atual' ? atual : max ?? '')); setEditando(q) }
  const salvar = () => {
    const v = Math.round(Number(texto.replace(',', '.')))
    if (Number.isFinite(v)) { if (editando === 'atual') mudar(limite(v)); else if (editando === 'max' && mudarMax) mudarMax(Math.max(0, v)) }
    setEditando(null)
  }
  return <div className="rounded-xl bg-[#171325] p-3">
    <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest" style={{ color: cor.ate }}>
      <span>{cor.emoji} {nome}</span>
      {max ? <span className="tabular-nums text-[#a998bd]">{Math.round(pct)}%</span> : null}
    </div>
    <div className="flex items-center gap-1.5">
      {!somenteLeitura && <><button type="button" className={botao} aria-label={`${nome} −5`} disabled={atual <= 0} onClick={() => mudar(limite(atual - 5))}><ChevronsLeft size={16} /></button>
        <button type="button" className={botao} aria-label={`${nome} −1`} disabled={atual <= 0} onClick={() => mudar(limite(atual - 1))}><ChevronLeft size={16} /></button></>}
      <div className="relative h-10 min-w-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/50 shadow-inner">
        <div className="absolute inset-y-0 left-0 transition-[width] duration-300" style={{ width: pct + '%', background: `linear-gradient(90deg, ${cor.de}, ${cor.ate})`, boxShadow: `0 0 12px ${cor.ate}66` }} />
        <div className="absolute inset-0 flex items-center justify-center gap-1 font-black tabular-nums text-white [text-shadow:0_1px_3px_#000]">
          {editando ? <input autoFocus inputMode="numeric" aria-label={`${nome} ${editando === 'atual' ? 'atual' : 'máximo'}`} value={texto} onChange={e => setTexto(e.target.value)} onBlur={salvar}
            onKeyDown={e => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(null) }} className="w-16 rounded bg-black/60 text-center text-lg outline-none ring-1 ring-white/40" />
            : <>
              <button type="button" disabled={somenteLeitura} onClick={() => abrir('atual')} className="text-lg" title="Toque para digitar" aria-label={`${nome}: ${atual}. Toque para digitar`}>{atual}</button>
              <span className="text-white/70">/</span>
              <button type="button" disabled={somenteLeitura || !maxEditavel} onClick={() => abrir('max')} className="text-lg" title={maxEditavel ? 'Toque para mudar o máximo' : 'Calculado pela ficha'} aria-label={`${nome} máximo: ${max ?? 'sem máximo'}`}>{max ?? '—'}</button>
            </>}
        </div>
      </div>
      {!somenteLeitura && <><button type="button" className={botao} aria-label={`${nome} +1`} disabled={!!max && atual >= max} onClick={() => mudar(limite(atual + 1))}><ChevronRight size={16} /></button>
        <button type="button" className={botao} aria-label={`${nome} +5`} disabled={!!max && atual >= max} onClick={() => mudar(limite(atual + 5))}><ChevronsRight size={16} /></button></>}
    </div>
  </div>
}
