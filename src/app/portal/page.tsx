'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { validarApelidoAventureiro } from '@/lib/auth/aventureiro'

type Perfil = { id: string; apelido: string; avatar?: string }
const KEY = 'prg-aventureiros-demo-v1'
const SELECTED_KEY = 'prg-aventureiro-selecionado-v1'
const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function lerPerfis(): Perfil[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is Perfil =>
      typeof value === 'object' && value !== null &&
      typeof value.id === 'string' && typeof value.apelido === 'string' &&
      validarApelidoAventureiro(value.apelido).ok
    ).slice(0, 50).map(p => ({
      id: p.id, apelido: p.apelido,
      avatar: typeof p.avatar === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(p.avatar) ? p.avatar : undefined,
    }))
  } catch { return [] }
}

function reduzirImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('Escolha uma imagem JPG, PNG ou WebP.'))
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error('A imagem deve ter no máximo 5 MB.'))
      return
    }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 320
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Não foi possível processar a imagem.')
        const side = Math.min(image.width, image.height)
        context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      } catch { reject(new Error('Não foi possível processar a imagem.')) }
      finally { URL.revokeObjectURL(url) }
    }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida.')) }
    image.src = url
  })
}

export default function PortalAventureiros() {
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [modal, setModal] = useState<'criar' | 'editar' | null>(null)
  const [gerenciando, setGerenciando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [apelido, setApelido] = useState('')
  const [avatar, setAvatar] = useState<string | undefined>()
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setPerfis(lerPerfis()) }, [])
  useEffect(() => {
    if (modal) nameRef.current?.focus()
  }, [modal])

  function persistir(novos: Perfil[]): boolean {
    try {
      localStorage.setItem(KEY, JSON.stringify(novos))
      setPerfis(novos)
      return true
    } catch {
      setErro('Espaço insuficiente neste navegador. Tente uma foto menor.')
      return false
    }
  }

  function fechar() {
    setModal(null)
    setEditandoId(null)
    setErro('')
    setAvatar(undefined)
    setApelido('')
  }

  function abrirCriacao() {
    setEditandoId(null)
    setApelido('')
    setAvatar(undefined)
    setErro('')
    setModal('criar')
  }

  function abrirEdicao(perfil: Perfil) {
    setEditandoId(perfil.id)
    setApelido(perfil.apelido)
    setAvatar(perfil.avatar)
    setErro('')
    setModal('editar')
  }

  async function selecionarFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProcessando(true)
    setErro('')
    try { setAvatar(await reduzirImagem(file)) }
    catch (error) { setErro(error instanceof Error ? error.message : 'Falha ao carregar a foto.') }
    finally { setProcessando(false) }
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validacao = validarApelidoAventureiro(apelido)
    if (!validacao.ok) { setErro(validacao.erro); return }
    if (perfis.some(p => p.id !== editandoId && p.apelido.toLocaleLowerCase('pt-BR') === validacao.apelido.toLocaleLowerCase('pt-BR'))) {
      setErro('Já existe um aventureiro com esse apelido.')
      return
    }
    if (modal === 'criar' && perfis.length >= 50) { setErro('Limite de 50 perfis neste navegador.'); return }
    const novos = modal === 'editar'
      ? perfis.map(p => p.id === editandoId ? { ...p, apelido: validacao.apelido, avatar } : p)
      : [...perfis, { id: crypto.randomUUID(), apelido: validacao.apelido, avatar }]
    if (persistir(novos)) fechar()
  }

  function excluir() {
    if (!editandoId) return
    if (!window.confirm('Excluir este perfil deste navegador? Essa ação não apaga a Ficha V8.')) return
    const novos = perfis.filter(p => p.id !== editandoId)
    if (persistir(novos)) {
      if (localStorage.getItem(SELECTED_KEY) === editandoId) localStorage.removeItem(SELECTED_KEY)
      fechar()
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0c19] text-[#f4f0ff] px-4 py-5 sm:py-8" style={{ backgroundImage: 'radial-gradient(circle at 80% 0%, #292047 0%, transparent 38%)' }}>
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-3">
          <Link href="/portal" className="font-bold tracking-wide text-lg sm:text-xl"><span className="text-[#b99bff]">☾</span> PRG System</Link>
          <button onClick={abrirCriacao} className="rounded-lg border border-[#62527e] bg-[#34294f] px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-[#4b396f] focus-visible:outline-2 focus-visible:outline-[#b99bff]">
            + Criar perfil
          </button>
        </header>

        <section className="flex min-h-[65vh] flex-col items-center justify-center py-12">
          <p className="text-xs uppercase tracking-[.24em] text-[#ed9cd8]">🌙 Portal dos Aventureiros</p>
          <h1 className="mt-4 text-center text-2xl font-bold sm:text-4xl">Quem vai se aventurar hoje?</h1>
          <p className="mt-3 text-center text-sm text-[#b4aeca]">Escolha um perfil para continuar sua jornada.</p>

          <div aria-label="Escolha um aventureiro" className="mt-10 flex w-full max-w-4xl flex-wrap justify-center gap-5 sm:gap-8">
            {perfis.map(perfil => (
              <div key={perfil.id} className="group relative flex w-28 flex-col items-center gap-3 sm:w-36">
                {gerenciando && (
                  <button onClick={() => abrirEdicao(perfil)} aria-label={'Editar perfil ' + perfil.apelido}
                    className="absolute -right-1 -top-2 z-10 rounded-full border border-[#b99bff] bg-[#34294f] px-2 py-1 text-sm shadow-lg">✎</button>
                )}
                <Link href={'/ficha-v8?personagem=' + encodeURIComponent(perfil.id)}
                  onClick={() => localStorage.setItem(SELECTED_KEY, perfil.id)}
                  className="flex w-full flex-col items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b99bff]">
                  <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-[#51466a] bg-[#28233e] text-5xl font-bold text-[#b99bff] shadow-xl transition-all duration-200 group-hover:scale-105 group-hover:border-[#b99bff] group-hover:shadow-[0_0_24px_#7654bb66]">
                    {perfil.avatar ? <img src={perfil.avatar} alt="" className="h-full w-full object-cover" /> : perfil.apelido[0].toUpperCase()}
                  </div>
                  <span className="max-w-full break-words text-center text-sm font-medium text-[#b4aeca] group-hover:text-white">{perfil.apelido}</span>
                </Link>
              </div>
            ))}
            {perfis.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#51466a] px-8 py-10 text-center text-[#b4aeca]">
                Ainda não há aventureiros neste dispositivo.<br />Crie o primeiro perfil para começar!
              </div>
            )}
          </div>
          <button onClick={() => setGerenciando(!gerenciando)}
            className="mt-10 rounded-lg border border-[#62527e] px-5 py-2 text-sm text-[#b99bff] hover:bg-[#34294f]">
            {gerenciando ? '✓ Concluir edição' : '✎ Gerenciar perfis'}
          </button>
        </section>
        <p className="mx-auto max-w-2xl pb-6 text-center text-xs text-[#b4aeca]">
          Versão de testes: os perfis e fotos ficam apenas neste navegador. A Ficha V8 também usa armazenamento local.
          Não há sincronização entre dispositivos; guarde backups das suas fichas.
        </p>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-4"
          onMouseDown={event => { if (event.target === event.currentTarget) fechar() }}>
          <section role="dialog" aria-modal="true" aria-labelledby="modal-title"
            onKeyDown={event => { if (event.key === 'Escape') fechar() }}
            className="my-auto w-full max-w-md rounded-2xl border border-[#62527e] bg-[#19172c] p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 id="modal-title" className="text-xl font-bold">{modal === 'criar' ? 'Criar aventureiro' : 'Editar aventureiro'}</h2>
              <button onClick={fechar} aria-label="Fechar janela" className="rounded-lg px-2 py-1 text-[#b4aeca] hover:bg-[#34294f]">✕</button>
            </div>
            <p className="mt-2 text-sm text-[#b4aeca]">Personalize sua identidade no portal.</p>
            <form onSubmit={salvar} className="mt-5 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border-2 border-[#62527e] bg-[#28233e] text-4xl font-bold text-[#b99bff]">
                  {avatar ? <img src={avatar} alt="Prévia da foto de perfil" className="h-full w-full object-cover" /> : (apelido.trim()[0] || '✦').toUpperCase()}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={selecionarFoto} className="sr-only" aria-label="Selecionar foto de perfil" />
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={processando}
                    className="rounded-lg border border-[#62527e] bg-[#34294f] px-3 py-2 text-sm hover:bg-[#4b396f] disabled:opacity-50">
                    {processando ? 'Processando...' : '📷 Escolher foto'}
                  </button>
                  {avatar && <button type="button" onClick={() => setAvatar(undefined)} className="rounded-lg border border-[#62527e] px-3 py-2 text-sm">Remover foto</button>}
                </div>
                <p className="text-center text-xs text-[#b4aeca]">JPG, PNG ou WebP até 5 MB. Recorte quadrado central automático.</p>
              </div>
              <div>
                <label htmlFor="apelido" className="mb-2 block text-sm text-[#b4aeca]">Apelido do aventureiro</label>
                <input ref={nameRef} id="apelido" value={apelido} onChange={e => setApelido(e.target.value)}
                  maxLength={40} required placeholder="Ex.: Wed Nyx"
                  className="w-full rounded-lg border border-[#4a4267] bg-[#100f20] p-3 text-white outline-none focus:border-[#b99bff]" />
              </div>
              {erro && <p role="alert" className="rounded-lg border border-red-500/40 p-3 text-sm text-red-200">{erro}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={fechar} className="flex-1 rounded-lg border border-[#62527e] px-3 py-3">Cancelar</button>
                <button type="submit" disabled={processando} className="flex-1 rounded-lg border border-[#a689e5] bg-[#7654bb] px-3 py-3 font-semibold hover:bg-[#8a67ce] disabled:opacity-50">
                  {modal === 'criar' ? 'Criar perfil' : 'Salvar alterações'}
                </button>
              </div>
              {modal === 'editar' && <button type="button" onClick={excluir} className="w-full rounded-lg py-2 text-sm text-[#ff9eb5] hover:bg-[#4b253a]">Excluir perfil deste dispositivo</button>}
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
