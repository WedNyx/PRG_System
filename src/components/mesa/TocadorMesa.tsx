'use client'

import { useEffect, useRef, useState } from 'react'
import { Music2, Volume2, VolumeX } from 'lucide-react'
import { posicaoAtual, type EstadoMusica } from '@/lib/nuvem/musica'

/* Tipos mínimos da API de iframe do YouTube (https://developers.google.com/youtube/iframe_api_reference). */
type YTPlayer = {
  loadVideoById(o: { videoId: string; startSeconds?: number }): void; playVideo(): void; pauseVideo(): void; stopVideo(): void
  seekTo(s: number, allow: boolean): void; getCurrentTime(): number; getDuration(): number; getPlayerState(): number
  setVolume(v: number): void; mute(): void; unMute(): void; destroy(): void
}
type YTGlobal = { Player: new (el: HTMLElement, o: Record<string, unknown>) => YTPlayer }
declare global { interface Window { YT?: YTGlobal; onYouTubeIframeAPIReady?: () => void } }

let apiYoutube: Promise<YTGlobal> | null = null
function carregarApiYoutube(): Promise<YTGlobal> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiYoutube ??= new Promise(res => {
    const antes = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { antes?.(); res(window.YT!) }
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true
    document.head.appendChild(s)
  })
  return apiYoutube
}

const lerVolume = () => { try { const v = Number(localStorage.getItem('prg-musica-volume')); return Number.isFinite(v) && localStorage.getItem('prg-musica-volume') !== null ? v : 70 } catch { return 70 } }
const lerMudo = () => { try { return localStorage.getItem('prg-musica-mudo') === '1' } catch { return false } }

/**
 * Toca para todo mundo da mesa a música escolhida pelo mestre, na mesma posição
 * (calculada a partir do horário em que ela começou, corrigido pelo relógio do servidor).
 * O volume e o “mudo” são de cada pessoa. O mini player do YouTube fica visível (regra do YouTube).
 */
