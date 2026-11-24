import type { Sistema } from './tipos'

/** Qual visual a ficha usa: o id do sistema, ou o nome de um sistema autoral com visual próprio. */
export function identidadeVisual(s: Sistema): string {
  if (/lunethernnyis|opositores/i.test(s.nome)) return 'opositores'
  if (/projeto n\.?o\.?v\.?a/i.test(s.nome)) return 'nova'
  if (/^marcas\b/i.test(s.nome.trim())) return 'marcas'
  if (/^two\s*piece\b/i.test(s.nome.trim())) return 'two-piece'
  return s.id
}
