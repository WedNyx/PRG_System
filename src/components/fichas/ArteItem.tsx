'use client'

import { corDaRaridade, lerArte, RARIDADES, type Raridade } from '@/lib/itensArte'
import { iconeRpgPorId, sugestaoIcone, sugestaoIconeRpg } from '@/lib/iconesRpg'
import { ehIconeGi, urlIconeGi } from '@/lib/iconesGi'

/**
 * Ilustração do item (v0.35.3): foto própria ou um ícone do Game-Icons, numa moldura com a cor da raridade.
 * A Forja (desenhos próprios) saiu: itens antigos com desenho da Forja ganham o ícone equivalente.
 * Raro para cima ganha brilho; lendário e único ganham faíscas.
 */
export default function ArteItem({ item, tamanho = 48, className = '' }: { item: { nome: string; categoria: string; arte?: unknown; raridade?: Raridade; imagem?: unknown; magico?: unknown; iconeBiblioteca?: unknown }; tamanho?: number; className?: string }) {
  const cor = corDaRaridade(item.raridade)
  const nivel = item.raridade ? RARIDADES.findIndex(r => r.id === item.raridade) : -1
  const antiga = lerArte(item.arte)
  // Ícone do acervo completo (arquivo da própria plataforma), pintado pela máscara na cor da raridade.
  const gi = ehIconeGi(item.iconeBiblioteca) ? urlIconeGi(item.iconeBiblioteca) : null
  const icone = iconeRpgPorId(item.iconeBiblioteca) ?? (antiga ? iconeRpgPorId(sugestaoIconeRpg(antiga.forma)) : null) ?? iconeRpgPorId(sugestaoIcone(item.nome, item.categoria))
  // Comum ou sem raridade: ícone claro; a partir de Incomum, o ícone pega a cor da raridade.
  const corIcone = nivel >= 1 ? cor : '#ece6f7'
  return <span role="img" aria-label={`${item.nome}${item.raridade ? ' (' + RARIDADES[nivel].nome + ')' : ''}`} className={'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 shadow-inner ' + className}
    style={{ width: tamanho, height: tamanho, borderColor: cor, background: `radial-gradient(circle at 50% 40%, ${cor}55, #1a1430 70%)`, boxShadow: nivel >= 2 ? `0 0 ${nivel * 4}px ${cor}aa, inset 0 0 ${tamanho / 4}px ${cor}55` : undefined }}>
    {typeof item.imagem === 'string' && item.imagem
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={item.imagem} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-contain p-0.5" />
      : gi ? <span aria-hidden style={{ width: tamanho * 0.8, height: tamanho * 0.8, backgroundColor: nivel >= 1 ? cor : '#ece6f7', WebkitMaskImage: `url("${gi}")`, maskImage: `url("${gi}")`,
          WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center',
          filter: item.magico ? `drop-shadow(0 0 ${Math.round(tamanho / 14)}px ${nivel >= 1 ? cor : '#c4b5fd'})` : undefined }} />
      : icone && <svg viewBox="0 0 512 512" width={tamanho * 0.8} height={tamanho * 0.8} aria-hidden
          style={{ filter: item.magico ? `drop-shadow(0 0 ${Math.round(tamanho / 14)}px ${nivel >= 1 ? cor : '#c4b5fd'})` : undefined }}>
          <g fill={corIcone}>{icone.paths.map((d, i) => <path key={i} d={d} />)}</g>
        </svg>}
    {item.magico === true && <span aria-hidden className="prg-brilha pointer-events-none absolute bottom-0 left-0.5 drop-shadow" style={{ fontSize: Math.max(10, tamanho / 4) }}>✨</span>}
    {nivel >= 4 && <span aria-hidden className="prg-brilha pointer-events-none absolute right-1 top-0.5" style={{ fontSize: tamanho / 5 }}>✦</span>}
  </span>
}
