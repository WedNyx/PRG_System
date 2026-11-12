'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/** Cor da barra pelo tipo de recurso: vida vermelha, sanidade azul, esforço/energia laranja, mana anil… */
export function corDoRecurso(id: string, nome: string): { de: string; ate: string; emoji: string } {
  const t = (id + ' ' + nome).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/dado/.test(t)) return { de: '#4c1d95', ate: '#c084fc', emoji: '🎲' }
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
export default function BarraRecurso({ nome, cor, atual, max, maxEditavel, somenteLeitura, mudar, mudarMax, contador = false }: {
  nome: string; cor: { de: string; ate: string; emoji: string }; atual: number; max: number | null
  /** Marcador (Exaustão, Morrendo…): 0 é o normal, então não mostra aviso de “zerado”. */
  contador?: boolean
  maxEditavel: boolean; somenteLeitura: boolean; mudar: (v: number) => void; mudarMax?: (v: number) => void
}) {
  const [editando, setEditando] = useState<'atual' | 'max' | null>(null)
  const [texto, setTexto] = useState('')
  // Efeito quando o valor muda (aqui ou vindo da mesa): rastro do que foi perdido e o número subindo.
  const [visto, setVisto] = useState(atual)
  const [efeito, setEfeito] = useState<{ delta: number; de: number; chave: number } | null>(null)
  if (visto !== atual) { setEfeito({ delta: atual - visto, de: visto, chave: Date.now() }); setVisto(atual) }
  useEffect(() => { if (!efeito) return; const t = setTimeout(() => setEfeito(null), 1300); return () => clearTimeout(t) }, [efeito])
  const limite = (v: number) => Math.max(0, max ? Math.min(max, v) : v)
  const pctDe = (v: number) => max ? Math.max(0, Math.min(100, (v / max) * 100)) : 0
  const pct = pctDe(atual)
  const baixa = !contador && !!max && atual > 0 && pct <= 25, zerada = !contador && !!max && atual <= 0
  const botao = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white/90 hover:bg-black/50 active:scale-95 disabled:opacity-30'
  const abrir = (q: 'atual' | 'max') => { if (somenteLeitura || (q === 'max' && !maxEditavel)) return; setTexto(String(q === 'atual' ? atual : max ?? '')); setEditando(q) }
  const salvar = () => {
    const v = Math.round(Number(texto.replace(',', '.')))
    if (Number.isFinite(v)) { if (editando === 'atual') mudar(limite(v)); else if (editando === 'max' && mudarMax) mudarMax(Math.max(0, v)) }
    setEditando(null)
  }
  return <div className="rounded-xl bg-(--s-171325) p-3">
    <div className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-widest" style={{ color: cor.ate }}>
      <span>{cor.emoji} {nome}</span>
      {zerada ? <span className="text-red-300">💀 zerado</span> : contador && max ? <span className="tabular-nums text-(--a-a998bd)">{atual} de {max}</span> : max ? <span className={'tabular-nums ' + (baixa ? 'text-red-300' : 'text-(--a-a998bd)')}>{baixa ? '⚠️ ' : ''}{Math.round(pct)}%</span> : null}
    </div>
    <div className="relative flex items-center gap-1.5">
      {!somenteLeitura && <><button type="button" className={botao} aria-label={`${nome} −5`} disabled={atual <= 0} onClick={() => mudar(limite(atual - 5))}><ChevronsLeft size={16} /></button>
        <button type="button" className={botao} aria-label={`${nome} −1`} disabled={atual <= 0} onClick={() => mudar(limite(atual - 1))}><ChevronLeft size={16} /></button></>}
      <div key={efeito && efeito.delta < 0 ? efeito.chave : 'barra'} className={'relative h-10 min-w-0 flex-1 overflow-hidden rounded-lg border bg-black/50 shadow-inner ' + (zerada ? 'border-red-500/70 ' : 'border-white/10 ') + (efeito && efeito.delta < 0 ? 'prg-treme' : '')}>
        {/* rastro: o pedaço perdido fica claro e encolhe devagar */}
        {efeito && efeito.delta < 0 && <div key={'r' + efeito.chave} className="prg-rastro absolute inset-y-0 bg-white/70" style={{ left: pct + '%', width: Math.max(0, pctDe(efeito.de) - pct) + '%' }} />}
        <div className={'absolute inset-y-0 left-0 transition-[width] duration-500 ease-out ' + (baixa ? 'prg-baixa' : '')} style={{ width: pct + '%', background: `linear-gradient(90deg, ${cor.de}, ${cor.ate})`, boxShadow: `0 0 ${baixa ? 18 : 12}px ${cor.ate}${baixa ? 'aa' : '66'}` }} />
        {/* brilho de vidro em cima e marcas de 25% */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
        {[25, 50, 75].map(m => <div key={m} className="pointer-events-none absolute inset-y-0 w-px bg-black/35" style={{ left: m + '%' }} />)}
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
      {efeito && <span key={'n' + efeito.chave} aria-hidden className={'prg-sobe pointer-events-none absolute left-1/2 top-0 text-lg font-black [text-shadow:0_1px_4px_#000] ' + (efeito.delta < 0 ? 'text-red-300' : 'text-emerald-300')}>{efeito.delta > 0 ? '+' : '−'}{Math.abs(efeito.delta)}</span>}
      {!somenteLeitura && <><button type="button" className={botao} aria-label={`${nome} +1`} disabled={!!max && atual >= max} onClick={() => mudar(limite(atual + 1))}><ChevronRight size={16} /></button>
        <button type="button" className={botao} aria-label={`${nome} +5`} disabled={!!max && atual >= max} onClick={() => mudar(limite(atual + 5))}><ChevronsRight size={16} /></button></>}
    </div>
  </div>
}

/** Versão fininha para o topo da ficha (sempre à vista). */
export function MiniBarra({ nome, cor, atual, max }: { nome: string; cor: { de: string; ate: string; emoji: string }; atual: number; max: number | null }) {
  const pct = max ? Math.max(0, Math.min(100, (atual / max) * 100)) : 0
  return <span className="flex w-28 shrink-0 flex-col gap-0.5 sm:w-36" title={`${nome}: ${atual}${max ? '/' + max : ''}`}>
    <span className="flex justify-between text-[10px] font-bold uppercase tracking-wider" style={{ color: cor.ate }}><span className="truncate">{cor.emoji} {nome}</span><span className="tabular-nums text-white">{atual}{max ? '/' + max : ''}</span></span>
    <span className="h-2 overflow-hidden rounded-full bg-black/60"><span className={'block h-full rounded-full transition-[width] duration-500 ' + (max && pct <= 25 && atual > 0 ? 'prg-baixa' : '')} style={{ width: pct + '%', background: `linear-gradient(90deg, ${cor.de}, ${cor.ate})` }} /></span>
  </span>
}
