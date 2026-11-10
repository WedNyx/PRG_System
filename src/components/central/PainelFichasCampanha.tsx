'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Copy, Eye, EyeOff, History, Lock, LockOpen, MessageSquareWarning, Plus, ScrollText, Trash2, UserPlus, X } from 'lucide-react'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { CAMPOS } from '@/lib/campanhas/permissoes'
import { SISTEMA_V8, sistemaPorId } from '@/lib/sistemas/catalogo'
import { GRUPOS_SISTEMA } from '@/lib/sistemas/criar'
import { useOpcoesSistema } from '@/lib/sistemas/cliente'

type Ficha = {
  id: string; nome: string; sistema: string; status: string; npc: boolean; oculta: boolean; bloqueada: boolean
  areas_bloqueadas: string[]; observacao_mestre: string; dono_id: string; atualizada_em: string; dono: { apelido: string } | null
}
type Alteracao = { id: string; estado: string; justificativa: string; categorias: string[]; criada_em: string; autor: { apelido: string } | null; ficha: { nome: string } | null; itens: { campo: string; categoria: string; antes: string; depois: string }[] }
type Registro = { id: number; tipo: string; descricao: string; categoria: string | null; criado_em: string; autor: { apelido: string } | null; ficha: { nome: string } | null }
type Membro = { aventureiro_id: string; papel: string; aventureiro: { apelido: string } | null }

const btn = 'inline-flex items-center gap-1 rounded-lg border border-[#70588c] px-2.5 py-1.5 text-xs hover:bg-[#38294d] disabled:opacity-50'
const sec = 'rounded-2xl border border-[#55456e] bg-[#201a32] p-5'
const msg = (e: unknown) => e instanceof ErroNuvem ? e.message : 'Falha de conexão.'
const tituloArea = (id: string) => CAMPOS.find(c => c.id === id)?.titulo ?? id
export const linkFicha = (f: { id: string; sistema: string }) => (f.sistema === SISTEMA_V8 ? '/ficha-v8?nuvem=' : '/ficha?nuvem=') + f.id
const quando = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const STATUS: Record<string, [string, string]> = {
  pendente: ['Aguardando o mestre', 'bg-[#4d3f1d] text-[#f3dc9a]'], ativa: ['Aprovada', 'bg-[#1f4a35] text-[#a9f0c8]'],
  recusada: ['Recusada', 'bg-[#3d2530] text-[#e6aebf]'], arquivada: ['Arquivada', 'bg-[#3a3352] text-[#d6c8f0]'],
}
export function SeloStatus({ status }: { status: string }) {
  const [t, c] = STATUS[status] ?? [status, 'bg-[#3a3352]']
  return <span className={'rounded-full px-2 py-0.5 text-[11px] ' + c}>{t}</span>
}

