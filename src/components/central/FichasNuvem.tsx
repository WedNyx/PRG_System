'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Cloud, History, Loader2, Plus, ScrollText, Send, Trash2, Upload } from 'lucide-react'
import { SeloStatus } from './PainelFichasCampanha'
import EscolherSistema from './EscolherSistema'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'
import { fichasLocais, lerFichaLocal, marcarImportado, type FichaLocal } from '@/lib/nuvem/locais'
import { sistemaPorId, SISTEMA_V8 } from '@/lib/sistemas/catalogo'
import { useOpcoesSistema } from '@/lib/sistemas/cliente'

const linkFicha = (f: { id: string; sistema: string }) => (f.sistema === SISTEMA_V8 ? '/ficha-v8?nuvem=' : '/ficha?nuvem=') + f.id

type Ficha = { id: string; nome: string; sistema: string; status: string; observacao_mestre?: string; bloqueada?: boolean; campanha_id: string | null; atualizada_em: string; campanha: { nome: string } | null }
const msg = (e: unknown) => e instanceof ErroNuvem ? e.message : 'Falha de conexão. Tente novamente.'

/** Fichas sincronizadas. `tipo` separa independentes das fichas de campanha. */
export default function FichasNuvem({ aventureiroId, tipo }: { aventureiroId: string; tipo: 'independentes' | 'campanhas' }) {
  const { nomeDe } = useOpcoesSistema()
  const [fichas, setFichas] = useState<Ficha[] | null>(null)
  const [locais, setLocais] = useState<FichaLocal[]>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [campanhas, setCampanhas] = useState<{ id: string; nome: string; estado: string }[]>([])
  const [aviso, setAviso] = useState('')
  const [escolher, setEscolher] = useState(false)

  const carregar = useCallback(async () => {
    try { setFichas((await api<{ fichas: Ficha[] }>('fichas', { aventureiro: aventureiroId })).fichas); setErro('') }
    catch (e) { setErro(msg(e)); setFichas([]) }
  }, [aventureiroId])

  const lerLocais = useCallback((nuvem: Ficha[]) => setLocais(fichasLocais(new Set(nuvem.map(f => f.id)))), [])
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { if (tipo === 'independentes' && fichas) lerLocais(fichas) }, [fichas, lerLocais, tipo])



  async function importar(f: FichaLocal) {
    setOcupado(true); setErro('')
    try {
      const dados = lerFichaLocal(f.chave)
      await api('fichas', { method: 'POST', aventureiro: aventureiroId, body: f.tipo === 'v8' ? { dados } : { dados, sistema: f.sistema } })
      marcarImportado(f.chave)
      await carregar()
    } catch (e) { setErro(`Não foi possível enviar "${f.nome}": ${msg(e)}`) } finally { setOcupado(false) }
  }

  async function excluir(f: Ficha) {
    if (!window.confirm(`Excluir "${f.nome || 'Personagem sem nome'}" da nuvem, em todos os dispositivos? Exporte um backup JSON pela Ficha V8 antes.`)) return
    setOcupado(true)
    try { await api('fichas/' + f.id, { method: 'DELETE', aventureiro: aventureiroId }); await carregar() } catch (e) { setErro(msg(e)) } finally { setOcupado(false) }
  }

  const lista = fichas?.filter(f => tipo === 'independentes' ? !f.campanha_id : !!f.campanha_id) ?? null
  const grupos = new Map<string, Ficha[]>()
  if (tipo === 'campanhas') for (const f of lista ?? []) grupos.set(f.campanha?.nome ?? 'Campanha', [...(grupos.get(f.campanha?.nome ?? 'Campanha') ?? []), f])

  async function abrirEnvio(f: Ficha) {
    setEnviando(enviando === f.id ? null : f.id); setAviso('')
    if (!campanhas.length) {
      try { setCampanhas(((await api<{ campanhas: { id: string; nome: string; estado: string }[] }>('campanhas', { aventureiro: aventureiroId })).campanhas).filter(c => c.estado !== 'encerrada')) }
      catch (e) { setErro(msg(e)) }
    }
  }
  async function enviar(f: Ficha, campanhaId: string) {
    setOcupado(true); setErro('')
    try {
      await api(`fichas/${f.id}/enviar`, { method: 'POST', aventureiro: aventureiroId, body: { campanhaId } })
      setEnviando(null); setAviso(`Cópia de "${f.nome || 'sem nome'}" enviada! O mestre vai avaliar; a original continua com você.`); await carregar()
    } catch (e) { setErro(msg(e)) } finally { setOcupado(false) }
  }

  const cartao = (f: Ficha) => <div key={f.id} className={'rounded-xl border border-[#594871] bg-[#171325] p-4 ' + (f.status === 'arquivada' ? 'opacity-60' : '')}>
    <div className="flex items-start gap-3"><ScrollText className="shrink-0 text-[#c3a4f5]" size={25} /><div className="min-w-0 flex-1">
      <h3 className="break-words font-semibold">{f.nome || 'Personagem sem nome'}</h3>
      <p className="mt-1 text-xs text-[#b5a5c8]">{f.sistema === SISTEMA_V8 ? 'Lunethernnyis · Ficha V8' : nomeDe(f.sistema)}<br />Atualizada {new Date(f.atualizada_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
      {f.campanha_id && <div className="mt-1 flex flex-wrap gap-1"><SeloStatus status={f.status} />{f.bloqueada && <span className="rounded-full bg-[#4b253a] px-2 py-0.5 text-[11px] text-[#f2a9c3]">Travada pelo mestre</span>}</div>}
      {f.observacao_mestre && <p className="mt-2 rounded-lg bg-[#2b2140] p-2 text-xs">Mestre: {f.observacao_mestre}</p>}</div></div>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Link href={linkFicha(f)} className="inline-flex items-center gap-1 rounded-lg bg-[#3b2b57] px-3 py-2 text-sm font-semibold text-[#e4d3ff] hover:bg-[#533b78]">Abrir ficha <ChevronRight size={16} /></Link>
      {tipo === 'independentes' && <button type="button" disabled={ocupado} onClick={() => abrirEnvio(f)} className="inline-flex items-center gap-1 rounded-lg border border-[#70588c] px-3 py-2 text-sm hover:bg-[#38294d]"><Send size={15} /> Enviar para campanha</button>}
      {f.campanha_id && <Link href={'/historico?ficha=' + f.id} className="inline-flex items-center gap-1 rounded-lg border border-[#70588c] px-3 py-2 text-sm hover:bg-[#38294d]"><History size={15} /> Histórico</Link>}
      {tipo === 'independentes' && <button type="button" disabled={ocupado} onClick={() => excluir(f)} aria-label={'Excluir ficha ' + f.nome} className="ml-auto rounded-lg p-2 text-[#f2a9c3] hover:bg-[#4b253a]"><Trash2 size={18} /></button>}
    </div>
    {enviando === f.id && <div className="mt-3 rounded-lg border border-[#55456e] p-3 text-sm">
      <p className="mb-2 text-xs text-[#c4b6d4]">Uma CÓPIA vai para o mestre avaliar. Escolha a campanha:</p>
      {campanhas.length === 0 ? <p className="text-xs">Você ainda não participa de nenhuma campanha ativa.</p>
        : <div className="flex flex-wrap gap-2">{campanhas.map(c => <button key={c.id} type="button" disabled={ocupado} onClick={() => enviar(f, c.id)} className="rounded-lg bg-[#3b2b57] px-3 py-1.5 text-xs hover:bg-[#533b78]">{c.nome}</button>)}</div>}
    </div>}
  </div>

  return <section className="mt-5 rounded-2xl border border-[#55456e] bg-[#201a32] p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Cloud size={20} className="text-[#c3a4f5]" /> {tipo === 'independentes' ? 'Personagens independentes' : 'Fichas de campanhas'}</h2>
        <p className="mt-1 text-sm text-[#c4b6d4]">Sincronizadas: abra no celular ou no computador.</p></div>
      {tipo === 'independentes' && <button type="button" disabled={ocupado} onClick={() => setEscolher(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#7652ac] px-4 py-3 text-sm font-semibold hover:bg-[#8b68c4] disabled:opacity-50"><Plus size={18} /> Nova ficha</button>}
    </div>
    {locais.length > 0 && <div className="mt-4 rounded-xl border border-[#67517f] bg-[#2b2140] p-4 text-sm">
      <p className="font-semibold">Fichas salvas só neste navegador</p>
      <p className="mt-1 text-xs text-[#c4b6d4]">Envie para a nuvem as que forem suas. As cópias locais não são apagadas.</p>
      <ul className="mt-3 space-y-2">{locais.map(f => <li key={f.chave} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#171325] p-2">
        <span className="min-w-0 flex-1"><span className="font-semibold">{f.nome}</span><span className="block text-xs text-[#b5a5c8]">{f.tipo === 'v8' ? 'Ficha V8' : sistemaPorId(f.sistema ?? '')?.nome ?? f.sistema}{f.perfil ? ' · perfil local “' + f.perfil + '”' : ''}</span></span>
        <button type="button" disabled={ocupado} onClick={() => importar(f)} className="inline-flex items-center gap-1 rounded-lg border border-[#70588c] px-3 py-1.5 hover:bg-[#38294d] disabled:opacity-50"><Upload size={15} /> Enviar</button>
      </li>)}</ul>
    </div>}
    {escolher && <EscolherSistema aventureiroId={aventureiroId} onFechar={() => setEscolher(false)} />}
    {erro && <p role="alert" className="mt-4 text-sm text-red-200">{erro}</p>}
    {aviso && <p role="status" className="mt-4 rounded-lg bg-[#1f4a35] p-3 text-sm text-[#a9f0c8]">{aviso}</p>}
    {lista === null && <p className="mt-5 flex items-center gap-2 text-[#cbb9dc]"><Loader2 className="animate-spin" size={18} /> Carregando...</p>}
    {tipo === 'independentes'
      ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{lista?.map(cartao)}</div>
      : [...grupos].map(([nome, fs]) => <div key={nome} className="mt-5"><h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#d3adf0]">{nome}</h3><div className="grid gap-3 sm:grid-cols-2">{fs.map(cartao)}</div></div>)}
    {lista?.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-[#594871] p-6 text-center text-sm text-[#c4b6d4]">
      {tipo === 'independentes' ? 'Nenhuma ficha na nuvem ainda. Crie uma ou envie as fichas deste navegador.' : 'Nenhuma ficha de campanha ainda. Use “Enviar para campanha” numa ficha independente.'}</p>}
  </section>
}
