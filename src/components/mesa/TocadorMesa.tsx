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
export default function TocadorMesa({ estado, desvio }: { estado: EstadoMusica | undefined; desvio: number }) {
  const caixaYt = useRef<HTMLDivElement>(null)
  const yt = useRef<YTPlayer | null>(null)
  const audio = useRef<HTMLAudioElement | null>(null)
  const atual = useRef<EstadoMusica | undefined>(estado)
  // Só aparece depois que a mesa carregou (no navegador), então pode ler o localStorage aqui.
  const [volume, setVolume] = useState(lerVolume)
  const [mudo, setMudo] = useState(lerMudo)
  const [bloqueado, setBloqueado] = useState(false)
  const [aberto, setAberto] = useState(true)
  const desvioRef = useRef(desvio)
  useEffect(() => { desvioRef.current = desvio }, [desvio])

  const tocando = !!estado?.tocando && !!estado.url
  const chave = tocando ? `${estado!.musica_id}|${estado!.iniciada_em}` : ''
  const agora = () => Date.now() + desvioRef.current

  // Começa / troca / para a música quando o mestre muda.
  useEffect(() => {
    atual.current = estado
    if (!tocando) {
      yt.current?.stopVideo(); audio.current?.pause()
      return
    }
    const e = estado!
    let cancelado = false
    const inicio = posicaoAtual(e, agora()) ?? 0
    if (e.tipo === 'audio') {
      yt.current?.stopVideo()
      const a = audio.current ?? (audio.current = new Audio())
      a.src = e.url!; a.preload = 'auto'
      a.onloadedmetadata = () => {
        const p = posicaoAtual(atual.current!, agora(), a.duration)
        if (p === null) { a.pause(); return }
        a.currentTime = p
        a.play().then(() => setBloqueado(false)).catch(() => setBloqueado(true))
      }
      a.onended = () => { const s = atual.current; if (s?.tocando && s.loop) { a.currentTime = 0; void a.play().catch(() => {}) } }
      a.load()
    } else if (e.video_id) {
      audio.current?.pause()
      void carregarApiYoutube().then(YT => {
        if (cancelado || !caixaYt.current) return
        if (yt.current) { yt.current.loadVideoById({ videoId: e.video_id!, startSeconds: inicio }); return }
        const alvo = document.createElement('div'); caixaYt.current.replaceChildren(alvo)
        yt.current = new YT.Player(alvo, {
          width: '100%', height: '100%', videoId: e.video_id,
          playerVars: { autoplay: 1, start: Math.floor(inicio), playsinline: 1, rel: 0, modestbranding: 1 },
          events: {
            onReady: () => { const v = lerVolume(); yt.current?.setVolume(v); if (lerMudo()) yt.current?.mute(); const p = posicaoAtual(atual.current!, agora()); if (p !== null) yt.current?.seekTo(p, true); yt.current?.playVideo() },
            onStateChange: (ev: { data: number }) => {
              if (ev.data === 1) setBloqueado(false)
              if (ev.data === 0) { const s = atual.current; if (s?.tocando && s.loop) { yt.current?.seekTo(0, true); yt.current?.playVideo() } }
            },
          },
        })
      })
      // Se depois de alguns segundos não estiver tocando, o navegador bloqueou o som automático.
      const t = setTimeout(() => { if (!cancelado && yt.current && yt.current.getPlayerState?.() !== 1 && atual.current?.tocando) setBloqueado(true) }, 3500)
      return () => { cancelado = true; clearTimeout(t) }
    }
    return () => { cancelado = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  // Mantém todo mundo no mesmo ponto da música (corrige atrasos maiores que 2,5 s).
  useEffect(() => {
    if (!tocando) return
    const t = setInterval(() => {
      const e = atual.current; if (!e?.tocando) return
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
  }, [tocando, chave])

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
      audio.current.play().then(() => setBloqueado(false)).catch(() => setBloqueado(true))
    } else if (yt.current) {
      const p = posicaoAtual(e, agora(), yt.current.getDuration?.() || null); if (p !== null) yt.current.seekTo(p, true)
      yt.current.playVideo(); setBloqueado(false)
    }
  }

  const ehYt = tocando && estado?.tipo === 'youtube'
  return <div className={'absolute right-2 top-2 z-20 w-[220px] overflow-hidden rounded-xl border border-[#5e4b78] bg-[#19172c]/95 text-xs shadow-xl ' + (tocando ? '' : 'hidden')} aria-label="Música da mesa">
    <div className="flex items-center gap-1 px-2 py-1.5">
      <Music2 size={14} className="shrink-0 text-[#b99bff]" />
      <button type="button" onClick={() => setAberto(a => !a)} className="min-w-0 flex-1 truncate text-left" title={estado?.titulo}>{estado?.loop ? '🔁 ' : ''}{estado?.titulo ?? 'Música'}</button>
      <button type="button" onClick={() => setMudo(m => !m)} aria-label={mudo ? 'Ativar som' : 'Silenciar só para mim'} className="rounded p-0.5 hover:bg-[#34294f]">{mudo ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
    </div>
    {/* O player do YouTube fica sempre visível enquanto toca (regra do YouTube); “recolher” só esconde o volume. */}
    <div ref={caixaYt} className={ehYt ? 'aspect-video w-full' : 'hidden'} />
    {aberto && <label className="flex items-center gap-2 px-2 py-1.5">Volume <input type="range" min={0} max={100} value={volume} onChange={x => setVolume(Number(x.target.value))} className="flex-1" aria-label="Volume da música (só para você)" /></label>}
    {bloqueado && <button type="button" onClick={liberar} className="w-full bg-[#5b4380] px-2 py-2 font-semibold hover:bg-[#6b5190]">🔊 Ouvir a música da mesa</button>}
  </div>
}