export default function TocadorMesa({ estado, desvio, aoTerminar }: { estado: EstadoMusica | undefined; desvio: number; aoTerminar?: () => void }) {
  const caixaYt = useRef<HTMLDivElement>(null)
  const yt = useRef<YTPlayer | null>(null)
  const ytPronto = useRef(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const atual = useRef<EstadoMusica | undefined>(estado)
  // Só aparece depois que a mesa carregou (no navegador), então pode ler o localStorage aqui.
  const [volume, setVolume] = useState(lerVolume)
  const [mudo, setMudo] = useState(lerMudo)
  const [bloqueado, setBloqueado] = useState(false)
  const [aberto, setAberto] = useState(true)
  const desvioRef = useRef(desvio)
  const fimRef = useRef(aoTerminar)
  useEffect(() => { desvioRef.current = desvio }, [desvio])
  useEffect(() => { fimRef.current = aoTerminar }, [aoTerminar])
  useEffect(() => { atual.current = estado }, [estado])

  const tocando = !!estado?.tocando && !!estado.url
  /** Troca de música (recarrega a fonte). */
  const fonte = tocando ? `${estado!.musica_id}|${estado!.url}` : ''
  /** Comandos do mestre na mesma música: tocar de novo, pausar, continuar, pular. */
  const sinc = tocando ? `${estado!.iniciada_em}|${estado!.pausado ? 'p' : ''}|${estado!.posicao ?? ''}` : ''
  const agora = () => Date.now() + desvioRef.current

  /** Leva o player local exatamente para onde o mestre mandou (ponto, pausado ou tocando). */
  function sincronizar() {
    const e = atual.current
    if (!e?.tocando) { yt.current?.stopVideo?.(); audio.current?.pause(); return }
    if (e.tipo === 'audio' && audio.current) {
      const a = audio.current
      if (!a.duration) return
      const p = posicaoAtual(e, agora(), a.duration)
      if (p === null) { a.pause(); return }
      if (Math.abs(a.currentTime - p) > 0.8) a.currentTime = p
      if (e.pausado) a.pause()
      else if (a.paused) a.play().then(() => setBloqueado(false)).catch(() => setBloqueado(true))
    } else if (yt.current && ytPronto.current) {
      const d = yt.current.getDuration?.() || null
      const p = posicaoAtual(e, agora(), d)
      if (p === null) { yt.current.pauseVideo(); return }
      if (Math.abs((yt.current.getCurrentTime?.() ?? 0) - p) > 0.8) yt.current.seekTo(p, true)
      if (e.pausado) yt.current.pauseVideo(); else yt.current.playVideo()
    }
  }
  const terminou = () => {
    const e = atual.current
    if (!e?.tocando || e.pausado) return
    if (e.loop) { sincronizar(); return }
    fimRef.current?.() // o mestre que escolheu a música passa para a próxima
  }

  // Carrega a fonte quando a música muda.
  useEffect(() => {
    if (!tocando) { yt.current?.stopVideo?.(); audio.current?.pause(); return }
    const e = atual.current!
    let cancelado = false
    if (e.tipo === 'audio') {
      yt.current?.stopVideo?.()
      const a = audio.current ?? (audio.current = new Audio())
      a.volume = lerVolume() / 100; a.muted = lerMudo()
      a.src = e.url!; a.preload = 'auto'
      a.onloadedmetadata = () => sincronizar()
      a.onended = () => { if (atual.current?.loop) { a.currentTime = 0 } terminou() }
      a.load()
    } else if (e.video_id) {
      audio.current?.pause()
      const inicio = posicaoAtual(e, agora()) ?? 0
      void carregarApiYoutube().then(YT => {
        if (cancelado || !caixaYt.current) return
        if (yt.current) { yt.current.loadVideoById({ videoId: e.video_id!, startSeconds: inicio }); setTimeout(sincronizar, 800); return }
        const alvo = document.createElement('div'); caixaYt.current.replaceChildren(alvo)
        yt.current = new YT.Player(alvo, {
          width: '100%', height: '100%', videoId: e.video_id,
          // Sem controles do YouTube: só o mestre pausa/avança (pela aba Música).
          playerVars: { autoplay: 1, start: Math.floor(inicio), playsinline: 1, rel: 0, modestbranding: 1, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3 },
          events: {
            onReady: () => { ytPronto.current = true; yt.current?.setVolume(lerVolume()); if (lerMudo()) yt.current?.mute(); sincronizar() },
            onStateChange: (ev: { data: number }) => { if (ev.data === 1) setBloqueado(false); if (ev.data === 0) terminou() },
          },
        })
      })
      // Se depois de alguns segundos não estiver tocando, o navegador bloqueou o som automático.
      const t = setTimeout(() => { const s = atual.current; if (!cancelado && yt.current && !s?.pausado && yt.current.getPlayerState?.() !== 1 && s?.tocando) setBloqueado(true) }, 3500)
      return () => { cancelado = true; clearTimeout(t) }
    }
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fonte])

  // Comandos do mestre na mesma música.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tocando) sincronizar() }, [sinc, tocando])

  // Mantém todo mundo no mesmo ponto da música (corrige atrasos maiores que 2,5 s).
  useEffect(() => {
    if (!tocando) return
    const t = setInterval(() => {
      const e = atual.current; if (!e?.tocando) return
      if (e.pausado) { audio.current?.pause(); if (yt.current?.getPlayerState?.() === 1) yt.current.pauseVideo(); return }
      if (e.tipo === 'audio' && audio.current && audio.current.duration) {
        const a = audio.current, p = posicaoAtual(e, agora(), a.duration)
        if (p === null) { a.pause(); return }
        if (!a.paused && Math.abs(a.currentTime - p) > 2.5) a.currentTime = p
      } else if (yt.current?.getDuration) {
        const d = yt.current.getDuration(); if (!d) return
        const p = posicaoAtual(e, agora(), d)
        if (p === null) { if (yt.current.getPlayerState() === 1) yt.current.pauseVideo(); return }
        if (yt.current.getPlayerState() === 1 && Math.abs(yt.current.getCurrentTime() - p) > 2.5) yt.current.seekTo(p, true)
      }
    }, 5000)
    return () => clearInterval(t)
  }, [tocando, fonte])

  // Volume e mudo locais.
  useEffect(() => {
    try { localStorage.setItem('prg-musica-volume', String(volume)); localStorage.setItem('prg-musica-mudo', mudo ? '1' : '0') } catch {}
    if (audio.current) { audio.current.volume = volume / 100; audio.current.muted = mudo }
    if (yt.current?.setVolume) { yt.current.setVolume(volume); if (mudo) yt.current.mute(); else yt.current.unMute() }
  }, [volume, mudo])

  useEffect(() => () => { yt.current?.destroy?.(); yt.current = null; audio.current?.pause(); audio.current = null }, [])

  function liberar() {
    const e = atual.current; if (!e?.tocando) return
    if (e.tipo === 'audio' && audio.current) {
      const p = posicaoAtual(e, agora(), audio.current.duration || null); if (p !== null) audio.current.currentTime = p
      if (!e.pausado) audio.current.play().then(() => setBloqueado(false)).catch(() => setBloqueado(true))
    } else if (yt.current) { setBloqueado(false); sincronizar() }
  }

  const ehYt = tocando && estado?.tipo === 'youtube'
  return <div className={'absolute right-2 top-2 z-20 w-[220px] overflow-hidden rounded-xl border border-(--a-5e4b78) bg-(--s-19172c)/95 text-xs shadow-xl ' + (tocando ? '' : 'hidden')} aria-label="Música da mesa">
    <div className="flex items-center gap-1 px-2 py-1.5">
      <Music2 size={14} className="shrink-0 text-(--a-b99bff)" />
      <button type="button" onClick={() => setAberto(a => !a)} className="min-w-0 flex-1 truncate text-left" title={estado?.titulo}>{estado?.pausado ? '⏸ ' : estado?.loop ? '🔁 ' : ''}{estado?.titulo ?? 'Música'}</button>
      <button type="button" onClick={() => setMudo(m => !m)} aria-label={mudo ? 'Ativar som' : 'Silenciar só para mim'} className="rounded p-0.5 hover:bg-(--s-34294f)">{mudo ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
    </div>
    {/* O player do YouTube fica sempre visível enquanto toca (regra do YouTube); “recolher” só esconde o volume. */}
    <div className={ehYt ? 'relative aspect-video w-full' : 'hidden'}>
      <div ref={caixaYt} className="absolute inset-0" />
      {/* Camada por cima: ninguém pausa ou pula pelo vídeo; os controles são do mestre. */}
      <div className="absolute inset-0" aria-hidden="true" />
      {estado?.pausado && <span className="absolute inset-x-0 bottom-1 text-center text-[11px] font-semibold text-white drop-shadow">⏸ Pausada pelo mestre</span>}
    </div>
    {aberto && <label className="flex items-center gap-2 px-2 py-1.5">Volume <input type="range" min={0} max={100} value={volume} onChange={x => setVolume(Number(x.target.value))} className="flex-1" aria-label="Volume da música (só para você)" /></label>}
    {bloqueado && <button type="button" onClick={liberar} className="w-full bg-(--a-5b4380) px-2 py-2 font-semibold hover:bg-(--a-6b5190)">🔊 Ouvir a música da mesa</button>}
  </div>
}
