'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FastForward, Pause, Rewind, SkipBack, SkipForward, ArrowDown, ArrowUp, ChevronDown, ChevronRight, Inbox, ListMusic, Music2, Pencil, Play, Plus, Repeat, Search, Send, Square, Trash2, Upload, Undo2 } from 'lucide-react'
import { api } from '@/lib/nuvem/cliente'
import type { EstadoMusica } from '@/lib/nuvem/musica'
import { btn, input, msg } from './estilos'

type Musica = { id: string; titulo: string; url: string; tipo: 'youtube' | 'audio'; video_id: string | null; ordem: number }
type Playlist = { id: string; dono_id: string; nome: string; enviada: boolean; atualizada_em: string; dono: { apelido: string } | null; musicas: Musica[] }
type Dados = { minhas: Playlist[]; recebidas: Playlist[]; tocando: EstadoMusica; admin: boolean; buscaAtiva: boolean }
type Resultado = { video_id: string; url: string; titulo: string; canal: string; thumb: string | null }

/**
 * Aba “Música”. Todo mundo organiza as próprias playlists; jogadores enviam ao mestre.
 * O mestre vê as playlists recebidas (com o nome de quem enviou) e escolhe o que toca para a mesa.
 */
export default function PainelMusica({ campanhaId, eu, admin, espectador = false, tocando, aoMudar }: { campanhaId: string; eu: string; admin: boolean; espectador?: boolean; tocando?: EstadoMusica; aoMudar: () => void }) {
  const [d, setD] = useState<Dados | null>(null)
  const [aba, setAba] = useState<'minhas' | 'recebidas'>('minhas')
  const [aberta, setAberta] = useState<string | null>(null)
  const [novaNome, setNovaNome] = useState('')
  const base = `campanhas/${campanhaId}/musica`

  const carregar = useCallback(() => api<Dados>(base).then(setD).catch(er => toast.error(msg(er))), [base])
  useEffect(() => { void carregar(); const i = setInterval(() => void carregar(), 15000); return () => clearInterval(i) }, [carregar])

  async function fazer(body: Record<string, unknown>, ok?: string, mesa = false) {
    try { const r = await api<Record<string, unknown>>(base, { method: 'POST', body }); if (ok) toast.success(ok); await carregar(); if (mesa) aoMudar(); return r }
    catch (er) { toast.error(msg(er)); return null }
  }

  if (!d) return <p className="text-sm text-(--a-b4aeca)">Carregando músicas…</p>
  const t = tocando ?? d.tocando
  const donos = Object.values(d.recebidas.reduce<Record<string, { nome: string; listas: Playlist[] }>>((acc, p) => {
    (acc[p.dono_id] ??= { nome: p.dono?.apelido ?? 'Jogador', listas: [] }).listas.push(p); return acc
  }, {}))

  return <div className="space-y-3 text-sm">
    {/* Tocando agora */}
    <section className="rounded-xl border border-(--a-373251) bg-(--s-1b1830) p-3">
      <p className="text-xs uppercase tracking-wide text-(--a-9d93b8)">Tocando na mesa</p>
      {t.tocando ? <p className="mt-1 flex items-center gap-2 font-semibold"><Music2 size={16} className="shrink-0 text-(--a-b99bff)" /><span className="truncate">{t.titulo}</span></p>
        : <p className="mt-1 text-(--a-b4aeca)">Nenhuma música tocando.</p>}
      {admin && t.tocando && <div className="mt-3 flex items-center justify-center gap-1" role="group" aria-label="Controles da música">
        <button type="button" className={btn} onClick={() => void fazer({ acao: 'anterior' }, undefined, true)} aria-label="Música anterior" title="Anterior"><SkipBack size={16} /></button>
        <button type="button" className={btn} onClick={() => void fazer({ acao: 'pular', segundos: -10 }, undefined, true)} aria-label="Voltar 10 segundos" title="−10 s"><Rewind size={16} /></button>
        <button type="button" className="inline-flex items-center gap-1 rounded-full bg-(--a-7654bb) px-4 py-2 text-sm font-semibold hover:bg-(--a-8a67ce)" onClick={() => void fazer({ acao: t.pausado ? 'continuar' : 'pausar' }, undefined, true)} aria-label={t.pausado ? 'Continuar' : 'Pausar'}>
          {t.pausado ? <><Play size={16} /> Continuar</> : <><Pause size={16} /> Pausar</>}</button>
        <button type="button" className={btn} onClick={() => void fazer({ acao: 'pular', segundos: 10 }, undefined, true)} aria-label="Avançar 10 segundos" title="+10 s"><FastForward size={16} /></button>
        <button type="button" className={btn} onClick={() => void fazer({ acao: 'proxima' }, undefined, true)} aria-label="Próxima música" title="Próxima"><SkipForward size={16} /></button>
      </div>}
      {admin && <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={btn + (t.loop ? ' bg-(--a-5b4380)' : '')} aria-pressed={!!t.loop} onClick={() => void fazer({ acao: 'loop', ativo: !t.loop }, t.loop ? 'Loop desligado' : 'Loop ligado', true)}><Repeat size={14} /> Loop {t.loop ? 'ligado' : 'desligado'}</button>
        <button type="button" className={btn} disabled={!t.tocando} onClick={() => void fazer({ acao: 'parar' }, 'Música parada', true)}><Square size={14} /> Parar</button>
      </div>}
      {!admin && t.pausado && <p className="mt-1 text-xs text-amber-200">⏸ Pausada pelo mestre.</p>}
      {!admin && <p className="mt-1 text-xs text-(--a-9d93b8)">Só o mestre toca, pausa e avança. O volume é só seu, no mini player do mapa.</p>}
      {admin && <p className="mt-2 text-[11px] text-(--a-9d93b8)">Quando uma música acaba (sem loop), a próxima da mesma playlist começa sozinha.</p>}
    </section>
    {espectador && <p className="text-sm text-(--a-b4aeca)">👁️ Como espectador, você ouve a música da mesa. Playlists são dos jogadores e do mestre.</p>}

    {admin && <div className="flex gap-1">
      {([['minhas', ListMusic, 'Minhas playlists'], ['recebidas', Inbox, `Recebidas (${d.recebidas.length})`]] as const).map(([id, I, n]) =>
        <button key={id} type="button" onClick={() => setAba(id)} className={'flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs ' + (aba === id ? 'bg-(--a-5b4380)' : 'bg-(--s-1e1a30)')}><I size={14} /> {n}</button>)}
    </div>}

    {!espectador && (aba === 'minhas' || !admin) && <>
      <form className="flex gap-2" onSubmit={async ev => { ev.preventDefault(); if (!novaNome.trim()) return; const r = await fazer({ acao: 'playlist_criar', nome: novaNome }, 'Playlist criada!'); if (r) { setNovaNome(''); setAberta((r.playlist as Playlist).id) } }}>
        <input value={novaNome} onChange={x => setNovaNome(x.target.value)} maxLength={80} placeholder="Nova playlist (ex.: Combate, Taverna)" className={input} aria-label="Nome da nova playlist" />
        <button type="submit" className={btn}><Plus size={14} /> Criar</button>
      </form>
      {!d.minhas.length && <p className="text-(--a-b4aeca)">Você ainda não tem playlists. {admin ? 'Crie uma ou veja as que os jogadores enviaram.' : 'Crie uma e envie ao mestre!'}</p>}
      {d.minhas.map(p => <CartaoPlaylist key={p.id} p={p} minha admin={admin} aberta={aberta === p.id} alternar={() => setAberta(a => a === p.id ? null : p.id)}
        fazer={fazer} campanhaId={campanhaId} eu={eu} buscaAtiva={d.buscaAtiva} tocandoId={t.tocando ? t.musica_id ?? null : null} />)}
    </>}

    {admin && aba === 'recebidas' && <>
      {!donos.length && <p className="text-(--a-b4aeca)">Nenhum jogador enviou playlist ainda. Eles criam na aba 🎵 Música e tocam em “Enviar ao mestre”.</p>}
      {donos.map(g => <section key={g.nome + g.listas[0].dono_id} className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-(--a-e4d3ff)">De {g.nome}</h3>
        {g.listas.map(p => <CartaoPlaylist key={p.id} p={p} minha={false} admin aberta={aberta === p.id} alternar={() => setAberta(a => a === p.id ? null : p.id)}
          fazer={fazer} campanhaId={campanhaId} eu={eu} buscaAtiva={false} tocandoId={t.tocando ? t.musica_id ?? null : null} />)}
      </section>)}
    </>}
  </div>
}

