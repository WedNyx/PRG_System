'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { MoonStar } from 'lucide-react'
import { caminhoIluminado, infoLua } from '@/lib/lua'

// A hora atual (arredondada a 10 min) vem do navegador; no servidor não desenha nada (evita diferença na hidratação).
const PASSO = 10 * 60_000
const assinar = (avisar: () => void) => { const t = setInterval(avisar, PASSO); return () => clearInterval(t) }
const agora = () => Math.floor(Date.now() / PASSO) * PASSO
const noServidor = () => 0
export const useAgora = () => useSyncExternalStore(assinar, agora, noServidor)

const CRATERAS: [number, number, number][] = [[-18, -22, 9], [14, -8, 12], [-8, 18, 7], [22, 24, 6], [-30, 4, 5], [4, 34, 4], [30, -28, 5]]

/** Desenho da lua na fase de uma data (hemisfério sul: crescente acesa à esquerda). */
export function DesenhoLua({ data, tamanho = 120, brilho = true, contorno = false }: { data: Date; tamanho?: number; brilho?: boolean
  /** Logo pequeno: lado escuro mais claro e borda lilás, para a lua nova não sumir. */
  contorno?: boolean }) {
  const id = useId().replace(/:/g, '')
  const i = infoLua(data), r = 48
  return <svg viewBox="-60 -60 120 120" width={tamanho} height={tamanho} role="img" aria-label={`${i.fase.nome}, ${Math.round(i.iluminada * 100)}% iluminada`}>
    <defs>
      <radialGradient id={'l' + id} cx="35%" cy="35%" r="75%"><stop offset="0" stopColor="#fff8e1" /><stop offset=".6" stopColor="#ffe3a3" /><stop offset="1" stopColor="#e8b65a" /></radialGradient>
      <radialGradient id={'g' + id}><stop offset=".55" stopColor="#ffd98a" stopOpacity=".45" /><stop offset="1" stopColor="#ffd98a" stopOpacity="0" /></radialGradient>
      <clipPath id={'c' + id}><path d={caminhoIluminado(i.fracao, r)} /></clipPath>
    </defs>
    {brilho && <circle r="60" fill={`url(#g${id})`} opacity={0.25 + i.iluminada * 0.75} />}
    <circle r={r} fill={contorno ? '#3f3366' : '#2a2140'} stroke={contorno ? '#c5a7ff' : '#5b4a7a'} strokeOpacity={contorno ? 0.85 : 0.6} strokeWidth={contorno ? 4 : 1} />
    <g opacity=".35">{CRATERAS.map(([x, y, cr], k) => <circle key={k} cx={x} cy={y} r={cr} fill="#1c1630" />)}</g>
    <path d={caminhoIluminado(i.fracao, r)} fill={`url(#l${id})`} />
    <g clipPath={`url(#c${id})`} opacity=".45">{CRATERAS.map(([x, y, cr], k) => <circle key={k} cx={x} cy={y} r={cr} fill="#e2b866" />)}</g>
  </svg>
}

const dataCurta = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

/** Painel da lua de hoje: desenho grande, fase, iluminação, dias até a cheia, frase e próximas fases. */
function PainelLua({ t }: { t: number }) {
  const data = new Date(t), i = infoLua(data)
  const dias = Math.round((i.proximaCheia.getTime() - t) / 86_400_000)
  return <div className="flex flex-col items-center text-center">
    <DesenhoLua data={data} tamanho={110} />
    <p className="mt-1 text-base font-bold text-[#ffe3a3]">{i.fase.nome}</p>
    <p className="text-xs text-[#cfc0df]">{Math.round(i.iluminada * 100)}% iluminada · {i.crescendo ? 'crescendo' : 'diminuindo'}</p>
    {i.fase.id !== 'cheia' && <p className="text-[11px] text-[#a99bbb]">Lua cheia {dias <= 1 ? 'amanhã' : `em ${dias} dias`}</p>}
    <p className="mt-2 text-xs italic text-[#e9d6ff]">{i.fase.frase}</p>
    <ul className="mt-3 w-full space-y-1 rounded-xl border border-[#55456e] bg-[#1b1529]/90 p-2 text-left text-xs">
      {i.proximas.map(p => <li key={p.fase.id} className="flex items-center gap-2"><DesenhoLua data={new Date(p.data.getTime() + 3600_000)} tamanho={22} brilho={false} />
        <span className="flex-1">{p.fase.nome}</span><span className="text-[#b4aeca]">{dataCurta(p.data)}</span></li>)}
    </ul>
    <p className="mt-2 text-[10px] text-[#8f88a8]">Calculada pela data, como se vê no Brasil.</p>
  </div>
}

/** Logo da plataforma: a lua do dia ao lado de “PRG System”. Tocar abre o painel com as fases. */
export default function LuaLogo({ tamanho = 30 }: { tamanho?: number }) {
  const t = useAgora()
  const [aberta, setAberta] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberta) return
    const fora = (e: PointerEvent) => { if (!caixa.current?.contains(e.target as Node)) setAberta(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberta(false) }
    document.addEventListener('pointerdown', fora); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', fora); document.removeEventListener('keydown', esc) }
  }, [aberta])
  if (!t) return <MoonStar className="text-[#c5a7ff] drop-shadow-[0_0_9px_#a76aff]" size={tamanho} aria-hidden="true" />
  const i = infoLua(new Date(t))
  return <div ref={caixa} className="relative inline-flex">
    <button type="button" onClick={() => setAberta(a => !a)} aria-expanded={aberta} aria-label={`Lua de hoje: ${i.fase.nome}. Ver as fases`} title={`${i.fase.nome} · ${Math.round(i.iluminada * 100)}% iluminada`}
      className="rounded-full transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#b99bff]">
      <DesenhoLua data={new Date(t)} tamanho={tamanho} contorno />
    </button>
    {aberta && <div role="dialog" aria-label="Fases da lua" className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl text-sm font-normal tracking-normal border border-[#8b6cba] bg-[#19152a]/95 p-4 text-[#f2ebff] shadow-2xl backdrop-blur">
      <PainelLua t={t} />
    </div>}
  </div>
}

/** Frase da fase de hoje (para o texto de boas-vindas). */
export function FraseDaLua() {
  const t = useAgora()
  if (!t) return null
  const i = infoLua(new Date(t))
  return <span>{i.fase.emoji} {i.fase.frase}</span>
}

