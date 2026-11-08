'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ScrollText, Trash2, ChevronRight } from 'lucide-react'
import FichasNuvem from './FichasNuvem'
import EscolherSistema from './EscolherSistema'
import { NUVEM_ATIVA } from '@/lib/nuvem/cliente'
import { sistemaPorId } from '@/lib/sistemas/catalogo'

type Ficha = { id: string; criadaEm: string }
const prefix = 'prg-fichas-independentes-v1-'
const storagePrefix = 'lunethernnyis-ficha-v8-'
const validId = (id: string) => /^[a-zA-Z0-9-]{1,80}$/.test(id)

export default function FichasIndependentes({ aventureiroId }: { aventureiroId: string }) {
  return NUVEM_ATIVA ? <FichasNuvem aventureiroId={aventureiroId} tipo="independentes" /> : <FichasLocais aventureiroId={aventureiroId} />
}

function FichasLocais({ aventureiroId }: { aventureiroId: string }) {
  const [escolher, setEscolher] = useState(false)
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [nomes, setNomes] = useState<Record<string, string>>({})
  const [erro, setErro] = useState('')
  const [ready, setReady] = useState(false)
  const key = prefix + aventureiroId
  const legacyId = aventureiroId
  const load = () => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(key) || '[]')
      const list: Ficha[] = Array.isArray(raw) ? raw.filter((v): v is Ficha => v && typeof v.id === 'string' && validId(v.id) && typeof v.criadaEm === 'string').slice(0, 100) : []
      // A ficha antiga continua ligada ao perfil, sem migração ou sobrescrita.
      if (validId(legacyId) && localStorage.getItem(storagePrefix + legacyId) && !list.some(v => v.id === legacyId)) {
        list.unshift({ id: legacyId, criadaEm: '' })
      }
      setFichas(list)
      const titles: Record<string, string> = {}
      for (const f of list) {
        try {
          const data = JSON.parse(localStorage.getItem(storagePrefix + f.id) || 'null')
          titles[f.id] = typeof data?.fields?.name === 'string' && data.fields.name.trim() ? data.fields.name.trim().slice(0, 90) : 'Personagem sem nome'
        } catch { titles[f.id] = 'Personagem sem nome' }
      }
      setNomes(titles)
    } catch { setErro('Não foi possível ler a lista de fichas neste navegador.') }
    setReady(true)
  }
  useEffect(() => { load() }, [aventureiroId])
  function remove(id: string) {
    if (!window.confirm('Excluir esta ficha e seus dados locais permanentemente? Exporte um backup JSON pela Ficha V8 antes de continuar.')) return
    try {
      const next = fichas.filter(f => f.id !== id)
      localStorage.setItem(key, JSON.stringify(next))
      localStorage.removeItem(storagePrefix + id)
      load()
    } catch { setErro('Não foi possível excluir a ficha.') }
  }
  return <section className="mt-5 rounded-2xl border border-[#55456e] bg-[#201a32] p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Personagens independentes</h2><p className="mt-1 text-sm text-[#c4b6d4]">Cada ficha possui seu próprio salvamento neste navegador.</p></div>
      <button type="button" onClick={() => setEscolher(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#7652ac] px-4 py-3 text-sm font-semibold hover:bg-[#8b68c4]"><Plus size={18}/> Nova ficha</button>
    </div>
    {erro && <p role="alert" className="mt-4 text-sm text-red-200">{erro}</p>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {fichas.map(f => <div key={f.id} className="rounded-xl border border-[#594871] bg-[#171325] p-4">
        <div className="flex items-start gap-3"><ScrollText className="shrink-0 text-[#c3a4f5]" size={25}/><div className="min-w-0 flex-1"><h3 className="break-words font-semibold">{nomes[f.id] || 'Personagem sem nome'}</h3><p className="mt-1 text-xs text-[#b5a5c8]">{f.id === legacyId ? 'Ficha original do perfil' : 'Ficha independente'}</p></div></div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <Link href={'/ficha-v8?personagem=' + encodeURIComponent(f.id)} className="inline-flex items-center gap-1 rounded-lg bg-[#3b2b57] px-3 py-2 text-sm font-semibold text-[#e4d3ff] hover:bg-[#533b78]">Abrir ficha <ChevronRight size={16}/></Link>
          <button type="button" onClick={() => remove(f.id)} aria-label={'Excluir ficha ' + (nomes[f.id] || '')} className="rounded-lg p-2 text-[#f2a9c3] hover:bg-[#4b253a]" title="Excluir ficha local"><Trash2 size={18}/></button>
        </div>
      </div>)}
    </div>
    {ready && fichas.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-[#594871] p-6 text-center text-sm text-[#c4b6d4]">Nenhuma ficha independente ainda. Crie seu primeiro personagem!</p>}
    <FichasOutrosSistemas aventureiroId={aventureiroId} />
    {escolher && <EscolherSistema aventureiroId={aventureiroId} onFechar={() => setEscolher(false)} />}
    <p className="mt-5 text-xs leading-relaxed text-[#ad9dbe]">Os dados ainda não são sincronizados entre dispositivos. Antes de apagar ou trocar de navegador, exporte um backup JSON de cada ficha. Ao voltar desta tela, os nomes serão atualizados.</p>
  </section>
}

/** Fichas de outros sistemas (D&D, Fate...) salvas neste navegador quando a nuvem está desligada. */
function FichasOutrosSistemas({ aventureiroId }: { aventureiroId: string }) {
  const [lista, setLista] = useState<{ id: string; sistema: string; nome: string }[]>([])
  useEffect(() => {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem('prg-fichas-gen-lista-' + aventureiroId) || '[]')
      setLista((Array.isArray(raw) ? raw : []).filter(f => f && validId(f.id) && localStorage.getItem('prg-ficha-gen-' + f.id)).map(f => {
        let nome = ''
        try { nome = JSON.parse(localStorage.getItem('prg-ficha-gen-' + f.id) || '{}').nome || '' } catch {}
        return { id: f.id, sistema: sistemaPorId(String(f.sistema))?.nome ?? String(f.sistema), nome }
      }))
    } catch { setLista([]) }
  }, [aventureiroId])
  if (!lista.length) return null
  return <div className="mt-5 grid gap-3 sm:grid-cols-2">{lista.map(f => <Link key={f.id} href={'/ficha?local=' + f.id} className="rounded-xl border border-[#594871] bg-[#171325] p-4 hover:border-[#b79aff]">
    <p className="font-semibold">{f.nome || 'Personagem sem nome'}</p><p className="mt-1 text-xs text-[#b5a5c8]">{f.sistema}</p></Link>)}</div>
}
