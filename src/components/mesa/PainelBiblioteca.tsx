'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Gift, Minus, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import { sistemaDaCampanha, sistemaPorId } from '@/lib/sistemas/catalogo'
import { CATEGORIAS_ITEM, TIPOS_PODER, type Item, type Poder } from '@/lib/sistemas/inventario'
import { corDaRaridade, RARIDADES, type Raridade } from '@/lib/itensArte'
import { GRUPOS_PRONTOS, PRONTOS, type Pronto } from '@/lib/bibliotecaPronta'
import { EditorItem, EditorPoder } from '@/components/fichas/Inventario'
import ArteItem from '@/components/fichas/ArteItem'
import type { Estado } from './MesaNova'
import { btn, input, msg } from './estilos'

type Entrada = { id: string; tipo: 'item' | 'poder'; nome: string; dados: Record<string, unknown> }
const MAX_DAR = 20

function Icone({ b, tamanho = 44 }: { b: { tipo: 'item' | 'poder'; nome: string; dados: Record<string, unknown> }; tamanho?: number }) {
  if (b.tipo === 'item') return <ArteItem item={{ nome: b.nome, categoria: String(b.dados.categoria ?? 'equipamento'), arte: b.dados.arte, raridade: b.dados.raridade as Raridade | undefined }} tamanho={tamanho} />
  return <span className="flex shrink-0 items-center justify-center rounded-xl border-2 border-[#5e4b78] bg-[#2a2142] text-2xl" style={{ width: tamanho, height: tamanho }} aria-hidden>{TIPOS_PODER.find(t => t.id === b.dados.tipo)?.icone ?? '✨'}</span>
}
function detalhe(d: Record<string, unknown>, tipo: 'item' | 'poder') {
  const r = d.raridade ? RARIDADES.find(x => x.id === d.raridade)?.nome : ''
  return [r, tipo === 'item' ? CATEGORIAS_ITEM.find(c => c.id === d.categoria)?.nome : TIPOS_PODER.find(t => t.id === d.tipo)?.nome,
    d.dano || d.expressao, d.usosMax ? `${d.usosMax}× (${d.recarga === 'curto' ? 'desc. curto' : 'desc. longo'})` : '', Array.isArray(d.bonus) && d.bonus.length ? `${d.bonus.length} bônus` : ''].filter(Boolean).join(' · ')
}

