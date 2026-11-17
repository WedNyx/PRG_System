'use client'

import { useId } from 'react'
import { Dice5 } from 'lucide-react'
import type { AtributoDef } from '@/lib/sistemas/tipos'

/**
 * Atributos formando uma lua minguante (v0.35.8, no estilo do desenho do Wed): uma lua fina e dourada,
 * os atributos em medalhões ligados por um fio ao longo dela, moldura com cantos e uma pequena lua no centro.
 * Escolhido no construtor (“Como mostrar os atributos”). Medidas num quadro de 100 × 150.
 */
const CX = 62, CY = 70, R = 45
/** Posição do atributo i de n no fio da lua (de cima, à direita, até embaixo, à direita, passando pela esquerda). */
export function posicaoNaLua(i: number, n: number) {
  const ini = 262, fim = 94
  const graus = n > 1 ? ini - ((ini - fim) * i) / (n - 1) : 180
  const a = (graus * Math.PI) / 180
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }
}
const SERIFA = { fontFamily: 'var(--font-cinzel), Georgia, serif' }
const OURO = '#e2bf72'

export default function AtributosLua({ atributos, valores, somenteLeitura, mudar, rolar, mods, mudarMod }: {
  atributos: AtributoDef[]; valores: Record<string, number>; somenteLeitura: boolean
  mudar: (id: string, v: number) => void; rolar?: (a: AtributoDef, v: number) => void
  /** Sistemas com fórmula de modificador própria (v0.35.8): mostra e permite editar o modificador na legenda. */
  mods?: Record<string, number>; mudarMod?: (id: string, v: number) => void
}) {
  const id = useId().replace(/:/g, '')
  const lista = atributos.slice(0, 9)
  const arco = (r: number, de: number, ate: number) => {
    const p = (g: number) => [CX + r * Math.cos((g * Math.PI) / 180), CY + r * Math.sin((g * Math.PI) / 180)]
    const [x1, y1] = p(de), [x2, y2] = p(ate)
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)}`
  }
  return <div className="mx-auto w-full max-w-[440px]">
    <div className="relative w-full" style={{ aspectRatio: '100 / 150' }} role="group" aria-label="Atributos na lua minguante">
      <svg viewBox="0 0 100 150" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <radialGradient id={'fundo' + id} cx="60%" cy="45%" r="75%"><stop offset="0" stopColor="#1e1638" /><stop offset="1" stopColor="#0c0918" /></radialGradient>
          <linearGradient id={'ouro' + id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6dc9a" /><stop offset=".5" stopColor="#b8914c" /><stop offset="1" stopColor="#7a5c2c" /></linearGradient>
          <mask id={'lua' + id}><rect width="100" height="150" fill="#fff" /><circle cx="71" cy="67" r="50" fill="#000" /></mask>
          <filter id={'brilho' + id} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" /></filter>
          <pattern id={'crateras' + id} width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="3" r="1.1" fill="#6b5430" opacity=".35" /><circle cx="6.5" cy="7" r=".7" fill="#6b5430" opacity=".3" /><circle cx="7" cy="2" r=".4" fill="#fff3c4" opacity=".25" />
          </pattern>
        </defs>
        {/* fundo e moldura */}
        <rect x=".5" y=".5" width="99" height="149" rx="4" fill={`url(#fundo${id})`} />
        <g fill="none" stroke={OURO} strokeOpacity=".55" strokeWidth=".3">
          <rect x="2.5" y="2.5" width="95" height="145" rx="3" />
          {[[4, 4], [96, 4], [4, 146], [96, 146]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" />)}
          <path d="M50 2.5 v7 M50 140.5 v7 M2.5 75 h3 M94.5 75 h3" />
        </g>
        {[[50, 6], [50, 144], [3.2, 75], [96.8, 75]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 1.4} L${x + .7} ${y} L${x} ${y + 1.4} L${x - .7} ${y}Z`} fill={OURO} opacity=".8" />)}
        {/* guias finas em volta */}
        <g fill="none" stroke={OURO} strokeWidth=".2" strokeOpacity=".35">
          <circle cx={CX} cy={CY} r="55" strokeDasharray="1 1.5" />
          <circle cx={CX} cy={CY} r="38" />
          <path d={`M${CX} 12 V128`} strokeOpacity=".2" />
        </g>
        {/* a lua minguante: faixa fina e dourada */}
        <circle cx={CX - 2} cy={CY} r="53" fill="#f3d48a" opacity=".45" mask={`url(#lua${id})`} filter={`url(#brilho${id})`} />
        <circle cx={CX - 2} cy={CY} r="53" fill={`url(#ouro${id})`} mask={`url(#lua${id})`} opacity=".78" />
        <circle cx={CX - 2} cy={CY} r="53" fill={`url(#crateras${id})`} mask={`url(#lua${id})`} />
        <circle cx={CX - 2} cy={CY} r="53" fill="none" stroke="#fff0c2" strokeWidth=".35" strokeOpacity=".8" mask={`url(#lua${id})`} />
        {/* fio que liga os medalhões */}
        {lista.length > 1 && <path d={arco(R, 262, 94)} fill="none" stroke={OURO} strokeWidth=".45" opacity=".9" />}
        {/* pequena lua no centro */}
        <g transform={`translate(${CX + 2} ${CY})`} fill="none" stroke={OURO} strokeWidth=".3">
          <circle r="6" strokeOpacity=".6" /><circle r="7.6" strokeOpacity=".3" />
          <path d="M-14 0 h-4 M14 0 h4 M0 -10 v-5 M0 10 v5" strokeOpacity=".6" />
          <path d="M1.5 -4.2 A4.4 4.4 0 1 0 1.5 4.2 A3.4 3.4 0 1 1 1.5 -4.2Z" fill={OURO} fillOpacity=".85" stroke="none" />
          {[[0, -16.5], [0, 16.5]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 1.6} L${x + .6} ${y} L${x} ${y + 1.6} L${x - .6} ${y}Z`} fill={OURO} stroke="none" />)}
        </g>
      </svg>
      {lista.map((a, i) => {
        const p = posicaoNaLua(i, lista.length), v = Number(valores[a.id] ?? a.padrao) || 0
        return <div key={a.id} className="absolute" style={{ left: `${p.x}%`, top: `${(p.y / 150) * 100}%`, transform: 'translate(-50%, -50%)', width: lista.length > 7 ? '15%' : '16.5%' }} title={a.nome + (a.dica ? ' — ' + a.dica : '')}>
          {/* estrelinhas dos quatro lados */}
          {[['50%', '-7%'], ['50%', '107%'], ['-7%', '50%'], ['107%', '50%']].map(([l, t], k) => <span key={k} aria-hidden className="absolute h-[9%] w-[9%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#e2bf72] shadow-[0_0_6px_#f6dc9a]" style={{ left: l, top: t }} />)}
          <div className="relative flex aspect-square w-full flex-col items-center justify-center rounded-full border-[2px] border-[#e2bf72] bg-[radial-gradient(circle_at_50%_40%,#2a1f48,#120d22_70%)] shadow-[0_0_12px_#e2bf7280,inset_0_0_0_3px_#120d22,inset_0_0_0_4px_#e2bf7266]">
            <span style={SERIFA} className="text-[clamp(9px,2.5vw,12px)] font-semibold leading-none tracking-wider text-[#f1dfae]">{a.id}</span>
            <input type="number" aria-label={a.nome} value={v} min={a.min} max={a.max} disabled={somenteLeitura} style={SERIFA}
              onChange={e => mudar(a.id, Math.max(-99, Math.min(999, Math.round(Number(e.target.value)) || 0)))}
              className="w-full bg-transparent text-center text-[clamp(17px,5.6vw,25px)] font-bold leading-tight text-white outline-none [appearance:textfield] disabled:opacity-90 [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
          {rolar && <button type="button" onClick={() => rolar(a, v)} aria-label={'Rolar ' + a.nome}
            className="absolute -left-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[#e2bf72]/70 bg-[#1b1430] text-[#f1dfae] shadow hover:bg-[#2b2147]"><Dice5 size={13} /></button>}
        </div>
      })}
    </div>
    {/* legenda: sigla, nome e, se o sistema tiver modificador próprio, o modificador (editável) */}
    <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-3">
      {lista.map(a => <li key={a.id} className="flex items-baseline gap-1.5">
        <span style={SERIFA} className="font-semibold text-[#e2bf72]">{a.id}</span><span className="text-(--a-cfc0df)">{a.nome}</span>
        {mudarMod && <label className="ml-auto flex items-center gap-1 text-[10px] text-(--a-c4b6d4)">mod
          <input type="number" aria-label={'Modificador de ' + a.nome} value={mods?.[a.id] ?? 0} disabled={somenteLeitura}
            onChange={e => mudarMod(a.id, Math.round(Number(e.target.value)) || 0)}
            className="w-10 rounded border border-(--a-5e4b78) bg-(--s-151123) px-1 text-center font-bold text-(--a-d4baff) disabled:opacity-70" /></label>}
      </li>)}
    </ul>
  </div>
}
