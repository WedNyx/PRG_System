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
    <main className="min-h-screen bg-[#0d0c19] text-[#f4f0ff] px-4 py-8 sm:py-12">
      <div className="max-w-[1040px] mx-auto">
        <div className="text-center mb-8 rounded-2xl border border-[#373251] bg-[#19172c]/80 px-4 py-8 shadow-xl">
          <p className="text-[#ed9cd8] tracking-[.2em] text-xs uppercase">🌙 PORTAL DOS AVENTUREIROS</p>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">PRG System</h1>
          <p className="text-[#b4aeca] mt-3">Quem vai se aventurar hoje?</p>
        </div>
        <div role="status" className="border border-[#57466f] bg-[#19172c] rounded-2xl p-4 text-sm text-[#b4aeca] mb-8">
          Demonstração: os perfis desta tela ficam apenas neste navegador.
          A Ficha V8 também salva localmente. Ainda não há contas compartilhadas
          ou sincronização com o Supabase. Não use esta tela para fichas importantes sem backup.
        </div>
        <section aria-label="Perfis neste dispositivo" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {perfis.map(perfil => (
            <Link key={perfil.id} href="/ficha-v8"
              className="rounded-2xl border border-[#373251] bg-[#19172c] p-4 sm:p-6 text-center hover:border-[#b99bff] hover:bg-[#28233e] transition-colors focus-visible:outline-2 focus-visible:outline-[#b99bff]">
              <div className="w-16 h-16 rounded-xl border border-[#62527e] bg-[#34294f] mx-auto flex items-center justify-center text-2xl font-bold">
                {perfil.apelido[0].toUpperCase()}
              </div>
              <p className="mt-3 font-semibold break-words">{perfil.apelido}</p>
              <p className="text-xs text-[#b99bff] mt-1">Abrir Ficha V8</p>
            </Link>
          ))}
        </section>
        <form onSubmit={criar} className="max-w-xl mx-auto rounded-2xl border border-[#373251] bg-[#19172c] p-5 sm:p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-[#ed9cd8]">Criar aventureiro</h2>
          <label htmlFor="apelido" className="block text-sm mb-2 text-[#b4aeca]">Apelido</label>
          <input id="apelido" value={apelido} onChange={e => setApelido(e.target.value)}
            maxLength={40} required placeholder="Ex.: Wed Nyx"
            className="w-full rounded-lg bg-[#100f20] border border-[#4a4267] p-3 text-white focus:outline-2 focus:outline-[#b99bff]" />
          {erro && <p role="alert" className="text-red-300 text-sm mt-2">{erro}</p>}
          <button type="submit" className="w-full rounded-lg border border-[#a689e5] bg-[#7654bb] hover:bg-[#8a67ce] py-3 mt-4 font-semibold">
            Criar perfil
          </button>
        </form>
      </div>
    </main>
  )
}
