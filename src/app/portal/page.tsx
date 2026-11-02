'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { validarApelidoAventureiro } from '@/lib/auth/aventureiro'

type Perfil = { id: string; apelido: string }
const KEY = 'prg-aventureiros-demo-v1'

function lerPerfis(): Perfil[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter((v): v is Perfil =>
      typeof v === 'object' && v !== null && typeof v.id === 'string' &&
      typeof v.apelido === 'string' && validarApelidoAventureiro(v.apelido).ok)
      .slice(0, 50)
  } catch { return [] }
}

export default function PortalAventureiros() {
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [apelido, setApelido] = useState('')
  const [erro, setErro] = useState('')
  useEffect(() => { setPerfis(lerPerfis()) }, [])

  function criar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validacao = validarApelidoAventureiro(apelido)
    if (!validacao.ok) { setErro(validacao.erro); return }
    if (perfis.length >= 50) { setErro('Limite de perfis nesta demonstração.'); return }
    const novos = [...perfis, { id: crypto.randomUUID(), apelido: validacao.apelido }]
    localStorage.setItem(KEY, JSON.stringify(novos))
    setPerfis(novos)
    setApelido('')
    setErro('')
  }

  return (
    <main className="min-h-screen bg-[#100d20] text-violet-100 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-violet-400 tracking-widest text-sm">🌙 PORTAL DOS AVENTUREIROS</p>
          <h1 className="text-4xl font-bold mt-3">PRG System</h1>
          <p className="text-violet-300 mt-3">Quem vai se aventurar hoje?</p>
        </div>
        <div role="status" className="border border-amber-600/40 bg-amber-950/30 rounded-xl p-4 text-sm text-amber-200 mb-8">
          Demonstração: os perfis desta tela ficam apenas neste navegador.
          A Ficha V8 também salva localmente. Ainda não há contas compartilhadas
          ou sincronização com o Supabase. Não use esta tela para fichas importantes sem backup.
        </div>
        <section aria-label="Perfis neste dispositivo" className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          {perfis.map(perfil => (
            <Link key={perfil.id} href="/ficha-v8"
              className="rounded-xl border border-violet-700 bg-[#211938] p-5 text-center hover:border-violet-300 focus-visible:outline-2 focus-visible:outline-violet-300">
              <div className="w-16 h-16 rounded-full bg-violet-700 mx-auto flex items-center justify-center text-2xl font-bold">
                {perfil.apelido[0].toUpperCase()}
              </div>
              <p className="mt-3 font-semibold break-words">{perfil.apelido}</p>
              <p className="text-xs text-violet-300 mt-1">Abrir Ficha V8</p>
            </Link>
          ))}
        </section>
        <form onSubmit={criar} className="max-w-md mx-auto rounded-xl border border-violet-800 bg-[#211938] p-6">
          <h2 className="text-xl font-bold mb-4">Criar aventureiro</h2>
          <label htmlFor="apelido" className="block text-sm mb-2">Apelido</label>
          <input id="apelido" value={apelido} onChange={e => setApelido(e.target.value)}
            maxLength={40} required placeholder="Ex.: Wed Nyx"
            className="w-full rounded-lg bg-[#100d20] border border-violet-700 p-3 text-white" />
          {erro && <p role="alert" className="text-red-300 text-sm mt-2">{erro}</p>}
          <button type="submit" className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 py-3 mt-4 font-semibold">
            Criar perfil
          </button>
        </form>
      </div>
    </main>
  )
}
