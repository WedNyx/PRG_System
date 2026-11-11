'use client'

import { arteDoItem, corDaRaridade, formaPorId, RARIDADES, type Raridade } from '@/lib/itensArte'

/**
 * Desenho do item (Forja): moldura com a cor da raridade, fundo que brilha e a forma colorida.
 * Raro para cima ganha brilho; lendário e único ganham faíscas.
 */
export default function ArteItem({ item, tamanho = 48, className = '' }: { item: { nome: string; categoria: string; arte?: unknown; raridade?: Raridade }; tamanho?: number; className?: string }) {
  const a = arteDoItem(item), forma = formaPorId(a.forma), cor = corDaRaridade(item.raridade)
  const nivel = item.raridade ? RARIDADES.findIndex(r => r.id === item.raridade) : -1
  return <span role="img" aria-label={`${item.nome}${item.raridade ? ' (' + RARIDADES[nivel].nome + ')' : ''}`} className={'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 ' + className}
    style={{ width: tamanho, height: tamanho, borderColor: cor, background: `radial-gradient(circle at 50% 40%, ${cor}55, #1a1430 70%)`, boxShadow: nivel >= 2 ? `0 0 ${nivel * 4}px ${cor}aa, inset 0 0 ${tamanho / 4}px ${cor}55` : undefined }}>
    <svg viewBox="0 0 100 100" width={tamanho * 0.82} height={tamanho * 0.82} aria-hidden dangerouslySetInnerHTML={{ __html: forma.desenho(a.cor, a.cor2) }} />
    {nivel >= 4 && <span aria-hidden className="prg-brilha pointer-events-none absolute right-1 top-0.5" style={{ fontSize: tamanho / 5 }}>✦</span>}
  </span>
}