/** Painel de fichas da campanha. Mestre: aprovações, pedidos, NPCs, travas, registro. Jogador: suas fichas e pedidos. */
export default function PainelFichasCampanha({ aventureiroId, campanhaId, admin, membros, sistemaPadrao, aoMudar }: {
  aventureiroId: string; campanhaId: string; admin: boolean; membros: Membro[]; sistemaPadrao: string; aoMudar?: () => void
}) {
  const { opcoes, nomeDe } = useOpcoesSistema()
  const nomeSistema = (s: string) => s === SISTEMA_V8 ? 'Lunethernnyis · Ficha V8' : sistemaPorId(s)?.nome ?? nomeDe(s)
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [alteracoes, setAlteracoes] = useState<Alteracao[]>([])
  const [registro, setRegistro] = useState<Registro[] | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [nova, setNova] = useState<{ tipo: 'npc' | 'jogador'; jogadorId: string; sistema: string; nome: string } | null>(null)
  const [travas, setTravas] = useState<string | null>(null)
  const call = useCallback((c: string, method = 'GET', body?: unknown) => api<Record<string, unknown>>(c, { method, body, aventureiro: aventureiroId }), [aventureiroId])

  const carregar = useCallback(async () => {
    try {
      const [f, a] = await Promise.all([call(`campanhas/${campanhaId}/fichas`), call(`campanhas/${campanhaId}/alteracoes`)])
      setFichas(f.fichas as Ficha[]); setAlteracoes(a.alteracoes as Alteracao[]); setErro('')
    } catch (e) { setErro(msg(e)) }
  }, [call, campanhaId])
  useEffect(() => { carregar() }, [carregar])

  async function acao(fn: () => Promise<unknown>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return
    setOcupado(true); setErro('')
    try { await fn(); await carregar(); if (registro) setRegistro((await call(`campanhas/${campanhaId}/historico`)).historico as Registro[]); aoMudar?.() }
    catch (e) { setErro(msg(e)) } finally { setOcupado(false) }
  }
  const decidirFicha = (f: Ficha, decisao: 'aprovar' | 'recusar' | 'ajustar') => {
    const observacao = decisao === 'aprovar' ? undefined : window.prompt(decisao === 'ajustar' ? 'O que o jogador precisa ajustar?' : 'Motivo da recusa (opcional):') ?? undefined
    if (decisao === 'ajustar' && !observacao) return
    return acao(() => call(`campanhas/${campanhaId}/fichas/${f.id}`, 'POST', { decisao, observacao }))
  }
  const decidirPedido = (a: Alteracao, decisao: 'aceitar' | 'recusar' | 'ajuste') => {
    const justificativa = decisao === 'aceitar' ? '' : window.prompt(decisao === 'ajuste' ? 'O que precisa mudar no pedido?' : 'Justificativa (opcional):') ?? ''
    if (decisao === 'ajuste' && !justificativa) return
    return acao(() => call(`campanhas/${campanhaId}/alteracoes`, 'POST', { id: a.id, decisao, justificativa }))
  }

  const pendentes = fichas.filter(f => f.status === 'pendente')
  const jogadores = fichas.filter(f => !f.npc && f.status !== 'pendente')
  const npcs = fichas.filter(f => f.npc)

  const cartao = (f: Ficha, extra?: React.ReactNode) => <li key={f.id} className="rounded-xl bg-[#171325] p-3">
    <div className="flex flex-wrap items-center gap-2">
      <ScrollText size={18} className="shrink-0 text-[#c3a4f5]" />
      <span className="min-w-0 flex-1"><span className="font-semibold">{f.nome || 'Personagem sem nome'}</span>
        <span className="block text-xs text-[#b5a5c8]">{f.npc ? 'NPC' : f.dono?.apelido} · {nomeSistema(f.sistema)} · {quando(f.atualizada_em)}</span></span>
      {!f.npc && <SeloStatus status={f.status} />}
      {f.bloqueada && <span className="rounded-full bg-[#4b253a] px-2 py-0.5 text-[11px] text-[#f2a9c3]">Travada</span>}
      {f.npc && f.oculta && <span className="rounded-full bg-[#3a3352] px-2 py-0.5 text-[11px]">Oculto</span>}
    </div>
    {f.observacao_mestre && <p className="mt-2 rounded-lg bg-[#2b2140] p-2 text-xs"><MessageSquareWarning size={13} className="mr-1 inline" />Mestre: {f.observacao_mestre}</p>}
    {f.areas_bloqueadas?.length > 0 && <p className="mt-1 text-[11px] text-[#f2a9c3]">Áreas travadas: {f.areas_bloqueadas.map(tituloArea).join(', ')}</p>}
    <div className="mt-2 flex flex-wrap gap-1.5">
      <Link href={linkFicha(f)} className={btn}><ChevronRight size={14} /> Abrir</Link>
      <Link href={'/historico?ficha=' + f.id} className={btn}><History size={14} /> Histórico</Link>
      {extra}
    </div>
    {travas === f.id && <div className="mt-2 grid gap-1 rounded-lg border border-[#55456e] p-2 text-xs sm:grid-cols-2">
      {CAMPOS.map(c => <label key={c.id} className="flex items-center gap-2"><input type="checkbox" defaultChecked={f.areas_bloqueadas?.includes(c.id)} data-area={c.id} className="accent-[#b79aff]" />{c.titulo}</label>)}
      <button type="button" className={btn + ' sm:col-span-2 justify-center'} disabled={ocupado} onClick={e => {
        const areas = [...(e.currentTarget.parentElement?.querySelectorAll<HTMLInputElement>('input[data-area]') ?? [])].filter(i => i.checked).map(i => i.dataset.area!)
        setTravas(null); acao(() => call(`campanhas/${campanhaId}/fichas/${f.id}`, 'POST', { areasBloqueadas: areas }))
      }}>Salvar áreas travadas</button>
    </div>}
  </li>

  if (!admin) return <section className={sec}>
    <h3 className="font-semibold">Minhas fichas nesta campanha</h3>
    {erro && <p role="alert" className="mt-2 text-sm text-red-200">{erro}</p>}
    <ul className="mt-3 space-y-2">{fichas.map(f => cartao(f))}</ul>
    {fichas.length === 0 && <p className="mt-2 text-sm text-[#c4b6d4]">Envie uma ficha independente pela aba Fichas → “Enviar para campanha”.</p>}
    {alteracoes.length > 0 && <><h4 className="mt-4 text-sm font-semibold">Meus pedidos de alteração</h4>
      <ul className="mt-2 space-y-1 text-xs">{alteracoes.map(a => <li key={a.id} className="rounded-lg bg-[#171325] p-2">{a.ficha?.nome}: {a.categorias.map(tituloArea).join(', ')} — <strong>{a.estado === 'pendente' ? 'aguardando' : a.estado === 'aceita' ? 'aceito' : a.estado === 'recusada' ? 'recusado' : 'ajuste pedido'}</strong>{a.justificativa && ` (“${a.justificativa}”)`}</li>)}</ul></>}
  </section>

  return <>
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    {pendentes.length > 0 && <section className="rounded-2xl border border-[#b79aff] bg-[#2b2140] p-5">
      <h3 className="font-semibold">Fichas para aprovar ({pendentes.length})</h3>
      <ul className="mt-3 space-y-2">{pendentes.map(f => cartao(f, <>
        <button type="button" disabled={ocupado} onClick={() => decidirFicha(f, 'aprovar')} className={btn + ' border-[#4f9a75]'}><Check size={14} /> Aprovar</button>
        <button type="button" disabled={ocupado} onClick={() => decidirFicha(f, 'ajustar')} className={btn}><MessageSquareWarning size={14} /> Pedir ajuste</button>
        <button type="button" disabled={ocupado} onClick={() => decidirFicha(f, 'recusar')} className={btn}><X size={14} /> Recusar</button>
      </>))}</ul>
    </section>}

    {alteracoes.length > 0 && <section className="rounded-2xl border border-[#b79aff] bg-[#2b2140] p-5">
      <h3 className="font-semibold">Pedidos de alteração ({alteracoes.length})</h3>
      <ul className="mt-3 space-y-2">{alteracoes.map(a => <li key={a.id} className="rounded-xl bg-[#171325] p-3 text-sm">
        <p><strong>{a.autor?.apelido}</strong> quer mudar <strong>{a.categorias.map(tituloArea).join(', ')}</strong> em “{a.ficha?.nome || 'sem nome'}”</p>
        <ul className="mt-2 space-y-1 text-xs">{a.itens.map(i => <li key={i.campo} className="break-words"><span className="text-[#b5a5c8]">{i.campo}:</span> <span className="line-through opacity-70">{i.antes}</span> → <strong>{i.depois}</strong></li>)}</ul>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" disabled={ocupado} onClick={() => decidirPedido(a, 'aceitar')} className={btn + ' border-[#4f9a75]'}><Check size={14} /> Aceitar</button>
          <button type="button" disabled={ocupado} onClick={() => decidirPedido(a, 'ajuste')} className={btn}><MessageSquareWarning size={14} /> Pedir ajuste</button>
          <button type="button" disabled={ocupado} onClick={() => decidirPedido(a, 'recusar')} className={btn}><X size={14} /> Recusar</button>
        </div>
      </li>)}</ul>
    </section>}

    <section className={sec}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Fichas dos jogadores ({jogadores.length})</h3>
        <button type="button" onClick={() => setNova({ tipo: 'jogador', jogadorId: '', sistema: sistemaPadrao, nome: '' })} className={btn}><UserPlus size={14} /> Criar com um jogador</button></div>
      <ul className="mt-3 space-y-2">{jogadores.map(f => cartao(f, <>
        <button type="button" disabled={ocupado} onClick={() => acao(() => call(`campanhas/${campanhaId}/fichas/${f.id}`, 'POST', { bloqueada: !f.bloqueada }))} className={btn}>{f.bloqueada ? <><LockOpen size={14} /> Destravar</> : <><Lock size={14} /> Travar</>}</button>
        <button type="button" onClick={() => setTravas(travas === f.id ? null : f.id)} className={btn}><Lock size={14} /> Travar áreas</button>
      </>))}</ul>
      {jogadores.length === 0 && <p className="mt-2 text-sm text-[#c4b6d4]">Nenhuma ficha aprovada ainda.</p>}
    </section>

    <section className={sec}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">NPCs ({npcs.length})</h3>
        <button type="button" onClick={() => setNova({ tipo: 'npc', jogadorId: '', sistema: sistemaPadrao, nome: '' })} className={btn}><Plus size={14} /> Novo NPC</button></div>
      <p className="mt-1 text-xs text-[#ab9bbc]">Só você e os co-mestres veem e editam NPCs. “Oculto” é um lembrete para revelar depois.</p>
      <ul className="mt-3 space-y-2">{npcs.map(f => cartao(f, <>
        <button type="button" disabled={ocupado} onClick={() => acao(() => call(`campanhas/${campanhaId}/fichas/${f.id}`, 'POST', { acao: 'duplicar' }))} className={btn}><Copy size={14} /> Duplicar</button>
        <button type="button" disabled={ocupado} onClick={() => acao(() => call(`campanhas/${campanhaId}/fichas/${f.id}`, 'POST', { oculta: !f.oculta }))} className={btn}>{f.oculta ? <><Eye size={14} /> Revelar</> : <><EyeOff size={14} /> Ocultar</>}</button>
        <button type="button" disabled={ocupado} onClick={() => acao(() => call('fichas/' + f.id, 'DELETE'), `Excluir o NPC "${f.nome || 'sem nome'}"?`)} className={btn + ' text-[#f2a9c3]'}><Trash2 size={14} /> Excluir</button>
      </>))}</ul>
    </section>

    {nova && <section className={sec + ' border-[#b79aff]'}>
      <h3 className="font-semibold">{nova.tipo === 'npc' ? 'Novo NPC' : 'Criar ficha junto com um jogador'}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {nova.tipo === 'jogador' && <label className="text-sm">Jogador<select value={nova.jogadorId} onChange={e => setNova({ ...nova, jogadorId: e.target.value })} className="mt-1 w-full rounded-lg border border-[#70588c] bg-[#151123] p-2 text-white">
          <option value="">Escolha…</option>{membros.filter(m => m.papel !== 'mestre').map(m => <option key={m.aventureiro_id} value={m.aventureiro_id}>{m.aventureiro?.apelido}</option>)}</select></label>}
        <label className="text-sm">Sistema<select value={nova.sistema} onChange={e => setNova({ ...nova, sistema: e.target.value })} className="mt-1 w-full rounded-lg border border-[#70588c] bg-[#151123] p-2 text-white">
          {GRUPOS_SISTEMA.map(g => <optgroup key={g.id} label={g.nome.replace(/^\S+ /, '')}>{opcoes.filter(o => o.grupo === g.id).map(o => <option key={o.id} value={o.id}>{o.id === SISTEMA_V8 ? 'Lunethernnyis · Ficha V8' : o.nome}</option>)}</optgroup>)}</select></label>
        <label className="text-sm">Nome<input value={nova.nome} maxLength={90} onChange={e => setNova({ ...nova, nome: e.target.value })} className="mt-1 w-full rounded-lg border border-[#70588c] bg-[#151123] p-2 text-white" /></label>
      </div>
      {nova.tipo === 'jogador' && <p className="mt-2 text-xs text-[#ab9bbc]">A ficha pertence ao jogador, já aprovada nesta campanha. Os dois editam conforme as permissões.</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={ocupado || (nova.tipo === 'jogador' && !nova.jogadorId)} onClick={() => { const n = nova; setNova(null); acao(() => call(`campanhas/${campanhaId}/fichas`, 'POST', n)) }} className={btn}><Plus size={14} /> Criar</button>
        <button type="button" onClick={() => setNova(null)} className={btn}>Cancelar</button>
      </div>
    </section>}

    <section className={sec}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Registro de decisões</h3>
        <button type="button" onClick={async () => { try { setRegistro(registro ? null : (await call(`campanhas/${campanhaId}/historico`)).historico as Registro[]) } catch (e) { setErro(msg(e)) } }} className={btn}><History size={14} /> {registro ? 'Fechar' : 'Ver registro'}</button></div>
      {registro && <ul className="mt-3 max-h-96 space-y-1 overflow-y-auto text-xs">{registro.map(r => <li key={r.id} className="rounded-lg bg-[#171325] p-2">
        <span className="text-[#b5a5c8]">{quando(r.criado_em)} · {r.autor?.apelido ?? '—'}{r.ficha?.nome ? ` · ${r.ficha.nome}` : ''}</span><br />{r.descricao || `${r.tipo}${r.categoria ? ' · ' + tituloArea(r.categoria) : ''}`}</li>)}
        {registro.length === 0 && <li>Nada registrado ainda.</li>}</ul>}
    </section>
  </>
}
