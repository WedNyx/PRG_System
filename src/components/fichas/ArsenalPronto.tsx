'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import NaTela from '@/components/NaTela'
import ArteItem from './ArteItem'
import { ARSENAL, ESTILOS_ARSENAL, type EstiloArsenal, type ItemArsenal } from '@/lib/arsenal'
import { CATEGORIAS_ITEM } from '@/lib/sistemas/inventario'

/**
 * Arsenal pronto (v0.35.3): itens genéricos por estilo (medieval, faroeste, moderno, ficção científica e terror).
 * Toque em “Adicionar” e uma cópia entra no inventário; depois dá para editar tudo.
 */
export default function ArsenalPronto({ adicionar, fechar }: { adicionar: (x: ItemArsenal) => void; fechar: () => void }) {
  const [estilo, setEstilo] = useState<EstiloArsenal>('medieval')
  const [busca, setBusca] = useState('')
  const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const lista = busca.trim()
    ? Object.values(ARSENAL).flat().filter((x, i, todos) => norm(x.nome + ' ' + x.descricao).includes(norm(busca.trim())) && todos.findIndex(y => y.nome === x.nome && y.icone === x.icone) === i)
    : ARSENAL[estilo]
  return <NaTela><div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-2 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-label="Arsenal pronto" className="max-h-[96dvh] w-full min-w-0 max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-(--a-6d5690) bg-(--s-1b1529) p-3 text-sm text-(--a-f2ebff) sm:p-5">
      <div className="sticky top-0 z-10 -mx-1 mb-3 space-y-2 bg-(--s-1b1529) px-1 py-2">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">📦 Arsenal pronto</h2>
          <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1.5 hover:bg-(--s-38294d)"><X size={18} /></button></div>
        <input type="search" value={busca} onChange={e => setBusca(e.target.value)} aria-label="Buscar no arsenal" placeholder="Buscar em todos os estilos: pistola, poção, escudo…"
          className="w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white" />
        {!busca.trim() && <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Estilo do arsenal">
          {ESTILOS_ARSENAL.map(e => <button key={e.id} type="button" aria-pressed={estilo === e.id} onClick={() => setEstilo(e.id)}
            className={'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs ' + (estilo === e.id ? 'border-amber-300 bg-amber-300 font-semibold text-black' : 'border-(--a-55456e)')}>
            {e.nome}</button>)}
        </div>}
      </div>
      <p className="mb-3 text-xs text-(--a-c4b6d4)">Itens genéricos com dados sugeridos, sem regra de nenhum livro. Depois de adicionar, edite o que quiser (dano, peso, ícone, foto).</p>
      {!lista.length && <p className="text-sm text-(--a-bfb2cf)">Nada encontrado.</p>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {lista.map(x => <li key={x.nome + x.icone} className="flex items-center gap-3 rounded-xl bg-(--s-171325) p-2.5">
          <ArteItem item={{ nome: x.nome, categoria: x.categoria, iconeBiblioteca: x.icone }} tamanho={44} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{x.nome}</span>
            <span className="block text-[11px] text-(--a-c4b6d4)">{CATEGORIAS_ITEM.find(c => c.id === x.categoria)?.icone} {[x.dano && '🎲 ' + x.dano, x.alcance && x.alcance + ' m', x.peso ? x.peso.toLocaleString('pt-BR') + ' kg' : ''].filter(Boolean).join(' · ')}</span>
            <span className="block text-[11px] text-(--a-a998bd)">{x.descricao}</span>
          </span>
          <button type="button" onClick={() => adicionar(x)} aria-label={'Adicionar ' + x.nome} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg bg-(--a-7654bb) px-2.5 py-1.5 text-xs font-semibold"><Plus size={13} /> Adicionar</button>
        </li>)}
      </ul>
      <p className="mt-3 text-[11px] text-(--a-a998bd)">Ícones: <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer" className="underline">Game-Icons.net</a> (Lorc, Delapouite e outros autores, CC BY 3.0).</p>
    </div>
  </div></NaTela>
}
