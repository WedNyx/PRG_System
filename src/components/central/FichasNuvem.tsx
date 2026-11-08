'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Cloud, Loader2, Plus, ScrollText, Trash2, Upload } from 'lucide-react'
import { api, ErroNuvem } from '@/lib/nuvem/cliente'

type Ficha = { id: string; nome: string; status: string; campanha_id: string | null; atualizada_em: string; campanha: { nome: string } | null }
const LISTA_LOCAL = 'prg-fichas-independentes-v1-'
const CHAVE_V8 = 'lunethernnyis-ficha-v8-'
const IMPORTADAS = 'prg-fichas-importadas-v1-'
const msg = (e: unknown) => e instanceof ErroNuvem ? e.message : 'Falha de conexão. Tente novamente.'

/** Fichas sincronizadas. `tipo` separa independentes das fichas de campanha. */
export default function FichasNuvem({ aventureiroId, tipo }: { aventureiroId: string; tipo: 'independentes' | 'campanhas' }) {
  const [fichas, setFichas] = useState<Ficha[] | null>(null)
  const [locais, setLocais] = useState<{ id: string; nome: string }[]>([])
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = useCallback(async () => {
    try { setFichas((await api<{ fichas: Ficha[] }>('fichas', { aventureiro: aventureiroId })).fichas); setErro('') }
    catch (e) { setErro(msg(e)); setFichas([]) }
  }, [aventureiroId])

  const lerLocais = useCallback(() => {
    try {
      const lista: unknown = JSON.parse(localStorage.getItem(LISTA_LOCAL + aventureiroId) || '[]')
      const ids = (Array.isArray(lista) ? lista : []).map(f => f?.id).filter((v): v is string => typeof v === 'string')
      if (localStorage.getItem(CHAVE_V8 + aventureiroId)) ids.unshift(aventureiroId) // ficha original do perfil
      const ja = new Set<string>(JSON.parse(localStorage.getItem(IMPORTADAS + aventureiroId) || '[]'))
      setLocais([...new Set(ids)].filter(id => !ja.has(id) && localStorage.getItem(CHAVE_V8 + id)).map(id => {
        let nome = 'Personagem sem nome'
        try { const d = JSON.parse(localStorage.getItem(CHAVE_V8 + id) || 'null'); if (d?.fields?.name?.trim()) nome = d.fields.name.trim().slice(0, 90) } catch {}
        return { id, nome }
      }))
    } catch { setLocais([]) }
  }, [aventureiroId])

  useEffect(() => { carregar(); if (tipo === 'independentes') lerLocais() }, [carregar, lerLocais, tipo])

  async function criar() {
    setOcupado(true); setErro('')
    try {
      const r = await api<{ ficha: { id: string } }>('fichas', { method: 'POST', body: {}, aventureiro: aventureiroId })
      window.location.assign('/ficha-v8?nuvem=' + r.ficha.id)
    } catch (e) { setErro(msg(e)); setOcupado(false) }
  }

  async function importar() {
    if (!window.confirm(`Enviar ${locais.length} ficha(s) deste navegador para a nuvem? As cópias locais não serão apagadas.`)) return
    setOcupado(true); setErro('')
    const ja: string[] = (() => { try { return JSON.parse(localStorage.getItem(IMPORTADAS + aventureiroId) || '[]') } catch { return [] } })()
    for (const f of locais) {
      try {
        await api('fichas', { method: 'POST', body: { dados: JSON.parse(localStorage.getItem(CHAVE_V8 + f.id) || '{}') }, aventureiro: aventureiroId })
        ja.push(f.id); localStorage.setItem(IMPORTADAS + aventureiroId, JSON.stringify(ja))
      } catch (e) { setErro(`Parou em "${f.nome}": ${msg(e)}`); break }
    }
    lerLocais(); await carregar(); setOcupado(false)
  }

  async function excluir(f: Ficha) {
    if (!window.confirm(`Excluir "${f.nome || 'Personagem sem nome'}" da nuvem, em todos os dispositivos? Exporte um backup JSON pela Ficha V8 antes.`)) return
    setOcupado(true)
    try { await api('fichas/' + f.id, { method: 'DELETE', aventureiro: aventureiroId }); await carregar() } catch (e) { setErro(msg(e)) } finally { setOcupado(false) }
  }

  const lista = fichas?.filter(f => tipo === 'independentes' ? !f.campanha_id : !!f.campanha_id) ?? null
  const grupos = new Map<string, Ficha[]>()
  if (tipo === 'campanhas') for (const f of lista ?? []) grupos.set(f.campanha?.nome ?? 'Campanha', [...(grupos.get(f.campanha?.nome ?? 'Campanha') ?? []), f])

  const cartao = (f: Ficha) => <div key={f.id} className={'rounded-xl border border-[#594871] bg-[#171325] p-4 ' + (f.status === 'arquivada' ? 'opacity-60' : '')}>
    <div className="flex items-start gap-3"><ScrollText className="shrink-0 text-[#c3a4f5]" size={25} /><div className="min-w-0 flex-1">
      <h3 className="break-words font-semibold">{f.nome || 'Personagem sem nome'}</h3>
      <p className="mt-1 text-xs text-[#b5a5c8]">{f.status === 'arquivada' ? 'Arquivada · ' : ''}Atualizada {new Date(f.atualizada_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p></div></div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <Link href={'/ficha-v8?nuvem=' + f.id} className="inline-flex items-center gap-1 rounded-lg bg-[#3b2b57] px-3 py-2 text-sm font-semibold text-[#e4d3ff] hover:bg-[#533b78]">Abrir ficha <ChevronRight size={16} /></Link>
      {tipo === 'independentes' && <button type="button" disabled={ocupado} onClick={() => excluir(f)} aria-label={'Excluir ficha ' + f.nome} className="rounded-lg p-2 text-[#f2a9c3] hover:bg-[#4b253a]"><Trash2 size={18} /></button>}
    </div>
  </div>

  return <section className="mt-5 rounded-2xl border border-[#55456e] bg-[#201a32] p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Cloud size={20} className="text-[#c3a4f5]" /> {tipo === 'independentes' ? 'Personagens independentes' : 'Fichas de campanhas'}</h2>
        <p className="mt-1 text-sm text-[#c4b6d4]">Sincronizadas: abra no celular ou no computador.</p></div>
      {tipo === 'independentes' && <button type="button" disabled={ocupado} onClick={criar} className="inline-flex items-center gap-2 rounded-xl bg-[#7652ac] px-4 py-3 text-sm font-semibold hover:bg-[#8b68c4] disabled:opacity-50"><Plus size={18} /> Nova ficha</button>}
    </div>
    {locais.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#67517f] bg-[#2b2140] p-4 text-sm">
      <span>{locais.length} ficha(s) salvas só neste navegador: {locais.map(f => f.nome).join(', ')}</span>
      <button type="button" disabled={ocupado} onClick={importar} className="inline-flex items-center gap-2 rounded-lg border border-[#70588c] px-3 py-2 hover:bg-[#38294d]"><Upload size={16} /> Enviar para a nuvem</button>
    </div>}
    {erro && <p role="alert" className="mt-4 text-sm text-red-200">{erro}</p>}
    {lista === null && <p className="mt-5 flex items-center gap-2 text-[#cbb9dc]"><Loader2 className="animate-spin" size={18} /> Carregando...</p>}
    {tipo === 'independentes'
      ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{lista?.map(cartao)}</div>
      : [...grupos].map(([nome, fs]) => <div key={nome} className="mt-5"><h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#d3adf0]">{nome}</h3><div className="grid gap-3 sm:grid-cols-2">{fs.map(cartao)}</div></div>)}
    {lista?.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-[#594871] p-6 text-center text-sm text-[#c4b6d4]">
      {tipo === 'independentes' ? 'Nenhuma ficha na nuvem ainda. Crie uma ou envie as fichas deste navegador.' : 'Nenhuma ficha de campanha ainda. O envio de fichas ao mestre chega na próxima etapa.'}</p>}
  </section>
}