/** Aba “Biblioteca” do mestre: catálogo de itens e poderes da campanha + prontos da plataforma; “Dar” entrega direto nas fichas. */
export default function PainelBiblioteca({ campanhaId, e }: { campanhaId: string; e: Estado }) {
  const [lista, setLista] = useState<Entrada[] | null>(null)
  const [vista, setVista] = useState<'campanha' | 'prontos'>('campanha')
  const [tipo, setTipo] = useState<'item' | 'poder'>('item')
  const [cat, setCat] = useState('')
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<{ id?: string; tipo: 'item' | 'poder'; valor: Item | Poder } | null>(null)
  const [dando, setDando] = useState<Entrada | null>(null)
  const [versao, setVersao] = useState(0)
  const s = sistemaPorId(sistemaDaCampanha(e.campanha.sistema ?? ''))

  useEffect(() => {
    let vivo = true
    api<{ biblioteca: Entrada[] }>(`campanhas/${campanhaId}/biblioteca`).then(r => { if (vivo) setLista(r.biblioteca) }).catch(er => { if (vivo) { toast.error(msg(er)); setLista([]) } })
    return () => { vivo = false }
  }, [campanhaId, versao])
  const recarregar = () => setVersao(v => v + 1)
  const chamar = (body: Record<string, unknown>) => api<Record<string, unknown>>(`campanhas/${campanhaId}/biblioteca`, { method: 'POST', body })

  async function salvar(t: 'item' | 'poder', valor: Item | Poder, id?: string) {
    try { await chamar({ acao: id ? 'editar' : 'criar', id, tipo: t, dados: valor }); setEditando(null); recarregar(); toast.success('Salvo na biblioteca!') } catch (er) { toast.error(msg(er)) }
  }
  async function excluir(b: Entrada) {
    if (!confirm(`Excluir “${b.nome}” da biblioteca? (Quem já recebeu continua com o seu.)`)) return
    try { await chamar({ acao: 'excluir', id: b.id }); recarregar() } catch (er) { toast.error(msg(er)) }
  }
  async function duplicar(b: Entrada) { try { await chamar({ acao: 'duplicar', id: b.id }); recarregar(); toast.success('Cópia criada.') } catch (er) { toast.error(msg(er)) } }
  async function importar(ps: Pronto[]) {
    try { await chamar({ acao: 'importar', entradas: ps.map(p => ({ tipo: p.tipo, dados: p.dados })) }); recarregar(); toast.success(ps.length === 1 ? `“${ps[0].dados.nome}” entrou na biblioteca.` : `${ps.length} entradas na biblioteca.`) }
    catch (er) { toast.error(msg(er)) }
  }

  const nomesNaCampanha = useMemo(() => new Set((lista ?? []).map(b => b.tipo + ':' + b.nome.toLowerCase())), [lista])
  const termo = busca.trim().toLowerCase()
  const visiveis = (lista ?? []).filter(b => b.tipo === tipo && (!cat || b.dados.categoria === cat || b.dados.tipo === cat) && (!termo || b.nome.toLowerCase().includes(termo) || String(b.dados.descricao ?? '').toLowerCase().includes(termo)))
  const contar = (t: 'item' | 'poder') => (lista ?? []).filter(b => b.tipo === t).length
  const categorias = tipo === 'item' ? CATEGORIAS_ITEM.map(c => ({ id: c.id, nome: `${c.icone} ${c.nome}` })) : TIPOS_PODER.map(t => ({ id: t.id, nome: `${t.icone} ${t.nome}` }))

  return <section className="space-y-3" aria-label="Biblioteca da campanha">
    <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-[#1e1a30] p-1">
      {([['campanha', `📚 Da campanha (${lista?.length ?? '…'})`], ['prontos', '✨ Prontos para usar']] as const).map(([id, nome]) =>
        <button key={id} type="button" role="tab" aria-selected={vista === id} onClick={() => setVista(id)} className={'rounded-lg px-2 py-1.5 text-xs font-semibold ' + (vista === id ? 'bg-[#5b4380] text-white' : 'text-[#cfc0df]')}>{nome}</button>)}
    </div>

    {vista === 'campanha' && <>
      <p className="text-xs text-[#b4aeca]">Monte itens e poderes uma vez e entregue com <b>🎁 Dar</b>: vão direto para as fichas, o chat avisa e quem recebe ganha um aviso. Só você vê a biblioteca.</p>
      <div className="flex gap-1">{(['item', 'poder'] as const).map(t => <button key={t} type="button" onClick={() => { setTipo(t); setCat('') }}
        className={'flex-1 rounded-lg px-2 py-1.5 text-xs ' + (tipo === t ? 'bg-[#5b4380]' : 'bg-[#1e1a30]')}>{t === 'item' ? '🎒 Itens' : '✨ Poderes'} ({contar(t)})</button>)}</div>
      <div className="relative"><Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8f88a8]" />
        <input value={busca} onChange={ev => setBusca(ev.target.value)} placeholder="Procurar pelo nome ou descrição…" aria-label="Procurar na biblioteca" className={input + ' pl-8'} /></div>
      <div className="flex flex-wrap gap-1">{[{ id: '', nome: 'Todos' }, ...categorias].map(c => <button key={c.id} type="button" onClick={() => setCat(c.id)}
        className={'rounded-full border px-2.5 py-0.5 text-[11px] ' + (cat === c.id ? 'border-[#b99bff] bg-[#3a2c58]' : 'border-[#3d3152] text-[#cfc0df]')}>{c.nome}</button>)}</div>
      <button type="button" className={btn} onClick={() => setEditando(tipo === 'item' ? { tipo: 'item', valor: { id: 'novo', nome: '', categoria: (cat as Item['categoria']) || 'equipamento', peso: 0, bonus: [] } } : { tipo: 'poder', valor: { id: 'novo', nome: '', tipo: (cat as Poder['tipo']) || 'magia' } })}><Plus size={14} /> Novo {tipo === 'item' ? 'item' : 'poder'}</button>
      {lista === null && <p className="text-sm text-[#b4aeca]">Carregando…</p>}
      {lista && !visiveis.length && <p className="rounded-xl border border-dashed border-[#55456e] p-3 text-sm text-[#b4aeca]">{(lista ?? []).length ? 'Nada com esse filtro.' : <>A biblioteca está vazia. Comece pelos <button type="button" onClick={() => setVista('prontos')} className="underline">✨ prontos para usar</button> ou crie o seu.</>}</p>}
      <ul className="space-y-1.5">{visiveis.map(b => <li key={b.id} className="rounded-xl border border-[#3b3054] bg-[#171428]/80 p-2">
        <div className="flex items-center gap-2.5">
          <Icone b={b} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={b.dados.raridade ? { color: corDaRaridade(b.dados.raridade as Raridade) } : undefined}>{b.nome}</p>
            <p className="truncate text-[11px] text-[#b4aeca]">{detalhe(b.dados, b.tipo)}</p>
          </div>
          <button type="button" onClick={() => setDando(b)} className="inline-flex items-center gap-1 rounded-lg bg-[#7652ac] px-2.5 py-1.5 text-xs font-semibold hover:bg-[#8b68c4]"><Gift size={13} /> Dar</button>
        </div>
        {typeof b.dados.descricao === 'string' && b.dados.descricao && <p className="mt-1 line-clamp-2 pl-[3.4rem] text-[11px] text-[#cfc0df]">{b.dados.descricao}</p>}
        <div className="mt-1 flex justify-end gap-0.5">
          <button type="button" onClick={() => setEditando({ id: b.id, tipo: b.tipo, valor: { ...b.dados, nome: b.nome, id: 'x' } as unknown as Item | Poder })} aria-label={'Editar ' + b.nome} className="rounded p-1.5 hover:bg-[#34294f]"><Pencil size={14} /></button>
          <button type="button" onClick={() => void duplicar(b)} aria-label={'Duplicar ' + b.nome} title="Duplicar (para fazer uma variação)" className="rounded p-1.5 hover:bg-[#34294f]"><Copy size={14} /></button>
          <button type="button" onClick={() => void excluir(b)} aria-label={'Excluir ' + b.nome} className="rounded p-1.5 text-red-300 hover:bg-[#34294f]"><Trash2 size={14} /></button>
        </div>
      </li>)}</ul>
    </>}

    {vista === 'prontos' && <>
      <p className="text-xs text-[#b4aeca]">Itens e poderes genéricos da plataforma (com arte e raridade). Copie para a campanha e ajuste o que quiser: os bônus de cada sistema você coloca em “Editar”.</p>
      {GRUPOS_PRONTOS.map(g => {
        const ps = PRONTOS.filter(p => p.grupo === g.id)
        const faltam = ps.filter(p => !nomesNaCampanha.has(p.tipo + ':' + p.dados.nome.toLowerCase()))
        return <div key={g.id}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{g.nome}</h3>
            {faltam.length > 1 && <button type="button" className={btn} onClick={() => void importar(faltam)}><Plus size={13} /> Todos ({faltam.length})</button>}
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2">{ps.map(p => {
            const ja = nomesNaCampanha.has(p.tipo + ':' + p.dados.nome.toLowerCase())
            return <li key={p.dados.nome} className="flex items-center gap-2 rounded-xl border border-[#3b3054] bg-[#171428]/80 p-2">
              <Icone b={{ tipo: p.tipo, nome: p.dados.nome, dados: p.dados as unknown as Record<string, unknown> }} tamanho={38} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm" style={'raridade' in p.dados && p.dados.raridade ? { color: corDaRaridade(p.dados.raridade) } : undefined}>{p.dados.nome}</p>
                <p className="truncate text-[11px] text-[#b4aeca]">{detalhe(p.dados as unknown as Record<string, unknown>, p.tipo)}</p></div>
              {ja ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300"><Check size={13} /> Na campanha</span>
                : <button type="button" className={btn} onClick={() => void importar([p])} aria-label={'Adicionar ' + p.dados.nome}><Plus size={13} /></button>}
            </li>
          })}</ul>
        </div>
      })}
    </>}

    {editando?.tipo === 'item' && <EditorItem s={s} inicial={editando.valor as Item} salvar={v => void salvar('item', v, editando.id)} fechar={() => setEditando(null)} />}
    {editando?.tipo === 'poder' && <EditorPoder s={s} inicial={editando.valor as Poder} salvar={v => void salvar('poder', v, editando.id)} fechar={() => setEditando(null)} />}
    {dando && <JanelaDar campanhaId={campanhaId} e={e} b={dando} fechar={() => setDando(null)} />}
  </section>
}

