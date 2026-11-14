'use client'

import { ImagemCapa } from '@/components/sistemas/CapaDoSistema'
import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { GRUPOS_SISTEMA, criarEAbrirFicha } from '@/lib/sistemas/criar'
import { useOpcoesSistema } from '@/lib/sistemas/cliente'
import NaTela from '@/components/NaTela'
import { LIVROS_BASE_DND, type LivroBaseDnd } from '@/lib/sistemas/dndLivros'

/** Janela para escolher o sistema antes de criar uma ficha. */
export default function EscolherSistema({ aventureiroId, onFechar }: { aventureiroId: string; onFechar: () => void }) {
  const [criando, setCriando] = useState('')
  const [edicaoDndAberta, setEdicaoDndAberta] = useState(true)
  const [erro, setErro] = useState('')
  const { opcoes } = useOpcoesSistema()
  async function criar(id: string, livroBase?: LivroBaseDnd) {
    setCriando(id + (livroBase ?? '')); setErro('')
    try { await criarEAbrirFicha(id, aventureiroId, livroBase) } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível criar a ficha.'); setCriando('') }
  }
  return <NaTela><div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Escolha o sistema da ficha">
    <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-(--a-6d5690) bg-(--s-1b1529) p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Qual sistema?</h2>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded-lg p-2 hover:bg-(--s-38294d)"><X size={20} /></button></div>
      <p className="mt-1 text-sm text-(--a-c4b6d4)">Escolha o sistema de RPG do novo personagem.</p>
      {erro && <p role="alert" className="mt-3 text-sm text-red-200">{erro}</p>}
      {GRUPOS_SISTEMA.map(g => <section key={g.id} className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-(--a-d3adf0)">{g.nome}</h3>
        <ul className="mt-2 space-y-2">{opcoes.filter(o => o.grupo === g.id).map(o => <li key={o.id}>
          <button type="button" disabled={!!criando} onClick={() => o.id === 'dnd5e-srd' ? setEdicaoDndAberta(x => !x) : void criar(o.id)} className="flex w-full items-center gap-3 rounded-xl border border-(--a-55456e) bg-(--s-201a32) p-3 text-left hover:border-(--a-b79aff) disabled:opacity-60">
            <span className="relative h-11 w-20 shrink-0 overflow-hidden rounded-lg border border-(--a-55456e)"><ImagemCapa id={o.id} nome={o.nome} capa={'capa' in o ? (o.capa as string | null) : null} />
              {criando.startsWith(o.id) && <span className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="animate-spin text-(--a-c5a7ff)" size={20} /></span>}</span>
            <span className="text-sm font-semibold">{o.id === 'dnd5e-srd' ? 'D&D — escolha 2014 ou 2024' : o.nome}</span>
          </button>
          {o.id === 'dnd5e-srd' && edicaoDndAberta && <div className="mt-2 grid gap-2 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3 sm:grid-cols-2">
            {LIVROS_BASE_DND.map(livro => <button key={livro.id} type="button" disabled={!!criando}
              onClick={() => void criar(o.id, livro.id)}
              className="rounded-xl border border-(--a-62527e) bg-(--s-201a32) px-3 py-3 text-left text-sm hover:border-(--a-b79aff) disabled:opacity-60">
              <span className="block font-bold">{livro.id === 'phb2014' ? 'D&D 2014 · 5e' : 'D&D 2024 · 5.5e'}</span>
              <span className="mt-1 block text-xs text-(--a-c4b6d4)">{livro.id === 'phb2014'
                ? 'Raças, sub-raças, antecedentes e progressão das regras clássicas.'
                : 'Espécies, antecedentes e progressão das regras revisadas.'}</span>
              {criando === o.id + livro.id && <span className="mt-1 block text-xs">Criando ficha…</span>}
            </button>)}
            <p className="text-xs text-(--a-c4b6d4) sm:col-span-2">A edição escolhida já será salva na ficha. Dentro dela, você poderá consultar os livros e suplementos.</p>
          </div>}
          </li>)}</ul>
      </section>)}
    </div>
  </div></NaTela>
}
