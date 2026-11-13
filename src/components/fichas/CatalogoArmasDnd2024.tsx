'use client'

/**
 * Biblioteca de armas da ficha D&D 2024.
 * Armas abertas (SRD) têm todos os dados; suplementos pagos são referências
 * catalogadas por obra, sem inventar efeitos exclusivos de um livro.
 */
import { useState } from 'react'
import { BookOpen, Search, Swords, X } from 'lucide-react'
import NaTela from '@/components/NaTela'
import ArteItem from './ArteItem'
import { ARMAS_DND_2024, pesoEmKgArmaDnd, type ArmaDnd2024 } from '@/lib/sistemas/dnd2024Armas'
import { ARMAS_DND_EXPANDIDAS, LIVROS_ARMAS_DND, type ReferenciaArmaDnd } from '@/lib/sistemas/dnd2024ArmasExpandidas'

type Props = {
  adicionar: (arma: ArmaDnd2024) => void
  adicionarReferencia: (arma: ReferenciaArmaDnd, baseId?: string) => void
  fechar: () => void
}
type Filtro = 'todas' | 'basicas' | 'moderna' | 'futurista' | 'cenario' | 'magica' | 'indice'
const filtros: { id: Filtro; nome: string }[] = [
  { id: 'todas', nome: 'Todas' }, { id: 'basicas', nome: '2024 · SRD' },
  { id: 'moderna', nome: 'Modernas' }, { id: 'futurista', nome: 'Futuristas' },
  { id: 'cenario', nome: 'Cenários' }, { id: 'magica', nome: 'Mágicas' },
  { id: 'indice', nome: 'A conferir' },
]
const simplificar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const TOTAL = ARMAS_DND_2024.length + ARMAS_DND_EXPANDIDAS.length

