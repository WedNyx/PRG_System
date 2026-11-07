'use client'

import { useEffect, useState } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'

type PerfilLembrado = { apelido: string; avatar?: string }
const STORAGE_KEY = 'prg-perfil-lembrado-v1'

export default function EntradaAventureiro() {
  const [perfil, setPerfil] = useState<PerfilLembrado | null>(null)
  const [mostrarLogin, setMostrarLogin] = useState(false)

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY)
      if (salvo) {
        const dados: unknown = JSON.parse(salvo)
        if (dados && typeof dados === 'object' && 'apelido' in dados &&
            typeof dados.apelido === 'string' && dados.apelido.length <= 40) {
          setPerfil({ apelido: dados.apelido, avatar: 'avatar' in dados && typeof dados.avatar === 'string' && dados.avatar.startsWith('https://') ? dados.avatar : undefined })
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  function esquecerPerfil() {
    localStorage.removeItem(STORAGE_KEY)
    setPerfil(null)
    setMostrarLogin(true)
  }

  return (
    <div className="w-full max-w-lg text-center">
      <div className="mb-8">
        <p className="text-violet-400 text-sm tracking-[0.3em] uppercase mb-3">Portal de Aventuras</p>
        <h1 className="text-4xl font-bold text-violet-200 mb-3">PRG System</h1>
        <p className="text-slate-400">Quem vai se aventurar hoje?</p>
      </div>
      {perfil && !mostrarLogin ? (
        <div className="flex flex-col items-center gap-4">
          <button onClick={() => setMostrarLogin(true)}
            className="group flex flex-col items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-xl p-3">
            <span className="w-28 h-28 rounded-2xl bg-violet-900 border-2 border-violet-600 group-hover:border-violet-300 flex items-center justify-center text-5xl font-semibold text-violet-100">
              {perfil.avatar ? <img src={perfil.avatar} alt="Avatar do perfil" className="w-full h-full object-cover rounded-2xl" /> : perfil.apelido.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-xl font-medium text-white">{perfil.apelido}</span>
            <span className="text-sm text-violet-300">Continuar</span>
          </button>
          <button onClick={esquecerPerfil} className="text-sm text-slate-400 hover:text-white underline">
            Usar outra conta
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-violet-900 rounded-2xl p-7 text-left">
          <h2 className="text-xl font-semibold text-white mb-2">{perfil ? `Bem-vindo de volta, ${perfil.apelido}` : 'Entrar na aventura'}</h2>
          <p className="text-sm text-slate-400 mb-6">
            Por segurança, confirme sua identidade para acessar suas campanhas e fichas.
          </p>
          <LoginForm />
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-400">Primeira aventura?{' '}
              <Link href="/register" className="text-violet-300 hover:text-violet-200">Criar perfil</Link>
            </p>
            {perfil && <button onClick={() => setMostrarLogin(false)} className="text-sm text-slate-400 hover:text-white">Voltar aos perfis</button>}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500 mt-8">
        O perfil lembrado neste dispositivo não substitui a autenticação segura.
      </p>
    </div>
  )
}
