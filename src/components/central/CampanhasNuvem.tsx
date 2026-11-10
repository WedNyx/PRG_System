'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Castle, Check, Copy, Crown, DoorOpen, Link2, Loader2, Pencil, Plus, RefreshCw, Save, Settings, Shield, Trash2, Upload, UserMinus, X } from 'lucide-react'
import { CAMPOS, REGRAS, permissoesPadrao, type Modelo, type Permissoes, type Regra } from '@/lib/campanhas/permissoes'
import { ESTADOS, ESTADO_TITULO, type EstadoCampanha } from '@/lib/nuvem/validacao'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import PainelFichasCampanha from './PainelFichasCampanha'
import SeletorSistemaCampanha from './SeletorSistemaCampanha'
import { SISTEMAS, sistemaDaCampanha } from '@/lib/sistemas/catalogo'
import { useSistemasAutorais } from '@/lib/sistemas/cliente'
import { campanhasLocais, marcarImportado, type CampanhaLocal } from '@/lib/nuvem/locais'

type Campanha = {
  id: string; nome: string; descricao: string; sistema: string; modelo_padrao: Modelo
  permissoes: Permissoes; estado: EstadoCampanha; mestre_id: string; meuPapel: 'mestre' | 'comestre' | 'jogador' | 'espectador'; pendencias?: number; sessao_aberta?: boolean
}
type Membro = { aventureiro_id: string; papel: string; excecoes?: Partial<Permissoes>; aventureiro: { apelido: string; avatar: string | null } | null }
type Convite = { codigo: string; expira_em: string; usos: number; max_usos: number; situacao: string }
type Pedido = { id: string; mensagem: string; aventureiro: { apelido: string; avatar: string | null } | null }
type Detalhe = { campanha: Campanha; membros: Membro[]; convites: Convite[]; solicitacoes: Pedido[] }

const modelos: { id: Modelo; nome: string; detalhe: string }[] = [
  { id: 'A', nome: 'Jogador edita', detalhe: 'O jogador edita; o mestre supervisiona.' },
  { id: 'B', nome: 'Mestre controla', detalhe: 'O mestre edita; o jogador solicita mudanças.' },
  { id: 'C', nome: 'Compartilhado', detalhe: 'Edição compartilhada com aprovações.' },
]
const corEstado: Record<EstadoCampanha, string> = {
  planejada: 'bg-[#3a3352] text-[#d6c8f0]', ativa: 'bg-[#1f4a35] text-[#a9f0c8]',
  pausada: 'bg-[#4d3f1d] text-[#f3dc9a]', encerrada: 'bg-[#3d2530] text-[#e6aebf]',
}
const btn = 'inline-flex items-center gap-2 rounded-lg border border-[#70588c] px-3 py-2 text-sm hover:bg-[#38294d] disabled:opacity-50'
const btnPrim = 'inline-flex items-center gap-2 rounded-xl bg-[#7652ac] px-4 py-3 font-semibold hover:bg-[#8b68c4] disabled:opacity-50'
const msg = (e: unknown) => e instanceof ErroNuvem ? e.message : 'Falha de conexão. Tente novamente.'

