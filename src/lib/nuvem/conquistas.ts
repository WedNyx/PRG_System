// Somente servidor.
import { q, rest } from './servidor'
import { MINUTOS_COROA, type Conquistas } from '@/lib/molduras'

/**
 * O que a pessoa já conquistou para liberar molduras especiais (v0.37.2):
 * mestrou 15 minutos ou mais na mesa (Coroa do Mestre) e criou algum sistema (Criador de Mundos).
 * Antes da migração 041 não existe a contagem de minutos: aí vale “é mestre de alguma campanha”, como na v0.37.1.
 */
export async function conquistasDe(id: string): Promise<Conquistas & { minutos: number | null }> {
  const [perfil, sistemas] = await Promise.all([
    rest<{ usuario?: string; minutos_mestrados?: number }[]>(`prg_public_adventurers?select=usuario,minutos_mestrados&id=eq.${q(id)}&limit=1`).catch(() => null),
    rest<unknown[]>(`prg_sistemas_autorais?select=id&dono_id=eq.${q(id)}&limit=1`).catch(() => []),
  ])
  let minutos: number | null = perfil?.[0]?.minutos_mestrados ?? null
  let mestre = minutos !== null && minutos >= MINUTOS_COROA
  if (perfil === null) {
    minutos = null
    mestre = (await rest<unknown[]>(`prg_campanhas?select=id&mestre_id=eq.${q(id)}&limit=1`).catch(() => [])).length > 0
  }
  return { mestre, criador: sistemas.length > 0, usuario: perfil?.[0]?.usuario ?? null, minutos }
}
