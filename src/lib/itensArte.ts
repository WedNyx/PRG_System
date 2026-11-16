/**
 * Raridade dos itens (cor da moldura) e leitura da arte antiga da Forja.
 * A Forja (desenhos próprios em SVG) saiu na v0.35.3: os itens usam ícones do Game-Icons ou foto própria.
 * Itens antigos guardavam `arte: { forma, cor, cor2 }`; só a forma é lida, para trocar pelo ícone equivalente.
 */
export type Raridade = 'comum' | 'incomum' | 'raro' | 'epico' | 'lendario' | 'unico'
export type ArteItem = { forma: string; cor: string; cor2: string }

export const RARIDADES: { id: Raridade; nome: string; cor: string }[] = [
  { id: 'comum', nome: 'Comum', cor: '#9ca3af' }, { id: 'incomum', nome: 'Incomum', cor: '#22c55e' },
  { id: 'raro', nome: 'Raro', cor: '#3b82f6' }, { id: 'epico', nome: 'Épico', cor: '#a855f7' },
  { id: 'lendario', nome: 'Lendário', cor: '#f59e0b' }, { id: 'unico', nome: 'Único', cor: '#ec4899' },
]
/** Arte antiga da Forja: só serve para achar o ícone equivalente (ver sugestaoIconeRpg). */
export function lerArte(v: unknown): ArteItem | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  return typeof o.forma === 'string' && /^[a-z-]{2,30}$/.test(o.forma) ? { forma: o.forma, cor: '', cor2: '' } : null
}
export const lerRaridade = (v: unknown): Raridade | undefined => RARIDADES.some(r => r.id === v) ? v as Raridade : undefined
export const corDaRaridade = (r?: Raridade) => RARIDADES.find(x => x.id === r)?.cor ?? '#5e4b78'
