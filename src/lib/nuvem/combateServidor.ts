// Somente servidor: combate na mesa (ataque, dano, vida dos tokens ligados a fichas).
import { buscarFicha, ErroApi, q, rest, rpc, type FichaRow } from './servidor'
import { carregarSistema } from './sistemasServidor'
import { validarFichaDados } from './validacao'
import { aplicarNaVida, resumoCombate, type ResumoCombate } from '../sistemas/combate'
import { ehV8 } from './categorias'
import { aoCair, aoLevantar, danoCaido, lerMorte, lerRegraMorte, type RegraMorte } from '../sistemas/morte'
import type { Sistema } from '../sistemas/tipos'

export type TokenCombate = { id: string; cena_id: string; ficha_id: string | null; dono_id: string | null; nome: string; x: number; y: number; hp_atual: number | null; hp_max: number | null }
export type RegrasCombate = { acerto: 'automatico' | 'mestre'; morte: RegraMorte }
export const lerRegrasCombate = (v: unknown): RegrasCombate => ({
  acerto: (v as { acerto?: unknown })?.acerto === 'automatico' ? 'automatico' : 'mestre',
  morte: lerRegraMorte((v as { morte?: unknown })?.morte),
})

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
  // Mesa cheia: vários ataques no mesmo alvo ao mesmo tempo. Tenta de novo com uma espera curta e aleatória.
  for (let tentativa = 0; tentativa < 12; tentativa++) {
    if (tentativa) await new Promise(r => setTimeout(r, 15 + Math.random() * 40 * Math.min(tentativa, 5)))
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
  // Uma operação só no banco: dois ataques juntos não “apagam” o dano um do outro (migração 024).
  const [r] = await rpc<{ antes: number; depois: number; maximo: number | null }[]>('prg_token_dano', { p_token: t.id, p_dano: Math.round(dano) })
  if (!r) throw new ErroApi(404, 'Token não encontrado.')
  return { antes: r.antes, depois: r.depois, max: r.maximo }
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

/** Escreve uma linha do sistema no chat da mesa. */
export const avisarMesa = (cid: string, eu: string, texto: string) =>
  rest('prg_mesa_eventos', { method: 'POST', body: JSON.stringify({ campanha_id: cid, autor_id: eu, tipo: 'sistema', visibilidade: 'publica', texto: texto.slice(0, 1000) }) }).catch(() => {})

/**
 * Depois de mudar a vida de um token: caiu (0), levou dano caído (falha) ou levantou (zera a contagem).
 * Só vale se a regra “à beira da morte” da campanha estiver ligada. Devolve as linhas para o chat.
 */
export async function atualizarMorte(cid: string, t: { id: string; nome: string }, vida: { antes: number | null; depois: number | null }, dano: number, critico = false): Promise<string[]> {
  if (vida.antes === null || vida.depois === null) return []
  const [camp] = await rest<{ combate: unknown }[]>(`prg_campanhas?select=combate&id=eq.${q(cid)}`)
  if (lerRegrasCombate(camp?.combate).morte === 'desligado') return []
  const [tk] = await rest<{ morte: unknown }[]>(`prg_tokens?select=morte&id=eq.${q(t.id)}`).catch(() => [])
  const m = lerMorte(tk?.morte)
  let novo = m, texto = ''
  if (vida.depois <= 0 && (vida.antes > 0 || !m.estado)) {
    novo = aoCair(m)
    texto = `💀 ${t.nome} caiu!` + (m.futuras ? ` As ${m.futuras} falha(s) das medidas desesperadas entram na conta.` : '')
      + (novo.estado === 'morto' ? ' Não resistiu…' : ' Faz testes contra a morte no começo do turno.')
  } else if (vida.depois <= 0 && dano > 0) {
    novo = danoCaido(m, critico)
    texto = `🩸 ${t.nome} levou dano caído: ${critico ? 'duas falhas' : 'uma falha'}` + (novo.estado === 'morto' ? ' — morreu.' : ` (❌ ${novo.falhas}/3).`)
  } else if (vida.depois > 0 && m.estado) {
    novo = aoLevantar(m)
    texto = `💚 ${t.nome} ${m.estado === 'morto' ? 'voltou à vida' : 'levantou'}!`
  }
  if (novo === m) return []
  await rest(`prg_tokens?id=eq.${q(t.id)}`, { method: 'PATCH', body: JSON.stringify({ morte: novo }) })
  return texto ? [texto] : []
}

/** Dano/cura + “à beira da morte” + aviso no chat. */
export async function danoComMorte(cid: string, eu: string, t: TokenCombate, dano: number, critico = false) {
  const vida = await aplicarDano(t, dano)
  for (const texto of await atualizarMorte(cid, t, vida, dano, critico)) await avisarMesa(cid, eu, texto)
  return vida
}
