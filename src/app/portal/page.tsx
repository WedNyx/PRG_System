'use client'

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { validarApelidoAventureiro } from '@/lib/auth/aventureiro'
import { useRouter } from 'next/navigation'
import TransicaoPerfil from '@/components/perfil/TransicaoPerfil'
import SaudePlataforma from '@/components/admin/SaudePlataforma'

type Perfil = { id: string; apelido: string; avatar?: string }
const KEY = 'prg-aventureiros-demo-v1'
const SELECTED_KEY = 'prg-aventureiro-selecionado-v1'
const CLOUD_ENABLED = process.env.NEXT_PUBLIC_PRG_SHARED_PROFILES === 'true'
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

function lerImagem(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return reject(new Error('Use JPG, PNG ou WebP.'))
    if (file.size > MAX_AVATAR_BYTES) return reject(new Error('Limite de 5 MB por foto.'))
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Erro ao ler a imagem.'))
    reader.readAsDataURL(file)
  })
}

export default function PortalAventureiros() {
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [versao, setVersao] = useState<{ version: string; revision: string | null } | null>(null)
  const [modal, setModal] = useState<'criar' | 'editar' | null>(null)
  const [gerenciando, setGerenciando] = useState(false)
  const [senhaAdmin, setSenhaAdmin] = useState('')
  const [entrando, setEntrando] = useState<{ perfil: Perfil; origem: DOMRect; destino: string } | null>(null)
  const router = useRouter()
  const [pedindoSenha, setPedindoSenha] = useState(false)
  const [vendoSaude, setVendoSaude] = useState(false)
  const [senhaDigitada, setSenhaDigitada] = useState('')
  const [erroSenha, setErroSenha] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [apelido, setApelido] = useState('')
  const [avatar, setAvatar] = useState<string | undefined>()
  const [erro, setErro] = useState('')
  const [processando, setProcessando] = useState(false)
  const [crop, setCrop] = useState<string | null>(null)
  const [cropSize, setCropSize] = useState({ width: 1, height: 1 })
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragging = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPerfis(lerPerfis())
    if (!CLOUD_ENABLED) return
    let active = true
    fetch('/api/aventureiros', { cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error('Nuvem indisponível'); return response.json() })
      .then(data => { if (active && Array.isArray(data.perfis)) setPerfis(data.perfis) })
      .catch(() => { if (active) setErro('Nuvem indisponível. Seus perfis locais continuam preservados.') })
    return () => { active = false }
  }, [])
  useEffect(() => {
    let active = true
    fetch('/api/version', { cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('Versão indisponível'); return response.json() })
      .then(data => { if (active && typeof data.version === 'string') setVersao(data) })
      .catch(() => {})
    return () => { active = false }
  }, [])
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

  function constrain(x: number, y: number, z = zoom) {
    const scale = Math.max(256 / cropSize.width, 256 / cropSize.height) * z
    const maxX = Math.max(0, (cropSize.width * scale - 256) / 2)
    const maxY = Math.max(0, (cropSize.height * scale - 256) / 2)
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) }
  }

  async function confirmarFoto() {
    if (!crop) return
    setProcessando(true)
    try {
      const image = new Image()
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Imagem inválida'))
        image.src = crop
      })
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 320
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Erro ao preparar a foto.')
      const scale = Math.max(320 / image.width, 320 / image.height) * zoom
      const p = constrain(position.x, position.y)
      context.drawImage(image, (320 - image.width * scale) / 2 + p.x * 1.25,
        (320 - image.height * scale) / 2 + p.y * 1.25, image.width * scale, image.height * scale)
      setAvatar(canvas.toDataURL('image/jpeg', 0.78))
      setCrop(null)
    } catch { setErro('Não foi possível recortar a imagem.') }
    finally { setProcessando(false) }
  }

  function fechar() {
    setCrop(null)
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
    if (CLOUD_ENABLED) { setErro('A edição na nuvem ainda não está disponível.'); return }
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
    try {
      const src = await lerImagem(file)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Imagem inválida.'))
        img.src = src
      })
      setCropSize({ width: img.naturalWidth, height: img.naturalHeight })
      setPosition({ x: 0, y: 0 })
      setZoom(1)
      setCrop(src)
    }
    catch (error) { setErro(error instanceof Error ? error.message : 'Falha ao carregar a foto.') }
    finally { setProcessando(false) }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (crop) { setErro('Confirme o recorte da foto primeiro.'); return }
    const validacao = validarApelidoAventureiro(apelido)
    if (!validacao.ok) { setErro(validacao.erro); return }
    if (perfis.some(p => p.id !== editandoId && p.apelido.toLocaleLowerCase('pt-BR') === validacao.apelido.toLocaleLowerCase('pt-BR'))) {
      setErro('Já existe um aventureiro com esse apelido.')
      return
    }
    if (!CLOUD_ENABLED && modal === 'criar' && perfis.length >= 50) { setErro('Limite de 50 perfis neste navegador.'); return }
    if (CLOUD_ENABLED) {
      if (modal !== 'criar') { setErro('A edição de perfis da nuvem será liberada após definirmos a proteção.'); return }
      setProcessando(true)
      try {
        const response = await fetch('/api/aventureiros', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apelido: validacao.apelido, avatar }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.erro || 'Não foi possível salvar na nuvem.')
        setPerfis(current => [...current, result.perfil])
        fechar()
      } catch (error) { setErro(error instanceof Error ? error.message : 'Falha ao salvar.') }
      finally { setProcessando(false) }
      return
    }
    const novos = modal === 'editar'
      ? perfis.map(p => p.id === editandoId ? { ...p, apelido: validacao.apelido, avatar } : p)
      : [...perfis, { id: crypto.randomUUID(), apelido: validacao.apelido, avatar }]
    if (persistir(novos)) fechar()
  }

  function excluir() {
    if (CLOUD_ENABLED) { setErro('Exclusão na nuvem indisponível nesta etapa.'); return }
    if (!editandoId) return
    if (!window.confirm('Excluir este perfil deste navegador? Essa ação não apaga a Ficha V8.')) return
    const novos = perfis.filter(p => p.id !== editandoId)
    if (persistir(novos)) {
      if (localStorage.getItem(SELECTED_KEY) === editandoId) localStorage.removeItem(SELECTED_KEY)
      fechar()
    }
  }

  async function alternarGerenciar() {
    if (gerenciando) { setGerenciando(false); setSenhaAdmin(''); return }
    if (!CLOUD_ENABLED) { setGerenciando(true); return }
    setSenhaDigitada(''); setErroSenha(''); setPedindoSenha(true)
  }

  async function conferirSenha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProcessando(true); setErroSenha('')
    try {
      const response = await fetch('/api/aventureiros/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: senhaDigitada }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.erro || 'Senha incorreta.')
      setSenhaAdmin(senhaDigitada); setSenhaDigitada(''); setPedindoSenha(false); setGerenciando(true)
    } catch (error) { setErroSenha(error instanceof Error ? error.message : 'Falha ao conferir a senha.') }
    finally { setProcessando(false) }
  }

  async function removerDaNuvem(perfil: Perfil) {
    if (!window.confirm(`Remover o perfil "${perfil.apelido}" da plataforma?\n\nAs fichas, playlists e participações dele serão apagadas. Isso não pode ser desfeito.`)) return
    setProcessando(true); setErro('')
    try {
      const response = await fetch('/api/aventureiros/' + perfil.id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha: senhaAdmin }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.erro || 'Não foi possível remover.')
      setPerfis(atual => atual.filter(p => p.id !== perfil.id))
      try { if (localStorage.getItem(SELECTED_KEY) === perfil.id) localStorage.removeItem(SELECTED_KEY) } catch {}
    } catch (error) { setErro(error instanceof Error ? error.message : 'Falha ao remover.') }
    finally { setProcessando(false) }
  }

  return (
    <main className="min-h-screen fundo-tema text-[#f4f0ff] px-4 py-5 sm:py-8">
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
                {gerenciando && !CLOUD_ENABLED && (
                  <button onClick={() => abrirEdicao(perfil)} aria-label={'Editar perfil ' + perfil.apelido}
                    className="absolute -right-1 -top-2 z-10 rounded-full border border-[#b99bff] bg-[#34294f] px-2 py-1 text-sm shadow-lg">✎</button>
                )}
                {gerenciando && CLOUD_ENABLED && senhaAdmin && (
                  <button onClick={() => removerDaNuvem(perfil)} disabled={processando} aria-label={'Remover perfil ' + perfil.apelido}
                    className="absolute -right-1 -top-2 z-10 rounded-full border border-[#ff9eb5] bg-[#4b253a] px-2 py-1 text-sm shadow-lg disabled:opacity-50">🗑</button>
                )}
                <Link href={'/central?personagem=' + encodeURIComponent(perfil.id)}
                  onClick={event => {
                    event.preventDefault()
                    try { localStorage.setItem(SELECTED_KEY, perfil.id) } catch {}
                    // Volta para um convite aberto antes de escolher o perfil (somente caminhos internos).
                    const depois = new URLSearchParams(window.location.search).get('depois')
                    const destino = depois && /^\/convite\/[A-Za-z0-9-]{1,20}$/.test(depois) ? depois : '/central?personagem=' + encodeURIComponent(perfil.id)
                    if (entrando) return
                    router.prefetch(destino)
                    const caixa = event.currentTarget.querySelector('div')?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect()
                    setEntrando({ perfil, origem: caixa, destino })
                  }}
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
                {CLOUD_ENABLED ? 'Ainda não há aventureiros compartilhados.' : 'Ainda não há aventureiros neste dispositivo.'}<br />Crie o primeiro perfil para começar!
              </div>
            )}
          </div>
          {erro && !modal && <p role="alert" className="mt-6 max-w-md rounded-lg border border-red-500/40 p-3 text-center text-sm text-red-200">{erro}</p>}
          {gerenciando && CLOUD_ENABLED && <p className="mt-6 text-center text-sm text-[#ed9cd8]">Modo administrador: toque na 🗑 para remover um perfil.</p>}
          {gerenciando && CLOUD_ENABLED && senhaAdmin && <button type="button" onClick={() => setVendoSaude(true)}
            className="mt-3 rounded-lg border border-[#ed9cd8]/60 px-5 py-2 text-sm text-[#ed9cd8] hover:bg-[#34294f]">🩺 Saúde da plataforma e cópias de segurança</button>}
          <button onClick={alternarGerenciar}
            className="mt-6 rounded-lg border border-[#62527e] px-5 py-2 text-sm text-[#b99bff] hover:bg-[#34294f]">
            {gerenciando ? '✓ Concluir' : '🔒 Gerenciar perfis'}
          </button>
          {CLOUD_ENABLED && <p className="mt-2 text-center text-xs text-[#8f86a8]">Para mudar seu nome ou foto, entre no seu perfil e use “Editar perfil” no menu.</p>}
        </section>
        <div className="flex flex-wrap items-center justify-center gap-3 pb-3 text-xs text-[#b4aeca]">
          <Link href="/novidades" title="Ver novidades desta versão" className="underline underline-offset-2">PRG System v{versao?.version ?? '0.16.1'}</Link>
          {versao?.revision && <span title="Identificador da implantação">Build {versao.revision}</span>}
          <button type="button" onClick={() => window.location.reload()}
            className="rounded-md border border-[#62527e] px-2 py-1 text-[#b99bff] hover:bg-[#34294f]">
            ↻ Verificar atualização
          </button>
        </div>
        <p className="mx-auto max-w-2xl pb-6 text-center text-xs text-[#b4aeca]">
          {CLOUD_ENABLED ? 'Perfis e fichas ficam na nuvem e abrem em qualquer aparelho.' : 'Versão de testes: os perfis, fotos e fichas ficam apenas neste navegador; guarde backups.'}
        </p>
      </div>

      {vendoSaude && senhaAdmin && <SaudePlataforma senha={senhaAdmin} fechar={() => setVendoSaude(false)} />}

      {entrando && <TransicaoPerfil perfil={entrando.perfil} origem={entrando.origem} aoTerminar={() => router.push(entrando.destino)} />}

      {pedindoSenha && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setPedindoSenha(false) }}>
          <form onSubmit={conferirSenha} role="dialog" aria-modal="true" aria-labelledby="senha-titulo" onKeyDown={event => { if (event.key === 'Escape') setPedindoSenha(false) }}
            className="w-full max-w-sm rounded-2xl border border-[#62527e] bg-[#19172c] p-5 shadow-2xl">
            <h2 id="senha-titulo" className="text-lg font-bold">🔒 Área do administrador</h2>
            <p className="mt-1 text-sm text-[#b4aeca]">Digite a senha para remover perfis e ver a saúde da plataforma.</p>
            <input type="password" autoFocus autoComplete="current-password" value={senhaDigitada} onChange={e => setSenhaDigitada(e.target.value)} maxLength={200} aria-label="Senha do administrador"
              className="mt-4 w-full rounded-lg border border-[#4a4267] bg-[#100f20] p-3 text-white outline-none focus:border-[#b99bff]" />
            {erroSenha && <p role="alert" className="mt-3 text-sm text-red-200">{erroSenha}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setPedindoSenha(false)} className="flex-1 rounded-lg border border-[#62527e] p-2.5">Cancelar</button>
              <button type="submit" disabled={processando || !senhaDigitada} className="flex-1 rounded-lg bg-[#7654bb] p-2.5 font-semibold disabled:opacity-50">{processando ? 'Conferindo…' : 'Entrar'}</button>
            </div>
          </form>
        </div>
      )}

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
                <p className="text-center text-xs text-[#b4aeca]">JPG, PNG ou WebP até 5 MB.</p>
                {crop && (
                  <div className="w-full rounded-xl border border-[#62527e] bg-[#100f20] p-3">
                    <p className="mb-3 text-center text-sm text-[#ed9cd8]">Arraste e ajuste sua foto</p>
                    <div className="relative mx-auto h-64 w-64 touch-none overflow-hidden rounded-xl border-2 border-[#b99bff]"
                      onPointerDown={e => {
                        e.currentTarget.setPointerCapture(e.pointerId)
                        dragging.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y }
                      }}
                      onPointerMove={e => {
                        const d = dragging.current
                        if (d) setPosition(constrain(d.px + e.clientX - d.x, d.py + e.clientY - d.y))
                      }}
                      onPointerUp={() => { dragging.current = null }}
                      onPointerCancel={() => { dragging.current = null }}>
                      <img src={crop} alt="Prévia do recorte" draggable={false}
                        className="pointer-events-none absolute max-w-none select-none"
                        style={{
                          width: cropSize.width * Math.max(256 / cropSize.width, 256 / cropSize.height) * zoom,
                          height: cropSize.height * Math.max(256 / cropSize.width, 256 / cropSize.height) * zoom,
                          left: '50%', top: '50%',
                          transform: 'translate(calc(-50% + ' + position.x + 'px), calc(-50% + ' + position.y + 'px))'
                        }} />
                    </div>
                    <label htmlFor="avatar-zoom" className="mt-3 block text-sm text-[#b4aeca]">Zoom: {Math.round(zoom * 100)}%</label>
                    <input id="avatar-zoom" type="range" min="1" max="3" step="0.05" value={zoom}
                      onChange={e => {
                        const next = Number(e.target.value)
                        setZoom(next)
                        setPosition(constrain(position.x, position.y, next))
                      }} className="w-full accent-[#b99bff]" />
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => setCrop(null)} className="flex-1 rounded-lg border border-[#62527e] p-2 text-sm">Cancelar</button>
                      <button type="button" onClick={confirmarFoto} disabled={processando}
                        className="flex-1 rounded-lg bg-[#7654bb] p-2 text-sm font-semibold">Usar esta foto</button>
                    </div>
                  </div>
                )}
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
                <button type="submit" disabled={processando || Boolean(crop)} className="flex-1 rounded-lg border border-[#a689e5] bg-[#7654bb] px-3 py-3 font-semibold hover:bg-[#8a67ce] disabled:opacity-50">
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
