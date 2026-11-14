'use client'

/**
 * Um arsenal por publicação selecionada. Armas-base de 2014 (SRD 5.1) e 2024
 * (SRD 5.2.1) têm tabelas e rolagens distintas. Suplementos pagos são referências,
 * nunca benefícios mágicos inventados pela plataforma.
 */
import { useState } from 'react'
import { BookOpen, Search, Swords, X } from 'lucide-react'
import NaTela from '@/components/NaTela'
import ArteItem from './ArteItem'
import { pesoEmKgArmaDnd, type ArmaDnd2024 } from '@/lib/sistemas/dnd2024Armas'
import { ARMAS_DND_EXPANDIDAS, type ReferenciaArmaDnd } from '@/lib/sistemas/dnd2024ArmasExpandidas'
import { ARMAS_BASE_DND, arsenaisPermitidosDnd, referenciaPertenceAoLivro, rotuloArsenalDnd } from '@/lib/sistemas/dndArsenais'
import type { LivroBaseDnd } from '@/lib/sistemas/dndLivros'

type Props = {
  edicao: LivroBaseDnd
  livrosAtivos: string[]
  adicionar: (arma: ArmaDnd2024) => void
  adicionarReferencia: (arma: ReferenciaArmaDnd, baseId?: string) => void
  fechar: () => void
}
const grupos = [
  { id: 'todas', nome: 'Todas' }, { id: 'simples-corpo', nome: 'Simples · corpo a corpo' },
  { id: 'simples-distancia', nome: 'Simples · distância' },
  { id: 'marcial-corpo', nome: 'Marciais · corpo a corpo' }, { id: 'marcial-distancia', nome: 'Marciais · distância' },
  { id: 'moderna', nome: 'Modernas' }, { id: 'futurista', nome: 'Futuristas' },
  { id: 'cenario', nome: 'Cenário' }, { id: 'magica', nome: 'Mágicas' },
] as const
type Filtro = (typeof grupos)[number]['id']
const simplificar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const ehBase = (livro: string): livro is LivroBaseDnd => livro === 'phb2014' || livro === 'phb2024'

