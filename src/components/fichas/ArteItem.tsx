'use client'

import { arteDoItem, corDaRaridade, formaPorId, RARIDADES, type Raridade } from '@/lib/itensArte'

/**
 * Desenho do item (Forja): moldura com a cor da raridade, fundo que brilha e a forma colorida.
 * Raro para cima ganha brilho; lendário e único ganham faíscas.
 */
export default function ArteItem({ item, tamanho = 48, className = '' }: { item: { nome: string; categoria: string; arte?: unknown; raridade?: Raridade; imagem?: unknown; magico?: unknown }; tamanho?: number; className?: string }) {
  const a = arteDoItem(item), forma = formaPorId(a.forma), cor = corDaRaridade(item.raridade)
  const nivel = item.raridade ? RARIDADES.findIndex(r => r.id === item.raridade) : -1
  return <span role="img" aria-label={`${item.nome}${item.raridade ? ' (' + RARIDADES[nivel].nome + ')' : ''}`} className={'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 shadow-inner ' + className}
    style={{ width: tamanho, height: tamanho, borderColor: cor, background: `radial-gradient(circle at 50% 40%, ${cor}55, #1a1430 70%)`, boxShadow: nivel >= 2 ? `0 0 ${nivel * 4}px ${cor}aa, inset 0 0 ${tamanho / 4}px ${cor}55` : undefined }}>
    {typeof item.imagem === 'string' && item.imagem
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={item.imagem} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      : <svg viewBox="0 0 100 100" width={tamanho * 0.86} height={tamanho * 0.86} aria-hidden>
          <circle cx="50" cy="50" r="47" fill={a.cor} opacity=".08" />
          <circle cx="50" cy="50" r="43" fill="none" stroke={a.cor2} strokeWidth=".8" opacity=".45" strokeDasharray="4 5" />
          <path d="M50 4 L53 13 L50 22 L47 13 Z M96 50 L87 53 L78 50 L87 47 Z M50 96 L47 87 L50 78 L53 87 Z M4 50 L13 47 L22 50 L13 53 Z" fill={a.cor2} opacity=".35" />
          <g dangerouslySetInnerHTML={{ __html: forma.desenho(a.cor, a.cor2) }} />
          <path d="M21 17 Q36 9 48 13" stroke="white" strokeWidth="1.5" fill="none" opacity=".26" />
        </svg>}
    {item.magico === true && <span aria-hidden className="prg-brilha pointer-events-none absolute bottom-0 left-0.5 drop-shadow" style={{ fontSize: Math.max(10, tamanho / 4) }}>✨</span>}
    {nivel >= 4 && <span aria-hidden className="prg-brilha pointer-events-none absolute right-1 top-0.5" style={{ fontSize: tamanho / 5 }}>✦</span>}
  </span>
}
