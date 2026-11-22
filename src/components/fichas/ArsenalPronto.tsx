'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Search, Package } from 'lucide-react'
import NaTela from '@/components/NaTela'
import ArteItem from './ArteItem'
import { ARSENAL, ESTILOS_ARSENAL, type EstiloArsenal, type ItemArsenal } from '@/lib/arsenal'
import { CATEGORIAS_ITEM } from '@/lib/sistemas/inventario'
import { arsenalDoSistema } from '@/lib/arsenalSistemas'

const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
type Escopo = EstiloArsenal | 'todos'
export default function ArsenalPronto({ adicionar, fechar, sistema }: { adicionar: (x: ItemArsenal) => void; fechar: () => void; sistema?: string }) {
  // Arsenal do sistema (v0.36.6): armas com o dano e o crítico do jogo. O genérico continua numa aba ao lado.
  const doSistema = sistema ? arsenalDoSistema(sistema) : null
  const [fonte, setFonte] = useState<'sistema' | 'generico'>(doSistema ? 'sistema' : 'generico')
  const proprio = !!doSistema && fonte === 'sistema', ordem = proprio && sistema === 'ordem-paranormal'
  const [estilo, setEstilo] = useState<Escopo>('todos')
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('todos')
  const [ordenar, setOrdenar] = useState('nome')
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [fechar])
  const acervo = proprio ? doSistema!.itens.map((item, index) => ({ item, estilo: 'moderno' as EstiloArsenal, nomeEstilo: doSistema!.titulo, chave: 'sis:' + index }))
    : ESTILOS_ARSENAL.flatMap(e => ARSENAL[e.id].map((item, index) => ({ item, estilo: e.id, nomeEstilo: e.nome, chave: e.id + ':' + index })))
  const base = acervo.filter(x => (proprio || estilo === 'todos' || x.estilo === estilo) && norm(x.item.nome + ' ' + x.item.descricao).includes(norm(busca.trim())))
  const lista = base.filter(x => categoria === 'todos' || x.item.categoria === categoria).sort((a,b) => ordenar === 'peso' ? a.item.peso-b.item.peso || a.item.nome.localeCompare(b.item.nome,'pt-BR') : a.item.nome.localeCompare(b.item.nome,'pt-BR'))
  const campo = 'w-full min-w-0 min-h-11 rounded-lg border border-(--a-5e4b78) bg-(--s-151123) px-3 py-2 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
  const limpar = () => { setBusca(''); setEstilo('todos'); setCategoria('todos'); setOrdenar('nome') }
  return <NaTela><div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-2 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-label="Arsenal pronto" data-arsenal={ordem ? 'ordem' : undefined} className="arsenal-janela flex max-h-[96dvh] w-full min-w-0 max-w-3xl flex-col rounded-2xl border border-(--a-6d5690) bg-(--s-1b1529) text-sm text-(--a-f2ebff)">
      <header className="flex shrink-0 items-center gap-3 border-b border-(--a-55456e) p-3 sm:p-5"><Package size={24}/><div className="min-w-0 flex-1"><h2 className="text-lg font-bold">{proprio ? doSistema!.titulo : 'Arsenal pronto'}</h2><p className="text-xs opacity-80">{proprio ? 'Com o dano e o crítico deste sistema' : 'Biblioteca de equipamentos genéricos'}</p></div><button type="button" onClick={fechar} aria-label="Fechar arsenal" className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-(--s-38294d)"><X size={20}/></button></header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5">
        {doSistema && <div role="tablist" aria-label="Qual arsenal" className="mb-3 grid grid-cols-2 gap-2">
          <button type="button" role="tab" aria-selected={fonte === 'sistema'} onClick={() => { setFonte('sistema'); setCategoria('todos') }} className="prg-chip justify-center !py-2">⚔️ {doSistema.titulo.replace(/^(Arsenal|Armas|Itens|Armas e armaduras) d[eao]s? /, '')}</button>
          <button type="button" role="tab" aria-selected={fonte === 'generico'} onClick={() => { setFonte('generico'); setCategoria('todos') }} className="prg-chip justify-center !py-2">📦 Genérico</button></div>}
        {proprio ? <div className="mb-3 space-y-1.5 rounded-lg border border-(--a-55456e) p-3 text-xs leading-relaxed"><p><strong>Crítico:</strong> {doSistema!.critico.replace(/^Crítico:\s*/, "")}</p><p className="opacity-80">{doSistema!.fonte} Tudo pode ser editado depois de adicionar.</p></div>
          : <p className="mb-3 rounded-lg border border-(--a-55456e) p-3 text-xs leading-relaxed">Modelos genéricos, não oficiais. Peso em kg e dados sugeridos; confira a compatibilidade com seu sistema antes de adicionar.</p>}
        <label className="block text-xs font-semibold"><span className="mb-1 flex items-center gap-2"><Search size={14}/> Buscar equipamento</span><input type="search" value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Nome ou descrição" className={campo}/></label>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {!proprio && <label className="text-xs">Ambientação<select className={campo+' mt-1'} value={estilo} onChange={e=>{setEstilo(e.target.value as Escopo);setCategoria('todos')}}><option value="todos">Todas</option>{ESTILOS_ARSENAL.map(e=><option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>}
          <label className="text-xs">Categoria<select className={campo+' mt-1'} value={categoria} onChange={e=>setCategoria(e.target.value)}><option value="todos">Todas ({base.length})</option>{CATEGORIAS_ITEM.map(c=><option key={c.id} value={c.id}>{c.nome} ({base.filter(x=>x.item.categoria===c.id).length})</option>)}</select></label>
          <label className="text-xs">Ordenar por<select className={campo+' mt-1'} value={ordenar} onChange={e=>setOrdenar(e.target.value)}><option value="nome">Nome (A–Z)</option><option value="peso">{proprio ? 'Menor ' + doSistema!.peso.replace(/ \(.*\)/, '') : 'Menor peso'}</option></select></label>
        </div>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2"><p aria-live="polite" className="text-xs opacity-80">{lista.length} de {acervo.length} modelos</p><button type="button" onClick={limpar} className="min-h-11 rounded-lg border border-(--a-55456e) px-3 text-xs">Limpar filtros</button></div>
        {!lista.length && <div className="rounded-xl border border-dashed border-(--a-55456e) p-5 text-center"><p className="font-semibold">Nenhum equipamento encontrado</p><p className="mt-1 text-xs opacity-80">Altere os filtros ou tente outro nome.</p></div>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {lista.map(({item:x,nomeEstilo,chave})=><li key={chave} className="flex min-w-0 flex-col gap-3 rounded-xl border border-(--a-55456e) bg-(--s-171325) p-3">
            <div className="flex items-center gap-3"><ArteItem item={{nome:x.nome,categoria:x.categoria,iconeBiblioteca:x.icone}} tamanho={44}/><div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{x.nome}</h3><p className="text-xs opacity-80">{CATEGORIAS_ITEM.find(c=>c.id===x.categoria)?.nome} · {nomeEstilo}</p></div></div>
            <dl className="grid grid-cols-2 gap-2 text-xs">{[[proprio ? 'Peso / ' + doSistema!.peso.replace(/ \(.*\)/, '') : 'Peso', x.peso.toLocaleString('pt-BR') + (proprio ? '' : ' kg')],...(x.dano?[['Rolagem sugerida',x.dano]]:[]),...(x.alcance?[['Alcance',x.alcance+' m']]:[])].map(([k,v])=><div key={k} className="rounded-lg bg-(--s-201a32) p-2"><dt className="opacity-75">{k}</dt><dd className="break-words font-semibold">{v}</dd></div>)}</dl>
            <p className="break-words text-xs leading-relaxed opacity-90">{x.descricao}</p>
            {!!x.rolagens?.length && <details className="text-xs"><summary className="cursor-pointer">{proprio ? 'Rolagem do crítico' : 'Rolagens adicionais'}</summary>{x.rolagens.map((r,i)=><p key={i}>{r.nome}: {r.expr}</p>)}</details>}
            <button type="button" onClick={()=>adicionar(x)} aria-label={'Adicionar '+x.nome+' ao inventário'} className="mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-(--a-7654bb) px-3 py-2 text-xs font-semibold"><Plus size={16}/> Adicionar ao inventário</button>
          </li>)}
        </ul>
        <p className="mt-4 text-xs opacity-80">Ícones: <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer" className="underline">Game-Icons.net</a> (Lorc, Delapouite e outros autores, CC BY 3.0).</p>
      </div>
    </div>
  </div></NaTela>
}
