'use client'
import { useEffect, useRef, useState } from 'react'
import { segundoCinema, type EstadoCinema } from '@/lib/nuvem/cinema'

type Player = { destroy(): void; cueVideoById(id: string, start?: number): void; loadVideoById(id: string, start?: number): void; playVideo(): void; pauseVideo(): void; seekTo(s: number, allow: boolean): void; getCurrentTime(): number; getPlayerState(): number; setVolume(v: number): void }
type API = { Player: new (el: HTMLElement, options: Record<string, unknown>) => Player }
export default function ReprodutorCinema({ estado, desvio }: { estado: EstadoCinema; desvio: number }) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<Player | null>(null)
  const ultimo = useRef('')
  const [pronto, setPronto] = useState(false)
  const [volume, setVolume] = useState(70)
  const [erro, setErro] = useState('')
  useEffect(() => {
    let ativo = true
    const w = window as unknown as { YT?: API }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s)
    }
    const iniciar = () => {
      if (!ativo || player.current || !host.current || !w.YT?.Player) return
      const el = document.createElement('div'); host.current.appendChild(el)
      player.current = new w.YT.Player(el, { width: '100%', height: '100%', playerVars: { controls: 0, playsinline: 1, origin: location.origin }, events: { onReady: () => { if (ativo) setPronto(true) }, onError: () => { if (ativo) setErro('Este vídeo não pode ser reproduzido aqui. Escolha outro.') } } })
    }
    iniciar()
    const timer = window.setInterval(iniciar, 250)
    return () => { ativo = false; clearInterval(timer); player.current?.destroy(); player.current = null; ultimo.current = '' }
  }, [])
  useEffect(() => {
    if (!pronto) return
    const sincronizar = () => {
      const p = player.current, r = estado.reproducao
      if (!p || !r.video_id) return
      const pos = segundoCinema(estado, Date.now() + desvio)
      const chave = r.video_id + ':' + estado.atual
      if (ultimo.current !== chave) {
        ultimo.current = chave
        if (r.pausado) p.cueVideoById(r.video_id, pos)
        else p.loadVideoById(r.video_id, pos)
        return
      }
      if (Math.abs(p.getCurrentTime() - pos) > 2) p.seekTo(pos, true)
      if (r.pausado || !r.tocando) { if (p.getPlayerState() === 1) p.pauseVideo() }
      else if ([2, 5, -1].includes(p.getPlayerState())) p.playVideo()
    }
    sincronizar()
    const t = window.setInterval(sincronizar, 1000)
    return () => clearInterval(t)
  }, [estado, desvio, pronto])
  useEffect(() => { if (pronto) player.current?.setVolume(volume) }, [volume, pronto])
  const btn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-(--a-62527e) px-3 text-xs text-(--a-e4d3ff) hover:bg-(--s-2b2140)'
  return <section className="space-y-2" aria-label="Vídeo">
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-(--a-3d3152) bg-black shadow-[0_10px_40px_#000a]" ref={host}>
      {!estado.reproducao.video_id && <div className="pointer-events-none absolute inset-0 grid place-items-center p-4 text-center text-sm text-(--a-b5a5c8)">🎞️ Nenhum vídeo passando. O anfitrião escolhe na fila.</div>}
    </div>
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn} onClick={() => { if (!estado.reproducao.pausado && estado.reproducao.tocando) player.current?.playVideo() }}>🔊 Ativar o som neste aparelho</button>
      <label className="inline-flex items-center gap-2 text-xs text-(--a-cfc0df)">Volume <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-28" /></label>
      <button type="button" className={btn} onClick={() => { void host.current?.requestFullscreen?.().catch(() => setErro('Tela cheia indisponível neste aparelho.')) }}>⛶ Tela cheia</button>
    </div>
  </section>
}
