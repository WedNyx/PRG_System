'use client'
import { useEffect, useRef, useState } from 'react'
import { Captions, CaptionsOff } from 'lucide-react'
import { segundoCinema, type EstadoCinema } from '@/lib/nuvem/cinema'

type Player = {
  destroy(): void; cueVideoById(id: string, start?: number): void; loadVideoById(id: string, start?: number): void; playVideo(): void; pauseVideo(): void
  seekTo(s: number, allow: boolean): void; getCurrentTime(): number; getPlayerState(): number; setVolume(v: number): void
  loadModule(m: string): void; unloadModule(m: string): void; setOption(m: string, o: string, v: unknown): void
}
type API = { Player: new (el: HTMLElement, options: Record<string, unknown>) => Player }
/** Preferência deste aparelho (como o volume): legenda ligada por padrão ou não. */
const CHAVE_LEGENDA = 'prg-cinema-legenda'
export default function ReprodutorCinema({ estado, desvio }: { estado: EstadoCinema; desvio: number }) {
  const host = useRef<HTMLDivElement>(null)
  const player = useRef<Player | null>(null)
  const ultimo = useRef('')
  const [pronto, setPronto] = useState(false)
  const [volume, setVolume] = useState(70)
  const [legenda, setLegenda] = useState(() => { try { return localStorage.getItem(CHAVE_LEGENDA) === '1' } catch { return false } })
  const [erro, setErro] = useState('')
  useEffect(() => {
    let ativo = true
    const w = window as unknown as { YT?: API }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s)
    }
    let timer: number | null = null
    const iniciar = () => {
      if (!ativo || player.current || !host.current || !w.YT?.Player) return
      if (timer) { clearInterval(timer); timer = null } // já criou: para de checar a cada 250 ms
      const el = document.createElement('div'); host.current.appendChild(el)
      player.current = new w.YT.Player(el, { width: '100%', height: '100%', playerVars: { controls: 0, playsinline: 1, origin: location.origin }, events: { onReady: () => { if (ativo) setPronto(true) }, onError: () => { if (ativo) setErro('Este vídeo não pode ser reproduzido aqui. Escolha outro.') } } })
    }
    iniciar()
    if (!player.current) timer = window.setInterval(iniciar, 250)
    return () => { ativo = false; if (timer) clearInterval(timer); player.current?.destroy(); player.current = null; ultimo.current = '' }
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
  // Legenda é preferência deste aparelho (como o volume): cada um liga a sua, não afeta quem mais está vendo.
  useEffect(() => {
    if (!pronto) return
    const p = player.current
    if (!p) return
    if (legenda) { p.loadModule('captions'); p.setOption('captions', 'track', {}) } else p.unloadModule('captions')
  }, [legenda, pronto, estado.reproducao.video_id])
  const alternarLegenda = () => { const nova = !legenda; setLegenda(nova); try { localStorage.setItem(CHAVE_LEGENDA, nova ? '1' : '0') } catch { /* sem espaço: vale só nesta sessão */ } }
  const btn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-(--a-62527e) px-3 text-xs text-(--a-e4d3ff) hover:bg-(--s-2b2140)'
  return <section className="space-y-2" aria-label="Vídeo">
    <div className="relative mx-auto">
      {/* Cortinas de veludo decorativas, só em telas largas: dá o clima de sala de cinema. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-2 -left-5 hidden w-9 rounded-l-2xl bg-gradient-to-r from-[#3a0a12] via-[#7a1530]/80 to-transparent opacity-80 blur-[1px] lg:block" />
      <div aria-hidden className="pointer-events-none absolute inset-y-2 -right-5 hidden w-9 rounded-r-2xl bg-gradient-to-l from-[#3a0a12] via-[#7a1530]/80 to-transparent opacity-80 blur-[1px] lg:block" />
      <div className="relative aspect-video overflow-hidden rounded-2xl border-[3px] border-[#1c1420] bg-black shadow-[0_0_0_1px_#000,0_20px_50px_#000c] ring-1 ring-(--ouro)/15" ref={host}>
        {!estado.reproducao.video_id && <div className="pointer-events-none absolute inset-0 grid place-items-center p-4 text-center text-sm text-(--a-b5a5c8)">🎞️ Nenhum vídeo passando. O anfitrião escolhe na fila.</div>}
        {/* Vinheta: escurece as bordas para o vídeo parecer uma projeção, não uma janela de navegador. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_30px_#000]" />
      </div>
    </div>
    {erro && <p role="alert" className="text-sm text-red-200">{erro}</p>}
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn} onClick={() => { if (!estado.reproducao.pausado && estado.reproducao.tocando) player.current?.playVideo() }}>🔊 Ativar o som neste aparelho</button>
      <label className="inline-flex items-center gap-2 text-xs text-(--a-cfc0df)">Volume <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-28" /></label>
      <button type="button" aria-pressed={legenda} className={btn} onClick={alternarLegenda}>{legenda ? <Captions size={14} /> : <CaptionsOff size={14} />} Legenda</button>
      <button type="button" className={btn} onClick={() => { void host.current?.requestFullscreen?.().catch(() => setErro('Tela cheia indisponível neste aparelho.')) }}>⛶ Tela cheia</button>
    </div>
  </section>
}
