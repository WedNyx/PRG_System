'use client'

import { useState } from 'react'
import { ChevronDown, CircleHelp } from 'lucide-react'

/** Título de cada seção da Central com uma explicação curta e um “Como funciona?” que abre ali mesmo (v0.32.7). */
export default function CabecalhoSecao({ icone, titulo, descricao, ajuda, children }: {
  icone: string; titulo: string; descricao: string
  /** Passos do “Como funciona?” (frases curtas). */
  ajuda?: string[]
  /** Ações à direita do título (ex.: botão “Nova ficha”). */
  children?: React.ReactNode
}) {
  const [aberto, setAberto] = useState(false)
  return <header className="mb-5">
    <div className="flex flex-wrap items-start gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-(--a-6d5690) bg-gradient-to-br from-(--s-3a2a5c) to-(--s-211a35) text-2xl shadow-[0_6px_20px_#0006]" aria-hidden>{icone}</span>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
        <p className="mt-1 text-sm text-(--a-cfc0df)">{descricao}</p>
      </div>
      {children}
    </div>
    {ajuda && ajuda.length > 0 && <div className="mt-3">
      <button type="button" onClick={() => setAberto(a => !a)} aria-expanded={aberto} className="inline-flex items-center gap-1.5 rounded-full border border-(--a-55456e) bg-(--s-1d1730)/80 px-3 py-1 text-xs text-(--a-e4d3ff) hover:bg-(--s-2b2143)">
        <CircleHelp size={14} /> Como funciona? <ChevronDown size={14} className={'transition ' + (aberto ? 'rotate-180' : '')} /></button>
      {aberto && <ol className="mt-2 grid gap-1.5 rounded-2xl border border-(--a-55456e) bg-(--s-1d1730)/90 p-3 text-sm text-(--a-d6c8e8) sm:grid-cols-2">
        {ajuda.map((p, i) => <li key={i} className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--a-5b4380) text-[11px] font-bold">{i + 1}</span><span>{p}</span></li>)}
      </ol>}
    </div>}
  </header>
}
