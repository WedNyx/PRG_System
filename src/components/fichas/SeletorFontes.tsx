'use client'

/**
 * Configuração do mestre: edição-base 2014 ou 2024 e suplementos oficiais.
 * Selecionar um livro COMERCIAL autoriza seu uso, não injeta regras protegidas.
 */
import { useState } from 'react'
import { BookOpen, Plus, Search, X } from 'lucide-react'
import { SUPLEMENTOS_DND, LIVROS_BASE_DND, compativelLivroDnd, type LivroBaseDnd } from '@/lib/sistemas/dndLivros'

type Props = {
  baseLivro: LivroBaseDnd
  fontes: string[]
  extras: string[]
  onBaseChange: (base: LivroBaseDnd) => void
  onChange: (fontes: string[], extras: string[]) => void
}
const grupos = [
  { id: 'suplemento', nome: 'Suplementos de regras' },
  { id: 'cenario', nome: 'Cenários' },
  { id: 'aventura', nome: 'Aventuras com opções adicionais' },
  { id: 'mestre', nome: 'Livros do Mestre' },
  { id: 'referencia', nome: 'Referência e criaturas' },
] as const

export default function SeletorFontes({ baseLivro, fontes, extras, onBaseChange, onChange }: Props) {
  const [novo, setNovo] = useState('')
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState(false)
  const marcar = (id: string, on: boolean) =>
    onChange(on ? [...new Set([...fontes, id])] : fontes.filter(x => x !== id), extras)
  const mudarBase = (base: LivroBaseDnd) => {
    if (base === baseLivro) return
    onBaseChange(base)
    // Não levar automaticamente suplementos exclusivos da revisão 2024 para 2014.
    onChange(fontes.filter(id => id === 'phb2014' ? base === 'phb2024' : compativelLivroDnd(id, base)), extras)
  }
  const adicionar = () => {
    const n = novo.trim().slice(0, 60)
    if (n && extras.length < 10 && !extras.includes(n)) onChange(fontes, [...extras, n])
    setNovo('')
  }
  const listados = SUPLEMENTOS_DND.filter(f => compativelLivroDnd(f.id, baseLivro) &&
    (!busca.trim() || [f.titulo, f.versao, f.descricao, String(f.ano)].join(' ').toLocaleLowerCase('pt-BR')
      .includes(busca.trim().toLocaleLowerCase('pt-BR'))))
  const marcados = fontes.filter(f => compativelLivroDnd(f, baseLivro)).length +
    (baseLivro === 'phb2024' && fontes.includes('phb2014') ? 1 : 0)
  return <fieldset className="space-y-4 rounded-2xl border border-(--a-55456e) p-3 sm:p-4">
    <legend className="px-1 font-semibold text-white">📚 Livros e edição da campanha de D&D</legend>
    <p className="text-xs text-(--a-c4b6d4)">
      Escolha primeiro o <strong>Livro do Jogador</strong> que define as regras da campanha.
      Em seguida, libere os suplementos que o jogador poderá selecionar na própria ficha.
      Cada livro mostra título, ano e versão. A seleção é salva pelo mestre.
    </p>
    <div className="grid gap-2 sm:grid-cols-2">
      {LIVROS_BASE_DND.map(b => <label key={b.id} className={'flex cursor-pointer gap-2 rounded-xl border p-3 ' +
        (baseLivro === b.id ? 'border-(--a-b99bff) bg-(--s-2b2140)' : 'border-(--a-55456e) bg-(--s-171325)')}>
        <input type="radio" name="livro-base-dnd" value={b.id} checked={baseLivro === b.id} onChange={() => mudarBase(b.id)}
          className="mt-1 accent-(--a-b99bff)" />
        <span className="min-w-0">
          <strong className="block text-sm">{b.titulo}</strong>
          <span className="block text-xs font-semibold text-(--a-d3adf0)">{b.versao}</span>
          <span className="mt-1 block text-[11px] text-(--a-c4b6d4)">{b.descricao}</span>
        </span>
      </label>)}
    </div>
    <p className="rounded-lg border border-amber-400/30 bg-amber-950/15 p-2 text-[11px] text-amber-100">
      <strong>Importante:</strong> as regras automáticas atuais são as do SRD 5.2.1 (2024).
      Selecionar 2014 troca a criação para o modelo legado com referência/manual; o sistema não aplica a progressão de 2024 como se fosse 2014.
      Se a campanha já tem fichas, revise-as antes de mudar a edição-base.
    </p>

    <div className="space-y-2">
      <button type="button" onClick={() => setExpandido(x => !x)}
        aria-expanded={expandido} className="flex w-full items-center justify-between rounded-xl border border-(--a-62527e) bg-(--s-171325) p-3 text-left text-sm font-semibold">
        <span className="flex items-center gap-2"><BookOpen size={16} /> Suplementos oficiais liberados ({marcados})</span>
        <span aria-hidden>{expandido ? '▴' : '▾'}</span>
      </button>
      {expandido && <div className="space-y-3">
        <label className="flex items-center gap-2 rounded-xl border border-(--a-5e4b78) bg-(--s-151123) px-3">
          <Search size={15} className="shrink-0" />
          <input type="search" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Pesquisar título, ano, edição ou conteúdo..." className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none" />
        </label>
        {baseLivro === 'phb2024' && <label className="flex items-start gap-2 rounded-xl border border-(--a-55456e) p-3">
          <input type="checkbox" checked={fontes.includes('phb2014')} onChange={e => marcar('phb2014', e.target.checked)} className="mt-1" />
          <span><strong className="block text-sm">Livro do Jogador — Player’s Handbook · 5e (2014)</strong>
            <span className="block text-[11px] text-(--a-c4b6d4)">Habilitar opções antigas como legado na mesa 2024, sujeito à revisão do mestre. Não substitui a edição-base.</span>
          </span>
        </label>}
        {grupos.map(g => {
          const livros = listados.filter(x => x.categoria === g.id)
          return livros.length ? <div key={g.id} className="space-y-2">
            <h3 className="text-sm font-semibold text-(--a-d3adf0)">{g.nome}</h3>
            <div className="grid gap-2 lg:grid-cols-2">{livros.map(f => <label key={f.id}
              className={'flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 ' +
                (fontes.includes(f.id) ? 'border-(--a-b79aff) bg-(--s-2b2140)' : 'border-(--a-55456e) bg-(--s-171325)')}>
              <input type="checkbox" checked={fontes.includes(f.id)} onChange={e => marcar(f.id, e.target.checked)}
                className="mt-1 accent-(--a-b99bff)" />
              <span className="min-w-0">
                <strong className="block text-sm">{f.titulo}</strong>
                <span className="block text-xs text-(--a-d3adf0)">{f.versao} · {f.ano}</span>
                <span className="block text-[11px] text-(--a-c4b6d4)">{f.descricao}</span>
                <span className="block text-[10px] text-amber-200">Regras exclusivas: referência à publicação, sem automação.</span>
              </span>
            </label>)}</div>
          </div> : null
        })}
        {listados.length === 0 && <p className="text-xs text-(--a-c4b6d4)">Nenhum suplemento encontrado.</p>}
      </div>}
    </div>
    <div className="space-y-2 border-t border-(--a-55456e) pt-3">
      <p className="text-sm font-medium">Materiais próprios do grupo</p>
      <p className="text-[11px] text-(--a-c4b6d4)">Registros livres: não ativam regras oficiais nem se confundem com livros verificados.</p>
      {extras.length > 0 && <ul className="flex flex-wrap gap-1.5">{extras.map(x => <li key={x} className="inline-flex items-center gap-1 rounded-full border border-(--a-5e4b78) px-2.5 py-1 text-xs">{x}
        <button type="button" aria-label={'Tirar ' + x} onClick={() => onChange(fontes, extras.filter(y => y !== x))} className="rounded-full p-0.5 hover:bg-(--s-2b2140)"><X size={12} /></button></li>)}</ul>}
      {extras.length < 10 && <div className="flex gap-2">
        <input value={novo} maxLength={60} onChange={e => setNovo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }}
          placeholder="Ex.: Suplemento caseiro da mesa…" className="min-w-0 flex-1 rounded-xl border border-(--a-70588c) bg-(--s-151123) p-2 text-sm text-white" />
        <button type="button" onClick={adicionar} disabled={!novo.trim()} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-(--a-70588c) px-3 text-sm disabled:opacity-40"><Plus size={14} /> Incluir</button>
      </div>}
    </div>
  </fieldset>
}
