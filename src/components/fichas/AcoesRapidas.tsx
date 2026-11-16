'use client'

import { Zap } from 'lucide-react'
import ArteItem from './ArteItem'
import { acoesRapidas } from '@/lib/sistemas/inventario'
import type { DadosFicha } from '@/lib/sistemas/tipos'

/**
 * Ações rápidas (v0.35.3): no topo da ficha, as armas e itens equipados com rolagem e os poderes com dados.
 * Um toque rola (numa campanha, vai também para o chat da mesa).
 */
export default function AcoesRapidas({ d, rolar, irInventario }: { d: DadosFicha; rolar: (expr: string, rotulo: string) => Promise<void>; irInventario?: () => void }) {
  const acoes = acoesRapidas(d)
  const btn = 'inline-flex min-h-9 items-center gap-1 rounded-lg border border-(--a-5e4b78) bg-(--s-171325) px-2.5 py-1 text-xs hover:bg-(--s-34294f)'
  return <section aria-labelledby="titulo-acoes" className="rounded-2xl border border-(--ficha-acento)/50 bg-(--s-201a32) p-4">
    <h2 id="titulo-acoes" className="mb-3 flex items-center gap-2 font-bold text-(--ficha-acento) [font-family:var(--ficha-fonte)]"><Zap size={18} aria-hidden /> Ações rápidas</h2>
    {!acoes.length && <p className="text-sm text-(--a-c4b6d4)">Equipe uma arma ou um item com rolagem no inventário (ou crie um poder com dados) e ele aparece aqui para rolar com um toque.
      {irInventario && <> <button type="button" onClick={irInventario} className="underline">Abrir o inventário</button></>}</p>}
    <ul className="grid gap-2 sm:grid-cols-2">
      {acoes.map(x => <li key={x.id} className="flex items-center gap-3 rounded-xl bg-(--s-171325) p-2.5">
        {x.item ? <ArteItem item={x.item} tamanho={40} /> : <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-(--a-8b6cba) text-lg">✨</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{x.nome}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {x.rolagens.map(r => <button key={r.nome + r.expr} type="button" className={btn} onClick={() => void rolar(r.expr, `${x.nome} · ${r.nome}`)} aria-label={`Rolar ${r.nome} de ${x.nome}: ${r.expr}`}>
              🎲 {r.nome} <span className="tabular-nums text-(--a-c4b6d4)">{r.expr}</span></button>)}
            {x.rolagens.length > 1 && <button type="button" className={btn + ' border-(--ficha-acento)/60'} onClick={async () => { for (const r of x.rolagens) await rolar(r.expr, `${x.nome} · ${r.nome}`) }}>Rolar tudo</button>}
          </span>
        </span>
      </li>)}
    </ul>
  </section>
}