/** Escolhe quem recebe (personagens e NPCs aprovados) e quantos. */
function JanelaDar({ campanhaId, e, b, fechar }: { campanhaId: string; e: Estado; b: Entrada; fechar: () => void }) {
  const [sel, setSel] = useState<string[]>([])
  const [qtd, setQtd] = useState(1)
  const [anunciar, setAnunciar] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const nomes = Object.fromEntries(e.membros.map(m => [m.aventureiro_id, m.aventureiro?.apelido ?? '?']))
  const jogadores = e.fichas.filter(f => !f.npc), npcs = e.fichas.filter(f => f.npc)
  const alternar = (id: string) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  async function dar() {
    setOcupado(true)
    try {
      const r = await api<{ recompensados: string[] }>(`campanhas/${campanhaId}/recompensas`, { method: 'POST', body: { fichaIds: sel, bibliotecaIds: Array(b.tipo === 'item' ? qtd : 1).fill(b.id), anunciar } })
      toast.success(`🎁 ${b.tipo === 'item' && qtd > 1 ? qtd + '× ' : ''}${b.nome} para ${r.recompensados.join(', ')}`); fechar()
    } catch (er) { toast.error(msg(er)) } finally { setOcupado(false) }
  }
  const linha = (f: Estado['fichas'][number]) => <label key={f.id} className={'flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm ' + (sel.includes(f.id) ? 'border-[#b99bff] bg-[#3a2c58]' : 'border-[#3d3152] bg-[#201a32]')}>
    <input type="checkbox" checked={sel.includes(f.id)} onChange={() => alternar(f.id)} className="accent-[#b99bff]" />
    <span className="flex-1 truncate">{f.npc ? '🎭' : '🧙'} {f.nome || 'Sem nome'}</span><span className="text-[11px] text-[#b4aeca]">{f.npc ? 'NPC' : nomes[f.dono_id]}</span></label>
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 sm:items-center" onMouseDown={ev => { if (ev.target === ev.currentTarget) fechar() }}>
    <div role="dialog" aria-modal="true" aria-labelledby="dar-titulo" onKeyDown={ev => { if (ev.key === 'Escape') fechar() }} className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#8b6cba] bg-[#19152a] p-5 text-[#f2ebff] shadow-2xl">
      <div className="flex items-center gap-3"><Icone b={b} />
        <div className="min-w-0 flex-1"><h2 id="dar-titulo" className="flex items-center gap-1.5 text-lg font-bold"><Gift size={18} /> Dar</h2><p className="truncate text-sm text-[#c4b6d4]">{b.nome}</p></div>
        <button type="button" onClick={fechar} aria-label="Fechar" className="rounded-lg p-1 text-[#b4aeca] hover:bg-white/10"><X size={18} /></button></div>
      <p className="mt-4 text-sm font-semibold">Para quem?</p>
      {!e.fichas.length && <p className="mt-1 text-sm text-[#b4aeca]">Ainda não há fichas aprovadas nesta campanha.</p>}
      <div className="mt-2 space-y-1">{jogadores.map(linha)}</div>
      {jogadores.length > 1 && <button type="button" className={btn + ' mt-2'} onClick={() => setSel(s => jogadores.every(f => s.includes(f.id)) ? s.filter(x => !jogadores.some(f => f.id === x)) : [...new Set([...s, ...jogadores.map(f => f.id)])])}>Todos os jogadores</button>}
      {npcs.length > 0 && <><p className="mt-3 text-xs text-[#b4aeca]">NPCs</p><div className="mt-1 space-y-1">{npcs.map(linha)}</div></>}
      {b.tipo === 'item' && <div className="mt-4 flex items-center gap-3"><span className="flex-1 text-sm font-semibold">Quantidade (cada um)</span>
        <button type="button" aria-label="Diminuir quantidade" disabled={qtd <= 1} onClick={() => setQtd(q => q - 1)} className="rounded-lg border border-[#5e4b78] p-1.5 disabled:opacity-30"><Minus size={14} /></button>
        <strong className="w-8 text-center text-lg tabular-nums">{qtd}</strong>
        <button type="button" aria-label="Aumentar quantidade" disabled={qtd >= MAX_DAR} onClick={() => setQtd(q => q + 1)} className="rounded-lg border border-[#5e4b78] p-1.5 disabled:opacity-30"><Plus size={14} /></button></div>}
      <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={anunciar} onChange={ev => setAnunciar(ev.target.checked)} className="accent-[#b99bff]" /> Avisar no chat da mesa</label>
      <button type="button" disabled={!sel.length || ocupado} onClick={() => void dar()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7652ac] to-[#b45309] p-2.5 font-semibold disabled:opacity-40">
        <Gift size={16} /> {ocupado ? 'Entregando…' : sel.length ? `Dar para ${sel.length} ${sel.length === 1 ? 'personagem' : 'personagens'}` : 'Escolha quem recebe'}</button>
    </div>
  </div>
}
