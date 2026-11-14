'use client'

import { arteDoItem, corDaRaridade, formaPorId, RARIDADES, type Raridade } from '@/lib/itensArte'
import { iconeRpgPorId, sugestaoIconeRpg } from '@/lib/iconesRpg'

/**
 * Desenho do item (Forja): moldura com a cor da raridade, fundo que brilha e a forma colorida.
 * Raro para cima ganha brilho; lendário e único ganham faíscas.
 */
export default function ArteItem({ item, tamanho = 48, className = '', estiloDnd = false }: { item: { nome: string; categoria: string; arte?: unknown; raridade?: Raridade; imagem?: unknown; magico?: unknown; iconeBiblioteca?: unknown }; tamanho?: number; className?: string; estiloDnd?: boolean }) {
  const a = arteDoItem(item), forma = formaPorId(a.forma), cor = corDaRaridade(item.raridade)
  const nivel = item.raridade ? RARIDADES.findIndex(r => r.id === item.raridade) : -1
  // Em D&D a Forja foi retirada: até itens antigos com arte legada mostram Game-Icons.
  // Em todos os sistemas, a foto própria continua tendo prioridade sobre o ícone.
  const icone = (estiloDnd || !item.arte || item.iconeBiblioteca)
    ? (iconeRpgPorId(item.iconeBiblioteca) ?? iconeRpgPorId(sugestaoIconeRpg(a.forma))) : null
  return <span role="img" aria-label={`${item.nome}${item.raridade ? ' (' + RARIDADES[nivel].nome + ')' : ''}`} className={'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 shadow-inner ' + className}
    style={{ width: tamanho, height: tamanho, borderColor: cor, background: `radial-gradient(circle at 50% 40%, ${cor}55, #1a1430 70%)`, boxShadow: nivel >= 2 ? `0 0 ${nivel * 4}px ${cor}aa, inset 0 0 ${tamanho / 4}px ${cor}55` : undefined }}>
    {typeof item.imagem === 'string' && item.imagem
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={item.imagem} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-contain p-0.5" />
      : icone ? <svg viewBox="0 0 512 512" width={tamanho * 0.86} height={tamanho * 0.86} aria-hidden
          style={{ filter: item.magico ? `drop-shadow(0 0 ${Math.round(tamanho / 14)}px ${a.cor})` : undefined }}>
          <g fill={a.cor} stroke={a.cor2} strokeWidth="5" strokeLinejoin="round">
            {icone.paths.map((d, i) => <path key={i} d={d} />)}
          </g>
        </svg> : <svg viewBox="0 0 100 100" width={tamanho * 0.86} height={tamanho * 0.86} aria-hidden>
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
