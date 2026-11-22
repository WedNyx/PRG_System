import type { SVGProps } from 'react'
import type { FormaNo, TamanhoNo } from '@/lib/sistemas/arvore'

/** Formas dos nós da árvore (v0.36.7): hexágono (padrão), círculo, losango e quadrado, centrados em (0,0). */
const hex = (r: number) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 90); return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}` }).join(' ')

export const raioDoNo = (tamanho: TamanhoNo | undefined, base: number) => tamanho === 'p' ? Math.round(base * 0.78) : tamanho === 'g' ? Math.round(base * 1.35) : base

export function FormaSvg({ forma, r, ...p }: { forma?: FormaNo; r: number } & Omit<SVGProps<SVGElement>, 'r' | 'points'>) {
  const props = p as SVGProps<SVGPolygonElement & SVGCircleElement & SVGRectElement>
  if (forma === 'circulo') return <circle r={r * 0.92} {...props} />
  if (forma === 'quadrado') { const l = r * 1.55; return <rect x={-l / 2} y={-l / 2} width={l} height={l} rx={r * 0.22} {...props} /> }
  if (forma === 'losango') return <polygon points={`0,${-r * 1.08} ${r * 1.08},0 0,${r * 1.08} ${-r * 1.08},0`} {...props} />
  return <polygon points={hex(r)} {...props} />
}
/** O que aparece dentro do nó: o símbolo do autor ou a inicial do nome. */
export const simboloDoNo = (n: { icone?: string; nome: string }) => n.icone || n.nome.trim()[0]?.toUpperCase() || '?'
