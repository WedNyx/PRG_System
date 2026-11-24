'use client'

import { useState } from 'react'
import { Dice5, X } from 'lucide-react'

const PRONTOS = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100', '2d6']

/**
 * Botão flutuante para rolar qualquer expressão a qualquer momento, sem precisar achar um campo na ficha
 * (v0.36.9, como a Assistência de dados da Assimilação, só que para qualquer sistema e com dados comuns).
 */
export default function BotaoRolarFlutuante({ rolar }: { rolar: (expressao: string, rotulo: string) => void }) {
  const [aberto, setAberto] = useState(false)
  const [expr, setExpr] = useState('1d20')
  const rolarAgora = () => { const e = expr.trim(); if (e) rolar(e, 'Rolagem livre') }
  return <>
    <button type="button" aria-label="Rolar dados" aria-expanded={aberto} onClick={() => setAberto(x => !x)}
      className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-(--a-8b68c4) bg-(--s-171325) text-(--a-c7a8ff) shadow-lg hover:bg-(--s-2b2140)">
      <Dice5 size={26} aria-hidden="true" />
    </button>
    {aberto && <aside aria-label="Rolar dados" className="fixed bottom-40 right-3 z-40 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-(--a-62527e) bg-(--s-171325) p-3 text-white shadow-xl">
      <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold">🎲 Rolar dados</h2>
        <button type="button" aria-label="Fechar" onClick={() => setAberto(false)} className="rounded-lg p-1 hover:bg-(--s-2b2140)"><X size={16} /></button></div>
      <form onSubmit={e => { e.preventDefault(); rolarAgora() }} className="flex gap-2">
        <input value={expr} onChange={e => setExpr(e.target.value)} maxLength={60} aria-label="Expressão de dados" placeholder="Ex.: 2d6+3"
          className="min-w-0 flex-1 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-sm text-white" />
        <button type="submit" disabled={!expr.trim()} className="rounded-lg bg-(--a-7654bb) px-3 text-sm font-semibold disabled:opacity-40">Rolar</button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">{PRONTOS.map(x => <button key={x} type="button" onClick={() => setExpr(x)}
        className="rounded-lg border border-(--a-55456e) px-2 py-1 text-xs hover:bg-(--s-2b2140)">{x}</button>)}</div>
    </aside>}
  </>
}