export default function CatalogoArmasDnd2024({ adicionar, adicionarReferencia, fechar }: Props) {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [livro, setLivro] = useState('')
  const [limite, setLimite] = useState(40)
  const [baseEscolhida, setBaseEscolhida] = useState<Record<string, string>>({})
  const procurar = (texto: string) => { setBusca(texto); setLimite(40) }
  const filtrar = (valor: Filtro) => { setFiltro(valor); setLimite(40) }
  const trocarLivro = (valor: string) => { setLivro(valor); setLimite(40) }

  const bases = ARMAS_DND_2024.filter(a => (!livro || livro === 'Livro do Jogador 2024 / SRD 5.2.1') &&
    (filtro === 'todas' || filtro === 'basicas') &&
    simplificar([a.nome, a.grupo, a.tipo, a.maestria, ...a.propriedades].join(' ')).includes(simplificar(busca.trim())))
  const extras = ARMAS_DND_EXPANDIDAS.filter(a => (!livro || a.livro === livro) &&
    (filtro === 'todas' || a.classe === filtro) &&
    simplificar([a.nome, a.livro, a.classe, a.dano ?? '', a.tipoDano ?? ''].join(' ')).includes(simplificar(busca.trim())))
  const lista = [...bases.map(a => ({ especie: 'base' as const, arma: a })),
    ...extras.map(a => ({ especie: 'extra' as const, arma: a }))]
  const mostrados = lista.slice(0, limite)

  return <NaTela>
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-2 sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
      <section role="dialog" aria-modal="true" aria-label="Biblioteca de armas de D&D"
        className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-(--a-62527e) bg-(--s-201a32) text-white shadow-2xl">
        <header className="flex items-start justify-between gap-2 border-b border-(--a-55456e) p-3 sm:p-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Swords size={19} /> Arsenal de D&D</h2>
            <p className="mt-1 text-xs text-(--a-c4b6d4)">{TOTAL} referências: 38 armas básicas + suplementos e itens mágicos catalogados.</p>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar arsenal" className="rounded-lg p-2 hover:bg-(--s-34294f)"><X size={19} /></button>
        </header>
        <div className="space-y-3 border-b border-(--a-55456e) px-3 py-3 sm:px-4">
          <label className="flex items-center gap-2 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-3">
            <Search size={16} className="shrink-0 text-(--a-c4b6d4)" />
            <input type="search" placeholder="Procure arma, maestria, dano ou livro..."
              value={busca} onChange={e => procurar(e.target.value)}
              className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none" />
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Tipos de armas">
            {filtros.map(c => <button type="button" key={c.id} aria-pressed={filtro === c.id} onClick={() => filtrar(c.id)}
              className={'shrink-0 rounded-full border px-3 py-1.5 text-xs ' +
                (filtro === c.id ? 'border-(--a-b99bff) bg-(--s-3a2c58) font-semibold' : 'border-(--a-62527e) hover:bg-(--s-34294f)')}>
              {c.nome}
            </button>)}
          </div>
          <label className="flex items-center gap-2 text-xs text-(--a-c4b6d4)">
            <BookOpen size={14} /> Fonte
            <select value={livro} onChange={e => trocarLivro(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-white">
              <option value="">Todos os livros</option>
              <option value="Livro do Jogador 2024 / SRD 5.2.1">Livro do Jogador 2024 / SRD 5.2.1</option>
              {LIVROS_ARMAS_DND.map(nome => <option key={nome} value={nome}>{nome}</option>)}
            </select>
          </label>
        </div>
        <div className="overflow-y-auto px-3 py-3 sm:px-4">
          <p className="mb-3 text-xs text-(--a-c4b6d4)">
            {lista.length} resultado(s) · exibindo {mostrados.length}. Modelos e variantes mágicas podem compartilhar a mesma arma base.
          </p>
          <ul className="grid gap-2 md:grid-cols-2">
            {mostrados.map(reg => reg.especie === 'base' ? (() => {
              const a = reg.arma
              return <li key={'base-'+a.id} className="flex gap-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
                <ArteItem item={{ nome: a.nome, categoria: 'arma' }} tamanho={56} estiloDnd />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <strong className="text-sm">{a.nome}</strong>
                    <span className="text-xs font-bold text-(--a-ed9cd8)">{a.dano} · {a.tipo}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-(--a-c4b6d4)">{a.grupo.replace('-', ' · ')} · {a.preco} · {pesoEmKgArmaDnd(a).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg</p>
                  <p className="mt-1 text-xs text-(--a-cfc0df)">{a.propriedades.join(' · ') || 'Sem propriedades'}
                    {a.versatil ? ' · Versátil: ' + a.versatil : ''}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-(--a-d3adf0)">Maestria: {a.maestria}</span>
                    <button type="button" className="rounded-lg border border-(--a-b99bff) bg-(--s-2b2140) px-3 py-2 text-xs font-semibold hover:bg-(--s-34294f)"
                      onClick={() => adicionar(a)}>+ Adicionar</button>
                  </div>
                </div>
              </li>
            })() : (() => {
              const a = reg.arma
              const baseId = baseEscolhida[a.id] ?? a.armaBase ?? ''
              return <li key={a.id} className="flex gap-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
                <ArteItem item={{ nome: a.nome, categoria: 'arma', magico: a.classe === 'magica' }} tamanho={56} estiloDnd />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong className="text-sm">{a.nome}</strong>
                    <span className="rounded-md border border-(--a-62527e) px-1.5 py-0.5 text-[10px] text-(--a-d3adf0)">
                      {a.classe === 'magica' ? '✨ Mágica' : a.classe === 'indice' ? '⚠️ Conferir' : a.classe === 'cenario' ? '🌍 Cenário' : '🔫 ' + a.classe}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-(--a-c4b6d4)">{a.livro} · {a.edicao}</p>
                  {a.dano && <p className="mt-1 text-xs font-semibold text-(--a-ed9cd8)">{a.dano} · {a.tipoDano}</p>}
                  {!a.dano && <p className="mt-1 text-[11px] text-amber-200">Regras exclusivas: consulte a obra; sem dano mágico presumido</p>}
                  {!a.dano && <label className="mt-2 block text-[11px] text-(--a-c4b6d4)">
                    Modelo físico para rolagem (opcional)
                    <select value={baseId} onChange={e => setBaseEscolhida(o => ({ ...o, [a.id]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-1.5 text-xs text-white">
                      <option value="">Definir dano depois</option>
                      {ARMAS_DND_2024.map(x => <option key={x.id} value={x.id}>{x.nome} · {x.dano}</option>)}
                    </select>
                  </label>}
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => adicionarReferencia(a, baseId || undefined)}
                      className="rounded-lg border border-(--a-b99bff) bg-(--s-2b2140) px-3 py-2 text-xs font-semibold hover:bg-(--s-34294f)">
                      + Adicionar
                    </button>
                  </div>
                </div>
              </li>
            })())}
          </ul>
          {lista.length === 0 && <p className="rounded-lg border border-dashed border-(--a-62527e) p-4 text-sm text-(--a-c4b6d4)">Nenhuma arma encontrada. Experimente limpar a busca ou os filtros.</p>}
          {lista.length > mostrados.length && <button type="button" onClick={() => setLimite(n => n + 40)}
            className="mt-3 w-full rounded-xl border border-(--a-62527e) bg-(--s-171325) p-3 text-sm font-semibold hover:bg-(--s-34294f)">
            Ver mais {Math.min(40, lista.length - mostrados.length)} itens
          </button>}
        </div>
        <footer className="border-t border-(--a-55456e) px-3 py-2 text-[11px] text-(--a-c4b6d4) sm:px-4">
          SRD: dados de jogo disponíveis · Suplementos pagos: referência para preencher com o livro. O índice não é exaustivo; confira a edição e o acesso com o mestre.
        </footer>
      </section>
    </div>
  </NaTela>
}
