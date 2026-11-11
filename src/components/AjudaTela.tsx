'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { CircleHelp, X } from 'lucide-react'

export type PassoAjuda = { icone: string; titulo: string; texto: string }

/** Botão “Ajuda” + janela com o passo a passo da tela atual (v0.32.8). */
export default function AjudaTela({ titulo, intro, passos, rotulo = 'Ajuda', className = '' }: {
  titulo: string; intro?: string; passos: PassoAjuda[]; rotulo?: string; className?: string
}) {
  const [aberto, setAberto] = useState(false)
  const fechar = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (aberto) fechar.current?.focus() }, [aberto])
  return <>
    <button type="button" onClick={() => setAberto(true)} aria-label={titulo} title={titulo}
      className={'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-(--a-8d70b6) px-3 py-1.5 text-sm text-(--a-e4d3ff) hover:bg-(--s-342749) ' + className}>
      <CircleHelp size={16} aria-hidden="true" /><span className="hidden sm:inline">{rotulo}</span></button>
    {/* Vai para o <body>: dentro de um cabeçalho com desfoque, o “fixed” ficaria preso nele. */}
    {aberto && createPortal(<div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-3 sm:items-center" onMouseDown={e => { if (e.target === e.currentTarget) setAberto(false) }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ajuda-tela-titulo" onKeyDown={e => { if (e.key === 'Escape') setAberto(false) }}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-(--a-8b6cba) bg-(--s-19152a) p-5 text-(--a-f2ebff) shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-(--s-3a2a5c) text-xl" aria-hidden="true">❔</span>
          <div className="min-w-0 flex-1"><h2 id="ajuda-tela-titulo" className="text-lg font-bold">{titulo}</h2>
            {intro && <p className="mt-0.5 text-sm text-(--a-c4b6d4)">{intro}</p>}</div>
          <button ref={fechar} type="button" onClick={() => setAberto(false)} aria-label="Fechar ajuda" className="rounded-lg p-1 text-(--a-b4aeca) hover:bg-white/10"><X size={18} /></button>
        </div>
        <ol className="mt-4 space-y-2">
          {passos.map((p, i) => <li key={i} className="flex gap-3 rounded-xl border border-(--a-3d3152) bg-(--s-201a32) p-3">
            <span className="text-xl leading-none" aria-hidden="true">{p.icone}</span>
            <span className="min-w-0"><span className="block text-sm font-semibold">{p.titulo}</span><span className="block text-sm text-(--a-cfc0df)">{p.texto}</span></span>
          </li>)}
        </ol>
        <p className="mt-4 text-center text-xs text-(--a-a99bbb)">Mais detalhes no <Link href="/guia" className="underline">Guia da plataforma</Link> e nos <Link href="/tutorial" className="underline">Tutoriais</Link>.</p>
      </div>
    </div>, document.body)}
  </>
}
