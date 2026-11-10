/**
 * Grupos de perfis no portal: separam quem é do servidor Lunethernnyis de quem vem de fora.
 * Os perfis criados antes da v0.21.0 ficam em Lunethernnyis (padrão da migração 017); cada pessoa pode trocar no “Editar perfil”.
 */
export const GRUPOS = [
  { id: 'de-fora', nome: 'De Fora', icone: '🧭', descricao: 'Convidados e outros grupos', cor: '#7dd3c0' },
  { id: 'lunethernnyis', nome: 'Lunethernnyis', icone: '🌙', descricao: 'Quem é do servidor', cor: '#b99bff' },
] as const
export type GrupoId = (typeof GRUPOS)[number]['id']
export const GRUPO_PADRAO: GrupoId = 'lunethernnyis'
export const ehGrupo = (v: unknown): v is GrupoId => GRUPOS.some(g => g.id === v)
export const grupoDe = (v: unknown) => GRUPOS.find(g => g.id === v) ?? GRUPOS.find(g => g.id === GRUPO_PADRAO)!