export default function CatalogoArmasDnd2024({ edicao, livrosAtivos, adicionar, adicionarReferencia, fechar }: Props) {
  const [livro, setLivro] = useState<string>(edicao)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [limite, setLimite] = useState(40)
  const [baseEscolhida, setBaseEscolhida] = useState<Record<string, string>>({})
  const livros = arsenaisPermitidosDnd(edicao, livrosAtivos)
  const ativo = livros.includes(livro) ? livro : edicao
  const filtroTexto = simplificar(busca.trim())
  const bases = ehBase(ativo)
    ? ARMAS_BASE_DND[ativo].filter(a =>
        (filtro === 'todas' || filtro === a.grupo) &&
        simplificar([a.nome, a.grupo, a.tipo, ...a.propriedades].join(' ')).includes(filtroTexto))
    : []
  const refs = ehBase(ativo) ? [] : ARMAS_DND_EXPANDIDAS.filter(a =>
    referenciaPertenceAoLivro(a, ativo) &&
    (filtro === 'todas' || a.classe === filtro) &&
    simplificar([a.nome, a.livro, a.classe, a.dano ?? '', a.tipoDano ?? ''].join(' ')).includes(filtroTexto))
  const lista = [...bases.map(a => ({ tipo: 'base' as const, arma: a })),
    ...refs.map(a => ({ tipo: 'referencia' as const, arma: a }))]
  const mostrados = lista.slice(0, limite)
  const baseParaReferencia = ARMAS_BASE_DND[edicao]
  const trocarLivro = (id: string) => { setLivro(id); setFiltro('todas'); setBusca(''); setLimite(40) }

  return <NaTela>
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-2 sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
      <section role="dialog" aria-modal="true" aria-label="Arsenal por livro de D&D"
        className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-(--a-62527e) bg-(--s-201a32) text-white shadow-2xl">
        <header className="flex items-start justify-between gap-2 border-b border-(--a-55456e) p-3 sm:p-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Swords size={19} /> Arsenais por livro · D&D</h2>
            <p className="mt-1 text-xs text-(--a-c4b6d4)">Escolha a publicação: cada arsenal mostra só as armas daquela edição ou suplemento liberado.</p>
          </div>
          <button type="button" onClick={fechar} aria-label="Fechar arsenal" className="shrink-0 rounded-lg p-2 hover:bg-(--s-34294f)"><X size={19} /></button>
        </header>
        <div className="space-y-3 border-b border-(--a-55456e) px-3 py-3 sm:px-4">
          <label className="block text-xs font-semibold text-(--a-d3adf0)">
            <span className="mb-1 flex items-center gap-1.5"><BookOpen size={15} /> Livro e versão do arsenal</span>
            <select value={ativo} onChange={e => trocarLivro(e.target.value)}
              className="w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2.5 text-sm text-white">
              {livros.map(id => <option key={id} value={id}>{rotuloArsenalDnd(id)}</option>)}
            </select>
          </label>
          <p className="text-xs text-(--a-c4b6d4)">{ehBase(ativo)
            ? ativo === 'phb2014'
              ? 'SRD 5.1 · armas clássicas de 2014; sem Maestria de Armas. A Rede não tem rolagem de dano.'
              : 'SRD 5.2.1 · armas de 2024, com maestrias e rolagens de crítico conforme a revisão.'
            : 'Itens do suplemento: referências à obra escolhida. Efeitos mágicos adicionais exigem consultar o livro com o mestre.'}</p>
          <label className="flex items-center gap-2 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-3">
            <Search size={16} className="shrink-0 text-(--a-c4b6d4)" />
            <input type="search" placeholder="Buscar arma, categoria, dano..."
              value={busca} onChange={e => { setBusca(e.target.value); setLimite(40) }}
              className="w-full min-w-0 bg-transparent py-2.5 text-sm outline-none" />
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Filtrar armas por tipo">
            {grupos.filter(g => g.id === 'todas' || (ehBase(ativo) ? g.id.startsWith('simples') || g.id.startsWith('marcial') : ['moderna','futurista','cenario','magica'].includes(g.id)))
              .map(g => <button type="button" key={g.id} aria-pressed={filtro === g.id}
                onClick={() => { setFiltro(g.id); setLimite(40) }}
                className={'shrink-0 rounded-full border px-3 py-1.5 text-xs ' +
                  (filtro === g.id ? 'border-(--a-b99bff) bg-(--s-3a2c58) font-semibold' : 'border-(--a-62527e) hover:bg-(--s-34294f)')}>
                {g.nome}
              </button>)}
          </div>
        </div>
        <div className="overflow-y-auto px-3 py-3 sm:px-4">
          <p className="mb-3 text-xs text-(--a-c4b6d4)">{lista.length} resultado(s) nesta publicação · mostrando {mostrados.length}.</p>
          <ul className="grid gap-2 md:grid-cols-2">
            {mostrados.map(reg => reg.tipo === 'base' ? (() => {
              const a = reg.arma
              return <li key={a.id} className="flex gap-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
                <ArteItem item={{ nome: a.nome, categoria: 'arma' }} tamanho={56} estiloDnd />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-sm">{a.nome}</strong>
                    <span className="text-xs font-bold text-(--a-ed9cd8)">{a.dano || 'Sem dano'} · {a.tipo}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-(--a-c4b6d4)">{a.grupo.replace('-', ' · ')} · {a.preco} · {pesoEmKgArmaDnd(a).toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg</p>
                  <p className="mt-1 text-xs text-(--a-cfc0df)">{a.propriedades.join(' · ') || 'Sem propriedades'}{a.versatil ? ' · Versátil ' + a.versatil : ''}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-(--a-d3adf0)">{ativo === 'phb2024' ? 'Maestria: ' + a.maestria : 'Regras 2014 · sem maestria'}</span>
                    <button type="button" onClick={() => adicionar(a)}
                      className="min-h-10 rounded-lg border border-(--a-b99bff) bg-(--s-2b2140) px-3 py-2 text-xs font-semibold hover:bg-(--s-34294f)">+ Adicionar</button>
                  </div>
                </div>
              </li>
            })() : (() => {
              const a = reg.arma
              const baseId = baseEscolhida[a.id] ?? (a.armaBase ? (edicao === 'phb2014' ? '2014-' : '') + a.armaBase : '')
              return <li key={a.id} className="flex gap-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
                <ArteItem item={{ nome: a.nome, categoria: 'arma', magico: a.classe === 'magica' }} tamanho={56} estiloDnd />
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">{a.nome}</strong>
                  <p className="mt-1 text-[11px] text-(--a-c4b6d4)">{rotuloArsenalDnd(ativo)}</p>
                  {a.dano ? <p className="mt-1 text-xs font-semibold text-(--a-ed9cd8)">{a.dano} · {a.tipoDano}</p>
                    : <p className="mt-1 text-xs text-amber-200">Dano e poderes exclusivos: conferir o livro; nada presumido.</p>}
                  {!a.dano && <label className="mt-2 block text-[11px] text-(--a-c4b6d4)">
                    Modelo físico para rolagem (opcional; não aplica magia)
                    <select value={baseId} onChange={e => setBaseEscolhida(o => ({ ...o, [a.id]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-(--a-5e4b78) bg-(--s-151123) p-2 text-xs text-white">
                      <option value="">Definir dano depois</option>
                      {baseParaReferencia.filter(x => !!x.dano).map(x => <option key={x.id} value={x.id}>{x.nome} · {x.dano}</option>)}
                    </select>
                  </label>}
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => adicionarReferencia(a, baseId || undefined)}
                      className="min-h-10 rounded-lg border border-(--a-b99bff) bg-(--s-2b2140) px-3 py-2 text-xs font-semibold hover:bg-(--s-34294f)">+ Adicionar</button>
                  </div>
                </div>
              </li>
            })())}
          </ul>
          {lista.length === 0 && <p className="rounded-lg border border-dashed border-(--a-62527e) p-4 text-sm text-(--a-c4b6d4)">
            Nenhuma arma cadastrada nesta publicação ou nos filtros atuais. O jogador ainda pode criar o item manualmente, consultando o livro.
          </p>}
          {lista.length > mostrados.length && <button type="button" onClick={() => setLimite(n => n + 40)}
            className="mt-3 w-full rounded-xl border border-(--a-62527e) bg-(--s-171325) p-3 text-sm font-semibold hover:bg-(--s-34294f)">
            Ver mais {Math.min(40, lista.length - mostrados.length)} itens
          </button>}
        </div>
        <footer className="border-t border-(--a-55456e) px-3 py-2 text-[11px] text-(--a-c4b6d4) sm:px-4">
          Fontes: SRD 5.1/5.2.1 (CC BY 4.0). Suplementos comerciais: apenas referências, sem reproduzir ou presumir seus efeitos.
        </footer>
      </section>
    </div>
  </NaTela>
}
