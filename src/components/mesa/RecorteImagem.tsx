'use client'

import { useRef, useState } from 'react'
import { Check, Maximize, X } from 'lucide-react'
import { btn } from './estilos'

export type Recorte = { cx: number; cy: number; cw: number; ch: number }
type Alca = 'mover' | 'no' | 'ne' | 'so' | 'se'

/** Escolher a parte da imagem que entra no mapa: arraste o quadro ou puxe os cantos. */
export default function RecorteImagem({ url, inicial, onSalvar, onCancelar }: {
  url: string; inicial?: Partial<Recorte>; onSalvar: (r: Recorte, proporcaoImagem: number) => void; onCancelar: () => void
}) {
  const [r, setR] = useState<Recorte>({ cx: inicial?.cx ?? 0, cy: inicial?.cy ?? 0, cw: inicial?.cw ?? 1, ch: inicial?.ch ?? 1 })
  const [ar, setAr] = useState(1)
  const caixa = useRef<HTMLDivElement>(null)
  const arraste = useRef<{ alca: Alca; x: number; y: number; r: Recorte } | null>(null)

  const limitar = (n: Recorte): Recorte => {
    const cw = Math.max(0.03, Math.min(1, n.cw)), ch = Math.max(0.03, Math.min(1, n.ch))
    return { cw, ch, cx: Math.max(0, Math.min(1 - cw, n.cx)), cy: Math.max(0, Math.min(1 - ch, n.cy)) }
  }
  function down(e: React.PointerEvent, alca: Alca) {
    e.preventDefault(); e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    arraste.current = { alca, x: e.clientX, y: e.clientY, r }
  }
  function move(e: React.PointerEvent) {
    const a = arraste.current, box = caixa.current?.getBoundingClientRect()
    if (!a || !box) return
    const dx = (e.clientX - a.x) / box.width, dy = (e.clientY - a.y) / box.height, o = a.r
    if (a.alca === 'mover') setR(limitar({ ...o, cx: o.cx + dx, cy: o.cy + dy }))
    else {
      let { cx, cy, cw, ch } = o
      if (a.alca.includes('o')) { cx = Math.min(o.cx + o.cw - 0.03, Math.max(0, o.cx + dx)); cw = o.cw + (o.cx - cx) }
      if (a.alca.includes('e')) cw = Math.min(1 - o.cx, o.cw + dx)
      if (a.alca.includes('n')) { cy = Math.min(o.cy + o.ch - 0.03, Math.max(0, o.cy + dy)); ch = o.ch + (o.cy - cy) }
      if (a.alca.includes('s')) ch = Math.min(1 - o.cy, o.ch + dy)
      setR(limitar({ cx, cy, cw, ch }))
    }
  }
  const pct = (n: number) => n * 100 + '%'
  const cantos: [Alca, string][] = [['no', '-left-2 -top-2 cursor-nwse-resize'], ['ne', '-right-2 -top-2 cursor-nesw-resize'], ['so', '-left-2 -bottom-2 cursor-nesw-resize'], ['se', '-right-2 -bottom-2 cursor-nwse-resize']]

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3" role="dialog" aria-modal="true" aria-label="Recortar imagem do mapa">
    <div className="flex max-h-full w-full max-w-3xl flex-col rounded-2xl border border-(--a-62527e) bg-(--s-19172c) p-4">
      <div className="flex items-center justify-between gap-2"><h2 className="font-bold">✂️ Escolha a parte da imagem</h2>
        <button type="button" onClick={onCancelar} aria-label="Fechar" className="rounded p-1 hover:bg-(--s-34294f)"><X size={18} /></button></div>
      <p className="mt-1 text-xs text-(--a-b4aeca)">Arraste o quadro para mover e puxe os cantos para mudar o tamanho. Só a parte dentro do quadro aparece no mapa.</p>
      <div className="mt-3 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div ref={caixa} className="relative inline-block touch-none select-none" onPointerMove={move} onPointerUp={() => { arraste.current = null }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Imagem do mapa" draggable={false} onLoad={e => setAr(e.currentTarget.naturalHeight / e.currentTarget.naturalWidth || 1)} className="block max-h-[60vh] max-w-full" />
          <div className="pointer-events-none absolute inset-0 bg-black/60" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${pct(r.cx)} ${pct(r.cy)}, ${pct(r.cx)} ${pct(r.cy + r.ch)}, ${pct(r.cx + r.cw)} ${pct(r.cy + r.ch)}, ${pct(r.cx + r.cw)} ${pct(r.cy)}, ${pct(r.cx)} ${pct(r.cy)})` }} />
          <div className="absolute cursor-move border-2 border-(--a-ed9cd8)" style={{ left: pct(r.cx), top: pct(r.cy), width: pct(r.cw), height: pct(r.ch) }} onPointerDown={e => down(e, 'mover')}>
            {cantos.map(([a, c]) => <div key={a} role="button" aria-label={'Canto ' + a} onPointerDown={e => down(e, a)} className={'absolute h-5 w-5 rounded-full border-2 border-white bg-(--a-7654bb) ' + c} />)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => setR({ cx: 0, cy: 0, cw: 1, ch: 1 })}><Maximize size={14} /> Imagem inteira</button>
        <span className="flex-1" />
        <button type="button" className={btn} onClick={onCancelar}>Cancelar</button>
        <button type="button" className={btn + ' border-(--a-b99bff) bg-(--a-5b4380)'} onClick={() => onSalvar(r, ar)}><Check size={14} /> Usar este recorte</button>
      </div>
    </div>
  </div>
}
