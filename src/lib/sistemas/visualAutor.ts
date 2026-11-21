import type { Sistema } from './tipos'

/** Desenhos de árvore que o autor pode escolher (os mesmos dos sistemas prontos). */
export const ARVORES_VISUAIS: { id: string; nome: string }[] = [
  { id: '', nome: 'O do visual do sistema' }, { id: 'padrao', nome: '🌳 Raízes' }, { id: 'nova', nome: '⬡ Rede de circuitos' },
  { id: 'ordem-paranormal', nome: '🕯️ Círculo ritual' }, { id: 'opositores', nome: '✨ Constelação' }, { id: 'tormenta20', nome: '⚡ Tempestade' },
  { id: 'pf2e', nome: '🛡️ Estandartes' }, { id: 'faroeste-arcano', nome: '🌵 Trilha' }, { id: 'call-of-cthulhu', nome: '🧵 Quadro de pistas' },
  { id: 'fate-core', nome: '✦ Escada' }, { id: 'blades', nome: '🏮 Becos' }, { id: 'mork-borg', nome: '💀 Ruína' }, { id: 'marcas', nome: '🐾 Rastro' },
]
const COR = /^#[0-9a-f]{6}$/i
/** Limpa a aparência vinda do construtor. */
export function lerVisualAutor(v: unknown): Sistema['visual'] | undefined {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const out: NonNullable<Sistema['visual']> = {}
  for (const k of ['acento', 'borda', 'cartao'] as const) if (typeof o[k] === 'string' && COR.test(o[k] as string)) out[k] = (o[k] as string).toLowerCase()
  if (o.fonte === 'serifada' || o.fonte === 'classica') out.fonte = o.fonte
  if (typeof o.arvore === 'string' && ARVORES_VISUAIS.some(a => a.id && a.id === o.arvore)) out.arvore = o.arvore
  return Object.keys(out).length ? out : undefined
}
export const FONTES_AUTOR = { serifada: 'var(--font-cormorant), Georgia, serif', classica: 'var(--font-cinzel), Georgia, serif' } as const
