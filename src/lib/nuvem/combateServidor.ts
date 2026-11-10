// Somente servidor: combate na mesa (ataque, dano, vida dos tokens ligados a fichas).
import { buscarFicha, ErroApi, q, rest, type FichaRow } from './servidor'
import { carregarSistema } from './sistemasServidor'
import { validarFichaDados } from './validacao'
import { aplicarNaVida, resumoCombate, type ResumoCombate } from '../sistemas/combate'
import { ehV8 } from './categorias'
import type { Sistema } from '../sistemas/tipos'

export type TokenCombate = { id: string; cena_id: string; ficha_id: string | null; dono_id: string | null; nome: string; x: number; y: number; hp_atual: number | null; hp_max: number | null }
export type RegrasCombate = { acerto: 'automatico' | 'mestre' }
export const lerRegrasCombate = (v: unknown): RegrasCombate => ({ acerto: (v as { acerto?: unknown })?.acerto === 'automatico' ? 'automatico' : 'mestre' })

export async function tokenCombate(cid: string, id: unknown): Promise<TokenCombate> {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new ErroApi(400, 'Token inválido.')
  const [t] = await rest<TokenCombate[]>(`prg_tokens?select=id,cena_id,ficha_id,dono_id,nome,x,y,hp_atual,hp_max&id=eq.${q(id)}&campanha_id=eq.${q(cid)}`)
  if (!t) throw new ErroApi(404, 'Token não encontrado.')
  return t
}

/** Ficha + sistema + resumo de combate (null para Ficha V8 ou ficha que não existe mais). */
export async function fichaDeCombate(fichaId: string | null): Promise<{ f: FichaRow; s: Sistema; r: ResumoCombate } | null> {
  if (!fichaId) return null
  const f = await buscarFicha(fichaId)
  if (!f || ehV8(f.sistema)) return null
  const s = await carregarSistema(f.sistema)
  return s ? { f, s, r: resumoCombate(s, f.dados) } : null
}

/** Muda os dados de uma ficha com controle de versão (tenta de novo se alguém salvou junto). */
export async function mudarFicha(fichaId: string, fn: (dados: Record<string, unknown>) => Record<string, unknown> | null): Promise<Record<string, unknown> | null> {
  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const f = await buscarFicha(fichaId)
    if (!f) return null
    const dados = fn(f.dados ?? {})
    if (!dados) return null
    const v = validarFichaDados(dados)
    const ok = await rest<unknown[]>(`prg_fichas?id=eq.${q(f.id)}&versao=eq.${f.versao}`, { method: 'PATCH', prefer: 'return=representation',
      body: JSON.stringify({ dados, nome: v.ok ? v.valor.nome : f.nome, versao: f.versao + 1, atualizada_em: new Date().toISOString() }) })
    if (ok.length) return dados
  }
  throw new ErroApi(409, 'A ficha estava sendo salva ao mesmo tempo. Tente de novo.')
}

/** Tira (ou devolve, se negativo) vida do alvo: na ficha ligada ao token, ou no próprio token. */
export async function aplicarDano(t: TokenCombate, dano: number): Promise<{ antes: number | null; depois: number | null; max: number | null }> {
  const fc = await fichaDeCombate(t.ficha_id)
  if (fc?.r.vida) {
    const { id, atual, max } = fc.r.vida
    const novos = await mudarFicha(fc.f.id, d => aplicarNaVida(d, id, dano, max))
    const depois = Number((novos?.recursos as Record<string, { atual: number }> | undefined)?.[id]?.atual ?? atual)
    await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify({ hp_atual: depois, hp_max: max }) }).catch(() => {})
    return { antes: atual, depois, max }
  }
  if (t.hp_atual === null && t.hp_max === null) return { antes: null, depois: null, max: null }
  const antes = t.hp_atual ?? t.hp_max ?? 0
  let depois = Math.max(0, antes - dano)
  if (t.hp_max !== null) depois = Math.min(depois, Math.max(t.hp_max, antes))
  await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify({ hp_atual: depois }) })
  return { antes, depois, max: t.hp_max }
}

/** Vida ao vivo dos tokens ligados a fichas (a ficha é quem manda). */
export async function vidaDasFichas(fichaIds: string[]): Promise<Record<string, { atual: number; max: number | null }>> {
  const ids = [...new Set(fichaIds)].slice(0, 100)
  if (!ids.length) return {}
  const fichas = await rest<{ id: string; sistema: string; dados: unknown }[]>(`prg_fichas?select=id,sistema,dados&id=in.(${ids.map(q).join(',')})`)
  const out: Record<string, { atual: number; max: number | null }> = {}
  const cache = new Map<string, Sistema | undefined>()
  for (const f of fichas) {
    if (ehV8(f.sistema)) continue
    if (!cache.has(f.sistema)) cache.set(f.sistema, await carregarSistema(f.sistema))
    const s = cache.get(f.sistema)
    const v = s ? resumoCombate(s, f.dados).vida : null
    if (v) out[f.id] = { atual: v.atual, max: v.max }
  }
  return out
}
