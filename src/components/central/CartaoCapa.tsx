'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

const FUNDOS = [
  'linear-gradient(135deg,#3b2470,#7a3b8f 55%,#1b1530)', 'linear-gradient(135deg,#1e3a5f,#4b3b8f 60%,#16122a)',
  'linear-gradient(135deg,#4a1d3f,#8f3b6b 55%,#1b1530)', 'linear-gradient(135deg,#1f4a45,#3b5f8f 60%,#16122a)',
  'linear-gradient(135deg,#5a3a14,#8f5b3b 55%,#1b1530)', 'linear-gradient(135deg,#2b2470,#3b7a8f 60%,#16122a)',
]
const hash = (s: string) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h) }

/**
 * Cartão grande com imagem de capa (retrato da ficha ou capa da campanha).
 * Sem imagem, usa um degradê fixo pelo nome + um ícone, para cada cartão ter cara própria.
 */
export default function CartaoCapa({ imagem, titulo, subtitulo, icone, selos, acaoPrincipal, children, apagado, foco = 'center' }: {
  /** Parte da imagem que fica visível (retratos: perto do topo, onde fica o rosto). */
  foco?: string
  imagem?: string | null; titulo: string; subtitulo?: ReactNode; icone: string; selos?: ReactNode
  /** Clique na capa (abrir). */
  acaoPrincipal?: { rotulo: string; href?: string; onClick?: () => void }
  children?: ReactNode; apagado?: boolean
}) {
  const capa = <div className="relative aspect-[16/9] overflow-hidden">
    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
      style={{ backgroundImage: imagem ? `url("${imagem}")` : FUNDOS[hash(titulo) % FUNDOS.length], backgroundPosition: imagem ? foco : undefined }} />
    {!imagem && <span aria-hidden className="absolute inset-0 flex items-center justify-center text-6xl opacity-40">{icone}</span>}
    <div className="absolute inset-0 bg-gradient-to-t from-(--s-0d0b16) via-(--s-0d0b16)/40 to-transparent" />
    {selos && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{selos}</div>}
    <div className="absolute inset-x-0 bottom-0 p-4">
      <h3 className="break-words text-lg font-bold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.8)]">{titulo}</h3>
      {subtitulo && <p className="mt-1 text-xs text-(--a-e0d4f0) drop-shadow-[0_1px_4px_rgba(0,0,0,.9)]">{subtitulo}</p>}
    </div>
  </div>
  const a = acaoPrincipal
  return <article className={'group overflow-hidden rounded-2xl border border-(--a-55456e) bg-(--s-171325) shadow-lg transition-shadow hover:border-(--a-9b7ccc) hover:shadow-[0_0_28px_#7654bb44] ' + (apagado ? 'opacity-60' : '')}>
    {a?.href ? <Link href={a.href} aria-label={a.rotulo + ': ' + titulo} className="block">{capa}</Link>
      : a?.onClick ? <button type="button" onClick={a.onClick} aria-label={a.rotulo + ': ' + titulo} className="block w-full text-left">{capa}</button>
      : capa}
    {children && <div className="p-3">{children}</div>}
  </article>
}

export const selo = 'rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur'