type Fazer = (body: Record<string, unknown>, ok?: string, mesa?: boolean) => Promise<Record<string, unknown> | null>

function CartaoPlaylist({ p, minha, admin, aberta, alternar, fazer, campanhaId, eu, buscaAtiva, tocandoId }: {
  p: Playlist; minha: boolean; admin: boolean; aberta: boolean; alternar: () => void; fazer: Fazer; campanhaId: string; eu: string; buscaAtiva: boolean; tocandoId: string | null
}) {
  const [link, setLink] = useState('')
  const [titulo, setTitulo] = useState('')
  const [renomear, setRenomear] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Resultado[] | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function adicionar(url: string, tit?: string) {
    setOcupado(true)
    const r = await fazer({ acao: 'musica_adicionar', playlistId: p.id, url, titulo: tit || undefined }, 'Música adicionada!')
    setOcupado(false)
    if (r) { setLink(''); setTitulo('') }
  }
  async function buscar() {
    if (!busca.trim()) return
    setOcupado(true)
    try { setResultados((await api<{ resultados: Resultado[] }>(`campanhas/${campanhaId}/musica?buscar=${encodeURIComponent(busca)}`)).resultados) }
    catch (er) { toast.error(msg(er)) } finally { setOcupado(false) }
  }
  async function enviarArquivo(arq: File) {
    if (arq.size > 15 * 1024 * 1024) { toast.error('Áudio maior que 15 MB.'); return }
    setOcupado(true)
    try {
      const r = await fetch('/api/prg/mesa/' + campanhaId + '/upload', { method: 'POST', body: arq, headers: { 'Content-Type': arq.type || 'audio/mpeg', 'x-prg-aventureiro': eu } })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.erro || 'Falha no envio')
      await fazer({ acao: 'musica_adicionar', playlistId: p.id, url: j.url, titulo: arq.name.replace(/\.[^.]+$/, '').slice(0, 200) }, 'Áudio enviado!')
    } catch (er) { toast.error(msg(er)) } finally { setOcupado(false) }
  }

  return <div className="rounded-xl border border-(--a-373251) bg-(--s-17142a)">
    <div className="flex items-center gap-2 p-2">
      <button type="button" onClick={alternar} className="flex min-w-0 flex-1 items-center gap-1 text-left" aria-expanded={aberta}>
        {aberta ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span className="truncate font-semibold">{p.nome}</span>
        <span className="shrink-0 text-xs text-(--a-9d93b8)">· {p.musicas.length}</span>
      </button>
      {minha && !admin && (p.enviada
        ? <span className="shrink-0 rounded bg-[#244a35] px-1.5 py-0.5 text-[10px] text-green-200">Enviada</span>
        : <span className="shrink-0 rounded bg-(--s-2a2540) px-1.5 py-0.5 text-[10px] text-(--a-b4aeca)">Só sua</span>)}
    </div>

    {aberta && <div className="space-y-2 border-t border-(--a-373251) p-2">
      {minha && <div className="flex flex-wrap gap-2">
        {!admin && <button type="button" className={btn} onClick={() => void fazer({ acao: 'playlist_editar', id: p.id, enviada: !p.enviada }, p.enviada ? 'Envio cancelado' : 'Enviada ao mestre!')}>
          {p.enviada ? <><Undo2 size={14} /> Cancelar envio</> : <><Send size={14} /> Enviar ao mestre</>}</button>}
        <button type="button" className={btn} onClick={() => setRenomear(p.nome)}><Pencil size={14} /> Renomear</button>
        <button type="button" className={btn} onClick={() => { if (confirm(`Excluir a playlist "${p.nome}"?`)) void fazer({ acao: 'playlist_excluir', id: p.id }, 'Playlist excluída') }}><Trash2 size={14} /> Excluir</button>
      </div>}
      {renomear !== null && <form className="flex gap-2" onSubmit={async ev => { ev.preventDefault(); if (await fazer({ acao: 'playlist_editar', id: p.id, nome: renomear })) setRenomear(null) }}>
        <input value={renomear} onChange={x => setRenomear(x.target.value)} maxLength={80} className={input} aria-label="Novo nome" autoFocus />
        <button type="submit" className={btn}>Salvar</button>
      </form>}

      {!p.musicas.length && <p className="text-xs text-(--a-b4aeca)">Playlist vazia.</p>}
      <ol className="space-y-1">
        {p.musicas.map((m, i) => <li key={m.id} className={'flex items-center gap-1 rounded-lg px-1.5 py-1 ' + (tocandoId === m.id ? 'bg-(--s-3a2c58)' : 'bg-(--s-1e1a30)')}>
          <span className="w-5 shrink-0 text-center text-xs text-(--a-9d93b8)">{tocandoId === m.id ? '♪' : i + 1}</span>
          <span className="min-w-0 flex-1 truncate" title={m.titulo}>{m.tipo === 'youtube' ? '▶️ ' : '🎧 '}{m.titulo}</span>
          {admin && <button type="button" onClick={() => void fazer({ acao: 'tocar', musicaId: m.id }, 'Tocando para a mesa!', true)} aria-label={`Tocar ${m.titulo} para a mesa`} title="Tocar para a mesa" className="rounded p-1 text-green-300 hover:bg-(--s-34294f)"><Play size={15} /></button>}
          {minha && <>
            <button type="button" disabled={i === 0} onClick={() => void fazer({ acao: 'musica_mover', id: m.id, direcao: 'cima' })} aria-label="Subir" className="rounded p-1 hover:bg-(--s-34294f) disabled:opacity-30"><ArrowUp size={13} /></button>
            <button type="button" disabled={i === p.musicas.length - 1} onClick={() => void fazer({ acao: 'musica_mover', id: m.id, direcao: 'baixo' })} aria-label="Descer" className="rounded p-1 hover:bg-(--s-34294f) disabled:opacity-30"><ArrowDown size={13} /></button>
            <button type="button" onClick={() => void fazer({ acao: 'musica_remover', id: m.id })} aria-label={`Remover ${m.titulo}`} className="rounded p-1 text-red-300 hover:bg-(--s-34294f)"><Trash2 size={13} /></button>
          </>}
        </li>)}
      </ol>

      {minha && <div className="space-y-2 rounded-lg bg-(--s-120f22) p-2">
        <p className="text-xs font-semibold text-(--a-e4d3ff)">Adicionar música</p>
        <form className="space-y-1.5" onSubmit={ev => { ev.preventDefault(); if (link.trim()) void adicionar(link.trim(), titulo.trim()) }}>
          <input value={link} onChange={x => setLink(x.target.value)} placeholder="Link do YouTube ou de um áudio (mp3…)" className={input} aria-label="Link da música" inputMode="url" />
          <div className="flex gap-2">
            <input value={titulo} onChange={x => setTitulo(x.target.value)} maxLength={200} placeholder="Título (opcional)" className={input} aria-label="Título da música" />
            <button type="submit" disabled={ocupado || !link.trim()} className={btn}><Plus size={14} /> Pôr</button>
          </div>
        </form>
        <label className={btn + ' cursor-pointer'}><Upload size={14} /> Enviar áudio do aparelho (até 15 MB)
          <input type="file" accept="audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/aac,audio/webm,.mp3,.ogg,.wav,.m4a" className="sr-only" disabled={ocupado} onChange={x => { const f = x.target.files?.[0]; x.target.value = ''; if (f) void enviarArquivo(f) }} />
        </label>
        {buscaAtiva && <>
          <form className="flex gap-2" onSubmit={ev => { ev.preventDefault(); void buscar() }}>
            <input value={busca} onChange={x => setBusca(x.target.value)} maxLength={100} placeholder="Buscar no YouTube" className={input} aria-label="Buscar no YouTube" />
            <button type="submit" disabled={ocupado} className={btn}><Search size={14} /></button>
          </form>
          {resultados && (resultados.length ? <ul className="max-h-64 space-y-1 overflow-y-auto">
            {resultados.map(r => <li key={r.video_id} className="flex items-center gap-2 rounded-lg bg-(--s-1e1a30) p-1">
              {r.thumb && <img src={r.thumb} alt="" className="h-9 w-12 shrink-0 rounded object-cover" />}
              <span className="min-w-0 flex-1"><span className="block truncate text-xs" title={r.titulo}>{r.titulo}</span><span className="block truncate text-[10px] text-(--a-9d93b8)">{r.canal}</span></span>
              <button type="button" disabled={ocupado} onClick={() => void adicionar(r.url, r.titulo)} className={btn} aria-label={`Adicionar ${r.titulo}`}><Plus size={13} /></button>
            </li>)}
          </ul> : <p className="text-xs text-(--a-b4aeca)">Nada encontrado.</p>)}
        </>}
      </div>}
    </div>}
  </div>
}
