// Somente servidor: resolve sistemas do catálogo E sistemas autorais (salvos no banco).
import { q, rest } from './servidor'
import { SISTEMAS_OCULTOS, sistemaPorId, sistemaValido } from '../sistemas/catalogo'
import { ehAutoral, uuidDoAutoral } from '../sistemas/autoral'
import type { Sistema } from '../sistemas/tipos'

type Linha = { id: string; dono_id: string; nome: string; publicado: boolean; definicao: Sistema; dono?: { apelido: string } | null }

export async function linhaAutoral(id: string): Promise<Linha | null> {
  if (!ehAutoral(id)) return null
  const [l] = await rest<Linha[]>(`prg_sistemas_autorais?select=id,dono_id,nome,publicado,definicao,dono:prg_public_adventurers(apelido)&id=eq.${q(uuidDoAutoral(id))}`)
  return l ?? null
}
/** Definição para calcular/normalizar fichas (catálogo ou autoral). */
export async function carregarSistema(id: string): Promise<Sistema | undefined> {
  const s = sistemaPorId(id)
  if (s) return s
  const l = await linhaAutoral(id)
  return l ? { ...l.definicao, id, autor: l.dono?.apelido } : undefined
}
/** Pode criar ficha neste sistema? Catálogo: sempre. Autoral: publicado, ou rascunho do próprio autor. */
export async function sistemaPermitido(id: unknown, eu: string): Promise<boolean> {
  // Sistemas em revisão (Lunethernnyis e Ficha V8) ficam fora da plataforma: nada novo entra neles.
  if (typeof id === 'string' && SISTEMAS_OCULTOS.has(id)) return false
  if (sistemaValido(id)) return true
  if (!ehAutoral(id)) return false
  const l = await linhaAutoral(id)
  return !!l && (l.publicado || l.dono_id === eu)
}