export default function CampanhasNuvem({ aventureiroId, abrirCampanha }: { aventureiroId: string; abrirCampanha?: string | null }) {
  const { lista: autorais } = useSistemasAutorais()
  for (const a of autorais ?? []) nomesAutorais.set(a.id, a.nome)
  const [campanhas, setCampanhas] = useState<Campanha[] | null>(null)
  const [tela, setTela] = useState<{ tipo: 'lista' } | { tipo: 'form'; campanha?: Campanha } | { tipo: 'gerenciar'; id: string }>(() => abrirCampanha && /^[0-9a-f-]{36}$/i.test(abrirCampanha) ? { tipo: 'gerenciar', id: abrirCampanha } : { tipo: 'lista' })
  const [erro, setErro] = useState('')
  const [codigo, setCodigo] = useState('')
  const [locais, setLocais] = useState<CampanhaLocal[]>([])
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(async () => {
    try { setCampanhas((await api<{ campanhas: Campanha[] }>('campanhas', { aventureiro: aventureiroId })).campanhas); setErro('') }
    catch (e) { setErro(msg(e)); setCampanhas([]) }
  }, [aventureiroId])
  useEffect(() => {
    carregar()
    setLocais(campanhasLocais())
  }, [aventureiroId, carregar])

  async function importarLocal(c: CampanhaLocal) {
    setOcupado(true); setErro('')
    try {
      const d = c.dados
      await api('campanhas', { method: 'POST', aventureiro: aventureiroId, body: { nome: d.nome, descricao: d.descricao, sistema: d.sistema, modeloPadrao: d.modeloPadrao, permissoes: d.permissoes } })
      marcarImportado(c.chave); setLocais(campanhasLocais()); await carregar()
    } catch (e) { setErro(`Não foi possível enviar "${c.nome}": ${msg(e)}`) } finally { setOcupado(false) }
  }

  if (tela.tipo === 'form') return <FormCampanha aventureiroId={aventureiroId} campanha={tela.campanha}
    onFechar={salvou => { setTela(tela.campanha ? { tipo: 'gerenciar', id: tela.campanha.id } : { tipo: 'lista' }); if (salvou) carregar() }} />
  if (tela.tipo === 'gerenciar') return <Gerenciar aventureiroId={aventureiroId} id={tela.id}
    onVoltar={() => { setTela({ tipo: 'lista' }); carregar() }} onEditar={c => setTela({ tipo: 'form', campanha: c })} />

  return <div className="mt-6 space-y-5">
    <div className="flex flex-wrap gap-3">
      <button type="button" onClick={() => setTela({ tipo: 'form' })} className={btnPrim}><Plus size={18} /> Criar campanha</button>
      <form className="flex flex-wrap items-center gap-2" onSubmit={e => { e.preventDefault(); const c = codigo.trim(); if (c) window.location.assign('/convite/' + encodeURIComponent(c)) }}>
        <input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} maxLength={12} placeholder="Código de convite"
          aria-label="Código de convite" className="w-44 rounded-xl border border-[#70588c] bg-[#151123] p-3 font-mono tracking-widest text-white" />
        <button type="submit" className={btn}><DoorOpen size={16} /> Entrar</button>
      </form>
    </div>
    {locais.length > 0 && <div className="rounded-xl border border-[#67517f] bg-[#2b2140] p-4 text-sm">
      <p className="font-semibold">Rascunhos salvos só neste navegador</p>
      <ul className="mt-3 space-y-2">{locais.map(c => <li key={c.chave} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#171325] p-2">
        <span className="min-w-0 flex-1"><span className="font-semibold">{c.nome}</span>{c.perfil && <span className="block text-xs text-[#b5a5c8]">perfil local “{c.perfil}”</span>}</span>
        <button type="button" disabled={ocupado} onClick={() => importarLocal(c)} className={btn}><Upload size={16} /> Enviar para a nuvem</button>
      </li>)}</ul>
    </div>}
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    {campanhas === null && <p className="flex items-center gap-2 text-[#cbb9dc]"><Loader2 className="animate-spin" size={18} /> Carregando campanhas...</p>}
    {campanhas?.length === 0 && <div className="rounded-2xl border border-dashed border-[#594871] p-8 text-center text-[#cbb9dc]"><Castle className="mx-auto mb-3" size={32} />Você ainda não participa de nenhuma campanha. Crie uma ou entre com um código.</div>}
    <div className="grid gap-4 sm:grid-cols-2">{campanhas?.map(c => <article key={c.id} className="rounded-2xl border border-[#55456e] bg-[#201a32] p-5">
      <div className="flex items-start gap-3"><BookOpen className="shrink-0 text-[#c5a7ff]" /><div className="min-w-0 flex-1">
        <h2 className="break-words text-lg font-semibold">{c.nome}</h2><p className="mt-1 text-sm text-[#c4b6d4]">{nomeSistema(c.sistema)}</p></div>
        <span className={'shrink-0 rounded-full px-2 py-1 text-xs ' + corEstado[c.estado]}>{ESTADO_TITULO[c.estado]}</span></div>
      {!!c.pendencias && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#7652ac] px-3 py-1 text-xs font-semibold">🔔 {c.pendencias} pendência(s) para você</p>}
      {c.descricao && <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm text-[#d1c4df]">{c.descricao}</p>}
      <p className="mt-3 flex items-center gap-1 text-sm text-[#d4baff]">{c.meuPapel === 'jogador' ? <><Shield size={15} /> Você joga</> : c.meuPapel === 'espectador' ? <>👁️ Você assiste</> : <><Crown size={15} /> Você {c.meuPapel === 'mestre' ? 'é o mestre' : 'é co-mestre'}</>}</p>
      {c.sessao_aberta && <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-800/70 px-3 py-1 text-xs font-semibold text-emerald-100">🟢 Sessão acontecendo agora</p>}
      <button type="button" onClick={() => setTela({ tipo: 'gerenciar', id: c.id })} className={btn + ' mt-4'}><Settings size={16} /> Abrir</button>
    </article>)}</div>
    <p className="text-xs text-[#ab9bbc]">Campanhas sincronizadas: aparecem em qualquer dispositivo ao escolher seu aventureiro.</p>
  </div>
}

function FormCampanha({ aventureiroId, campanha, onFechar }: { aventureiroId: string; campanha?: Campanha; onFechar: (salvou: boolean) => void }) {
  const [nome, setNome] = useState(campanha?.nome ?? '')
  const [descricao, setDescricao] = useState(campanha?.descricao ?? '')
  const [sistema, setSistema] = useState(campanha?.sistema ?? '')
  const [modelo, setModelo] = useState<Modelo>(campanha?.modelo_padrao ?? 'C')
  const [regras, setRegras] = useState<Permissoes>(campanha?.permissoes ?? permissoesPadrao('C'))
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSalvando(true); setErro('')
    try {
      const body = { nome, descricao, sistema, modeloPadrao: modelo, permissoes: regras }
      await api(campanha ? 'campanhas/' + campanha.id : 'campanhas', { method: campanha ? 'PATCH' : 'POST', body, aventureiro: aventureiroId })
      onFechar(true)
    } catch (e) { setErro(msg(e)); setSalvando(false) }
  }
  return <form onSubmit={salvar} className="mt-6 max-w-2xl space-y-5 rounded-2xl border border-[#55456e] bg-[#201a32] p-5 sm:p-7">
    <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{campanha ? 'Editar campanha' : 'Nova campanha'}</h2><button type="button" onClick={() => onFechar(false)} aria-label="Cancelar" className="rounded-lg p-2 hover:bg-[#38294d]"><X size={20} /></button></div>
    <label className="block text-sm font-medium">Nome da campanha<input required minLength={3} maxLength={80} value={nome} onChange={e => setNome(e.target.value)} className="mt-2 w-full rounded-xl border border-[#70588c] bg-[#151123] p-3 text-white" placeholder="Ex.: Ecos da Lua Partida" /></label>
    <label className="block text-sm font-medium">Descrição<textarea maxLength={600} rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} className="mt-2 w-full rounded-xl border border-[#70588c] bg-[#151123] p-3 text-white" /></label>
    <div className="block text-sm font-medium">Sistema de RPG<SeletorSistemaCampanha valor={sistema} onChange={setSistema} classe="mt-2 w-full rounded-xl border border-[#70588c] bg-[#151123] p-3 text-white" /></div>
    <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Modelo padrão de edição das fichas</legend>
      {modelos.map(m => <label key={m.id} className={'flex cursor-pointer gap-3 rounded-xl border p-4 ' + (modelo === m.id ? 'border-[#b79aff] bg-[#3a2a53]' : 'border-[#55456e]')}>
        <input type="radio" name="modelo" checked={modelo === m.id} onChange={() => { setModelo(m.id); setRegras(permissoesPadrao(m.id)) }} className="accent-[#b79aff]" />
        <span><strong>{m.id} — {m.nome}</strong><span className="mt-1 block text-sm text-[#c9b9d8]">{m.detalhe}</span></span>
      </label>)}
    </fieldset>
    <fieldset className="space-y-3"><legend className="font-semibold">Permissões por área da ficha</legend>
      {CAMPOS.map(campo => <label key={campo.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#55456e] p-3 text-sm"><span>{campo.titulo}</span>
        <select value={regras[campo.id]} onChange={e => setRegras(a => ({ ...a, [campo.id]: e.target.value as Regra }))} className="rounded-lg border border-[#70588c] bg-[#151123] p-2 text-white">{REGRAS.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}</select></label>)}
    </fieldset>
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    <button type="submit" disabled={salvando} className={btnPrim}>{salvando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar</button>
  </form>
}

function Avatar({ a }: { a: { apelido: string; avatar: string | null } | null }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#8d70b6] bg-[#342749] text-sm font-semibold">
    {a?.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : (a?.apelido?.[0] ?? '?').toUpperCase()}</span>
}

function Gerenciar({ aventureiroId, id, onVoltar, onEditar }: { aventureiroId: string; id: string; onVoltar: () => void; onEditar: (c: Campanha) => void }) {
  const [d, setD] = useState<Detalhe | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [copiado, setCopiado] = useState('')
  const [tick, setTick] = useState(0)
  const carregar = useCallback(async () => {
    try { setD(await api<Detalhe>('campanhas/' + id, { aventureiro: aventureiroId })); setErro(''); setTick(t => t + 1) } catch (e) { setErro(msg(e)) }
  }, [id, aventureiroId])
  useEffect(() => { carregar() }, [carregar])
  async function acao(fn: () => Promise<unknown>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return
    setOcupado(true); setErro('')
    try { await fn(); await carregar() } catch (e) { setErro(msg(e)) } finally { setOcupado(false) }
  }
  const call = (caminho: string, method: string, body?: unknown) => api(caminho, { method, body, aventureiro: aventureiroId })
  async function copiar(codigo: string) {
    const link = window.location.origin + '/convite/' + codigo
    try { await navigator.clipboard.writeText(link); setCopiado(codigo); setTimeout(() => setCopiado(''), 2000) } catch { window.prompt('Copie o link do convite:', link) }
  }

  if (!d) return <div className="mt-6">{erro ? <><p role="alert" className="text-red-200">{erro}</p><button type="button" onClick={onVoltar} className={btn + ' mt-3'}>Voltar</button></> : <p className="flex items-center gap-2 text-[#cbb9dc]"><Loader2 className="animate-spin" size={18} /> Carregando...</p>}</div>
  const c = d.campanha
  const admin = c.meuPapel === 'mestre' || c.meuPapel === 'comestre'
  const mestre = c.meuPapel === 'mestre'
  return <div className="mt-6 space-y-5">
    <button type="button" onClick={onVoltar} className="text-sm text-[#c7a8ff] hover:underline">← Todas as campanhas</button>
    <section className="rounded-2xl border border-[#55456e] bg-[#201a32] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="break-words text-2xl font-bold">{c.nome}</h2><p className="mt-1 text-sm text-[#c4b6d4]">{nomeSistema(c.sistema)} · Modelo {c.modelo_padrao}</p></div>
        <span className={'rounded-full px-3 py-1 text-sm ' + corEstado[c.estado]}>{ESTADO_TITULO[c.estado]}</span>
      </div>
      {c.descricao && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#d1c4df]">{c.descricao}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={'rounded-full px-3 py-1 text-xs font-semibold ' + (c.sessao_aberta ? 'bg-emerald-800/70 text-emerald-100' : 'bg-[#2b2140] text-[#c4b6d4]')}>{c.sessao_aberta ? '🟢 Sessão aberta' : '🌙 Sessão fechada'}</span>
        {admin && <button type="button" disabled={ocupado} onClick={() => acao(() => call('mesa/' + c.id, 'POST', { acao: 'sessao', aberta: !c.sessao_aberta }), c.sessao_aberta ? 'Encerrar a sessão? Jogadores e espectadores saem da mesa e a música para.' : undefined)}
          className={'rounded-xl px-3 py-2 text-sm font-semibold ' + (c.sessao_aberta ? 'border border-[#8a4a62] text-red-100 hover:bg-[#4b253a]' : 'bg-emerald-700 text-white hover:bg-emerald-600')}>{c.sessao_aberta ? '⏹ Encerrar sessão' : '▶ Abrir sessão'}</button>}
      </div>
      {admin || c.sessao_aberta
        ? <Link href={'/mesa?campanha=' + c.id} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#7652ac] px-4 py-2.5 font-semibold hover:bg-[#8b68c4]">🗺️ {admin ? 'Abrir mesa virtual' : 'Entrar na sessão'}</Link>
        : <p className="mt-3 text-sm text-[#cfc0df]">A mesa abre quando o mestre começar a sessão.</p>}
      {admin && <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onEditar(c)} className={btn}><Pencil size={16} /> Editar</button>
        <label className="flex items-center gap-2 text-sm">Estado
          <select value={c.estado} disabled={ocupado} onChange={e => acao(() => call('campanhas/' + id, 'PATCH', { estado: e.target.value }), e.target.value === 'encerrada' ? 'Encerrar a campanha? Novos convites deixarão de funcionar.' : undefined)}
            className="rounded-lg border border-[#70588c] bg-[#151123] p-2 text-white">{ESTADOS.map(s => <option key={s} value={s}>{ESTADO_TITULO[s]}</option>)}</select></label>
      </div>}
    </section>
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}

    {admin && d.solicitacoes.length > 0 && <section className="rounded-2xl border border-[#b79aff] bg-[#2b2140] p-5">
      <h3 className="font-semibold">Pedidos para entrar ({d.solicitacoes.length})</h3>
      <ul className="mt-3 space-y-2">{d.solicitacoes.map(p => <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#171325] p-3">
        <Avatar a={p.aventureiro} /><div className="min-w-0 flex-1"><p className="font-semibold">{p.aventureiro?.apelido}</p>{p.mensagem && <p className="break-words text-sm text-[#c4b6d4]">“{p.mensagem}”</p>}</div>
        <button type="button" disabled={ocupado} onClick={() => acao(() => call(`campanhas/${id}/solicitacoes/${p.id}`, 'POST', { decisao: 'aceitar' }))} className={btn + ' border-[#4f9a75]'}><Check size={16} /> Aceitar</button>
        <button type="button" disabled={ocupado} onClick={() => acao(() => call(`campanhas/${id}/solicitacoes/${p.id}`, 'POST', { decisao: 'recusar' }))} className={btn}><X size={16} /> Recusar</button>
      </li>)}</ul>
    </section>}

    <section className="rounded-2xl border border-[#55456e] bg-[#201a32] p-5">
      <h3 className="font-semibold">Participantes ({d.membros.length})</h3>
      <ul className="mt-3 space-y-2">{d.membros.map(m => {
        const souEu = m.aventureiro_id === aventureiroId
        return <li key={m.aventureiro_id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#171325] p-3">
          <Avatar a={m.aventureiro} />
          <div className="min-w-0 flex-1"><p className="font-semibold">{m.aventureiro?.apelido}{souEu && ' (você)'}</p>
            <p className="text-xs text-[#b5a5c8]">{m.papel === 'mestre' ? '👑 Mestre' : m.papel === 'comestre' ? '👑 Co-mestre' : m.papel === 'espectador' ? '👁️ Espectador (só assiste)' : '⚔️ Jogador'}{m.excecoes && Object.keys(m.excecoes).length ? ' · com exceções de permissão' : ''}</p></div>
          {mestre && m.papel !== 'mestre' && <select aria-label={'Papel de ' + m.aventureiro?.apelido} value={m.papel} disabled={ocupado}
            onChange={e => acao(() => call(`campanhas/${id}/membros/${m.aventureiro_id}`, 'PATCH', { papel: e.target.value }))}
            className="rounded-lg border border-[#70588c] bg-[#151123] p-2 text-sm text-white"><option value="jogador">Jogador</option><option value="espectador">Espectador</option><option value="comestre">Co-mestre</option></select>}
          {mestre && m.papel !== 'mestre' && <Excecoes campanha={c} membro={m} ocupado={ocupado} salvar={ex => acao(() => call(`campanhas/${id}/membros/${m.aventureiro_id}`, 'PATCH', { excecoes: ex }))} />}
          {m.papel !== 'mestre' && (souEu || (admin && !(c.meuPapel === 'comestre' && m.papel === 'comestre'))) &&
            <button type="button" disabled={ocupado} title={souEu ? 'Sair da campanha' : 'Remover'} aria-label={souEu ? 'Sair da campanha' : 'Remover ' + m.aventureiro?.apelido}
              onClick={() => acao(async () => { await call(`campanhas/${id}/membros/${m.aventureiro_id}`, 'DELETE'); if (souEu) onVoltar() },
                souEu ? 'Sair desta campanha? Suas fichas dela serão arquivadas.' : `Remover ${m.aventureiro?.apelido}? As fichas dele nesta campanha serão arquivadas.`)}
              className="rounded-lg p-2 text-[#f2a9c3] hover:bg-[#4b253a]">{souEu ? <DoorOpen size={18} /> : <UserMinus size={18} />}</button>}
        </li>
      })}</ul>
    </section>

    <PainelFichasCampanha key={tick} aventureiroId={aventureiroId} campanhaId={id} admin={admin} membros={d.membros} sistemaPadrao={sistemaDaCampanha(c.sistema)} />

    {admin && <section className="rounded-2xl border border-[#55456e] bg-[#201a32] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Convites</h3>
        <button type="button" disabled={ocupado || c.estado === 'encerrada'} onClick={() => acao(() => call(`campanhas/${id}/convites`, 'POST', { dias: 7, maxUsos: 20 }))} className={btn}><Link2 size={16} /> Gerar convite (7 dias)</button></div>
      <p className="mt-2 text-xs text-[#ab9bbc]">Quem usar o convite envia um pedido; você aceita ou recusa aqui. Para renovar, gere um novo e revogue o antigo.</p>
      <ul className="mt-3 space-y-2">{d.convites.map(v => <li key={v.codigo} className={'flex flex-wrap items-center gap-3 rounded-xl bg-[#171325] p-3 ' + (v.situacao !== 'valido' ? 'opacity-60' : '')}>
        <span className="font-mono text-lg tracking-widest">{v.codigo}</span>
        <span className="flex-1 text-xs text-[#b5a5c8]">{v.situacao === 'valido' ? `Válido até ${new Date(v.expira_em).toLocaleDateString('pt-BR')} · ${v.usos}/${v.max_usos} usos` : v.situacao === 'revogado' ? 'Revogado' : v.situacao === 'expirado' ? 'Expirado' : 'Limite de usos atingido'}</span>
        {v.situacao === 'valido' && <>
          <button type="button" onClick={() => copiar(v.codigo)} className={btn}>{copiado === v.codigo ? <Check size={16} /> : <Copy size={16} />} {copiado === v.codigo ? 'Copiado' : 'Copiar link'}</button>
          <button type="button" disabled={ocupado} onClick={() => acao(() => call(`campanhas/${id}/convites?codigo=${v.codigo}`, 'DELETE'), 'Revogar este convite?')} className="rounded-lg p-2 text-[#f2a9c3] hover:bg-[#4b253a]" aria-label="Revogar convite"><Trash2 size={18} /></button>
        </>}
      </li>)}</ul>
      {d.convites.length === 0 && <p className="mt-3 text-sm text-[#c4b6d4]">Nenhum convite ainda.</p>}
    </section>}
    <button type="button" onClick={carregar} className={btn}><RefreshCw size={16} /> Atualizar</button>
  </div>
}

function Excecoes({ campanha, membro, ocupado, salvar }: { campanha: Campanha; membro: Membro; ocupado: boolean; salvar: (ex: Partial<Permissoes>) => void }) {
  const [aberto, setAberto] = useState(false)
  const [ex, setEx] = useState<Partial<Permissoes>>(membro.excecoes ?? {})
  if (!aberto) return <button type="button" onClick={() => setAberto(true)} className={btn} title="Exceções de permissão para este jogador"><Shield size={16} /> Exceções</button>
  return <div className="w-full space-y-2 rounded-xl border border-[#55456e] p-3">
    <p className="text-xs text-[#c4b6d4]">“Padrão” segue a regra da campanha. As regras passam a valer no servidor na próxima fase (edição pelo mestre e aprovações).</p>
    {CAMPOS.map(campo => <label key={campo.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{campo.titulo}</span>
      <select value={ex[campo.id] ?? ''} onChange={e => setEx(a => { const n = { ...a }; if (e.target.value) n[campo.id] = e.target.value as Regra; else delete n[campo.id]; return n })}
        className="rounded-lg border border-[#70588c] bg-[#151123] p-1 text-white">
        <option value="">Padrão ({REGRAS.find(r => r.id === campanha.permissoes?.[campo.id])?.titulo ?? '—'})</option>
        {REGRAS.map(r => <option key={r.id} value={r.id}>{r.titulo}</option>)}</select></label>)}
    <div className="flex gap-2"><button type="button" disabled={ocupado} onClick={() => { salvar(ex); setAberto(false) }} className={btn}><Save size={16} /> Salvar exceções</button>
      <button type="button" onClick={() => setAberto(false)} className={btn}>Cancelar</button></div>
  </div>
}

/** Campanhas antigas podem guardar o id do sistema; mostra o nome bonito. */
/** Nome bonito: catálogo, autoral (pelo id) ou o texto livre digitado. */
const nomeSistema = (v: string) => SISTEMAS.find(x => x.id === v)?.nome ?? (/^autoral-[0-9a-f]{32}$/.test(v) ? (nomesAutorais.get(v) ?? 'Sistema autoral') : v)
const nomesAutorais = new Map<string, string>()

