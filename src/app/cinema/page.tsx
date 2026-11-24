'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReprodutorCinema from '@/components/cinema/ReprodutorCinema'
import type { EstadoCinema } from '@/lib/nuvem/cinema'
type Sala = { codigo: string; nome: string; estado: EstadoCinema; revisao: number; agora: number; token?: string }
export default function Cinema() {
  const [sala, setSala] = useState<Sala | null>(null)
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [token, setToken] = useState('')
  const [url, setUrl] = useState('')
  const [titulo, setTitulo] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [desvio, setDesvio] = useState(0)
  const ativa = sala?.codigo
  async function consultar(c: string, signal?: AbortSignal) {
    const inicio = Date.now()
    const res = await fetch('/api/prg/cinema?codigo=' + encodeURIComponent(c), { cache: 'no-store', signal })
    const d = await res.json()
    if (!res.ok) throw new Error(d.erro || 'Sala indisponível.')
    setDesvio(d.agora - (inicio + Date.now()) / 2)
    setSala(old => old?.codigo === d.codigo && old.revisao > d.revisao ? old : d)
  }
  useEffect(() => {
    if (!ativa) return
    const controller = new AbortController()
    const t = window.setInterval(() => { void consultar(ativa, controller.signal).catch(() => {}) }, 2500)
    return () => { clearInterval(t); controller.abort() }
  }, [ativa])
  async function enviar(acao: string, extra: Record<string, unknown> = {}) {
    setOcupado(true); setErro('')
    try {
      const res = await fetch('/api/prg/cinema', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ acao, codigo: ativa, token, ...extra }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.erro || 'Não foi possível executar a ação.')
      if (d.token) { setToken(d.token); sessionStorage.setItem('cinema:' + d.codigo, d.token) }
      setDesvio(d.agora - Date.now()); setSala(d)
      if (acao === 'adicionar') { setUrl(''); setTitulo('') }
    } catch (e) { setErro(e instanceof Error ? e.message : 'Falha na conexão.') }
    finally { setOcupado(false) }
  }
  async function entrar() {
    setOcupado(true); setErro('')
    try { const c = codigo.trim().toUpperCase(); await consultar(c); setToken(sessionStorage.getItem('cinema:' + c) || '') }
    catch (e) { setErro(e instanceof Error ? e.message : 'Sala indisponível.') }
    finally { setOcupado(false) }
  }
  const botao = 'rounded-lg bg-violet-700 px-4 py-3 font-semibold disabled:opacity-50 hover:bg-violet-600'
  const campo = 'w-full rounded-lg border border-violet-900 bg-zinc-900 p-3 text-white'
  return <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs tracking-widest text-violet-400">PRG SYSTEM · EASTER EGG</p><h1 className="text-3xl font-bold">Cinema Secreto</h1></div><Link href="/portal" className="text-violet-300">Voltar ao portal</Link></header>
      {erro && <p role="alert" className="rounded-lg bg-red-950 p-3">{erro}</p>}
      {!sala ? <div className="grid gap-5 md:grid-cols-2">
        <form className="space-y-4 rounded-2xl border border-zinc-800 p-6" onSubmit={e => { e.preventDefault(); void enviar('criar', { nome }) }}><h2 className="text-xl font-bold">Criar sessão</h2><label>Nome da sala<input className={campo} required maxLength={80} value={nome} onChange={e => setNome(e.target.value)} /></label><button className={botao} disabled={ocupado}>Criar cinema</button></form>
        <form className="space-y-4 rounded-2xl border border-zinc-800 p-6" onSubmit={e => { e.preventDefault(); void entrar() }}><h2 className="text-xl font-bold">Entrar com convite</h2><label>Código da sala<input className={campo} required maxLength={16} value={codigo} onChange={e => setCodigo(e.target.value)} /></label><button className={botao} disabled={ocupado}>Entrar</button></form>
      </div> : <>
        <div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold">{sala.nome}</h2><span>{token ? 'Anfitrião' : 'Espectador'}</span><code>{sala.codigo}</code><button className={botao} onClick={() => { void navigator.clipboard.writeText(sala.codigo).catch(() => setErro('Copie o código manualmente.')) }}>Copiar convite</button><button className={botao} onClick={() => { setSala(null); setToken('') }}>Sair</button></div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4"><ReprodutorCinema estado={sala.estado} desvio={desvio}/>{token && <div className="flex flex-wrap gap-2">{(['voltar','pausar','continuar','avancar'] as const).map((a,i) => <button key={a} className={botao} disabled={ocupado} onClick={() => void enviar(a)}>{['−10 s','Pausar','Reproduzir','+10 s'][i]}</button>)}</div>}</div>
          <aside className="space-y-4 rounded-2xl border border-zinc-800 p-4"><h2 className="text-xl font-bold">Fila de vídeos</h2>{token && <form className="space-y-2" onSubmit={e => { e.preventDefault(); void enviar('adicionar', { url, titulo }) }}><input aria-label="Link do YouTube" className={campo} required placeholder="Link do YouTube" value={url} onChange={e => setUrl(e.target.value)}/><input aria-label="Título opcional" className={campo} placeholder="Título opcional" value={titulo} onChange={e => setTitulo(e.target.value)}/><button className={botao} disabled={ocupado}>Adicionar</button></form>}
          {sala.estado.fila.map((v,i) => <div key={i} className={'rounded-lg p-3 break-words ' + (i === sala.estado.atual ? 'bg-violet-950' : 'bg-zinc-900')}><p>{i+1}. {v.titulo}</p>{token && <button className="text-violet-300" disabled={ocupado} onClick={() => void enviar('selecionar',{indice:i})}>Selecionar</button>}</div>)}
          {!sala.estado.fila.length && <p className="text-zinc-400">Nenhum vídeo na fila.</p>}</aside>
        </div>
      </>}
    </div>
  </main>
}
