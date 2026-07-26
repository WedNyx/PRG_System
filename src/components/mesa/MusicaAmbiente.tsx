'use client'

import { useEffect, useRef, useState } from 'react'
import { Music, Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import { atualizarMusica } from '@/app/actions/campanhas'
import { buscarTituloVideo, extrairYoutubeId } from '@/lib/youtube'
import type { MusicaMesa } from '@/types/database'

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  loadVideoById: (videoId: string) => void
  setVolume: (v: number) => void
  getVideoData: () => { video_id?: string }
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elId: string,
        opts: {
          height: string
          width: string
          videoId?: string
          playerVars?: Record<string, string | number>
          events?: { onReady?: (e: { target: YTPlayer }) => void }
        }
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null
function carregarYoutubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve) => {
    const anterior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      anterior?.()
      resolve()
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiPromise
}

export default function MusicaAmbiente({
  campanhaId,
  musica,
  souMestre,
}: {
  campanhaId: string
  musica: MusicaMesa | null
  souMestre: boolean
}) {
  const [url, setUrl] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ativado, setAtivado] = useState(false)
  const [volume, setVolume] = useState(() =>
    typeof window === 'undefined' ? 60 : parseInt(localStorage.getItem('prg-musica-volume') ?? '60')
  )
  const [mudo, setMudo] = useState(() => typeof window !== 'undefined' && localStorage.getItem('prg-musica-mudo') === '1')
  const playerRef = useRef<YTPlayer | null>(null)
  const prontoRef = useRef(false)
  const musicaRef = useRef(musica)

  useEffect(() => {
    musicaRef.current = musica
  }, [musica])

  // Cria o player (invisível, só toca áudio) assim que o jogador libera com um clique
  useEffect(() => {
    if (!ativado) return
    let cancelado = false
    carregarYoutubeApi().then(() => {
      if (cancelado || !window.YT) return
      playerRef.current = new window.YT.Player('musica-ambiente-player', {
        height: '0',
        width: '0',
        videoId: musicaRef.current?.videoId,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: musicaRef.current?.videoId ?? '',
        },
        events: {
          onReady: ({ target }) => {
            prontoRef.current = true
            target.setVolume(mudo ? 0 : volume)
            if (musicaRef.current?.tocando) target.playVideo()
          },
        },
      })
    })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativado])

  // Reage a mudanças de faixa/play-pause vindas da mesa (tempo real)
  useEffect(() => {
    if (!prontoRef.current || !playerRef.current) return
    if (!musica) {
      playerRef.current.stopVideo()
      return
    }
    const atual = playerRef.current.getVideoData().video_id
    if (atual !== musica.videoId) {
      playerRef.current.loadVideoById(musica.videoId)
      if (!musica.tocando) setTimeout(() => playerRef.current?.pauseVideo(), 300)
    } else if (musica.tocando) {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }, [musica])

  useEffect(() => {
    localStorage.setItem('prg-musica-volume', String(volume))
    playerRef.current?.setVolume(mudo ? 0 : volume)
  }, [volume, mudo])

  useEffect(() => {
    localStorage.setItem('prg-musica-mudo', mudo ? '1' : '0')
  }, [mudo])

  async function tocar(e: React.FormEvent) {
    e.preventDefault()
    const id = extrairYoutubeId(url)
    if (!id) return
    setEnviando(true)
    const titulo = await buscarTituloVideo(id)
    await atualizarMusica(campanhaId, { videoId: id, titulo, tocando: true })
    setUrl('')
    setEnviando(false)
  }

  async function alternarPlayPause() {
    if (!musica) return
    await atualizarMusica(campanhaId, { ...musica, tocando: !musica.tocando })
  }

  async function parar() {
    await atualizarMusica(campanhaId, null)
  }

  return (
    <div className="flex-1 flex flex-col p-3 min-h-0">
      <div id="musica-ambiente-player" className="hidden" />

      {!ativado ? (
        <button
          onClick={() => setAtivado(true)}
          className="w-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-sm font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Music size={16} /> Ativar música da mesa
        </button>
      ) : (
        <>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-3 mb-3">
            {musica ? (
              <>
                <p className="text-xs text-slate-500 mb-1">Tocando agora</p>
                <p className="text-sm text-slate-200 truncate mb-2">🎵 {musica.titulo}</p>
                <div className="flex items-center gap-2">
                  {souMestre && (
                    <>
                      <button
                        onClick={alternarPlayPause}
                        className="bg-slate-700 hover:bg-slate-600 text-slate-100 p-2 rounded-lg transition-colors"
                      >
                        {musica.tocando ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={parar}
                        className="bg-slate-700 hover:bg-red-900 text-slate-300 hover:text-red-300 p-2 rounded-lg transition-colors"
                      >
                        <Square size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setMudo((m) => !m)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-100 p-2 rounded-lg transition-colors ml-auto"
                  >
                    {mudo ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={mudo ? 0 : volume}
                    onChange={(e) => {
                      setMudo(false)
                      setVolume(parseInt(e.target.value))
                    }}
                    className="w-20 accent-amber-500"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 text-center py-2">
                {souMestre ? 'Nenhuma música tocando. Cole um link abaixo.' : 'O mestre ainda não colocou nenhuma música.'}
              </p>
            )}
          </div>

          {souMestre && (
            <form onSubmit={tocar} className="flex gap-1.5">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Link do YouTube (música ambiente)..."
                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600"
              />
              <button
                type="submit"
                disabled={enviando || !url.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold px-3 rounded-lg text-sm transition-colors"
              >
                <Music size={16} />
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-600 mt-2 text-center">
            🔊 O volume é só no seu aparelho — cada jogador ajusta o próprio.
          </p>
        </>
      )}
    </div>
  )
}
