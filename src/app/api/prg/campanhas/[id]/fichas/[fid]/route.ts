import { ator, buscarFicha, lerJson, ok, papelNaCampanha, q, registrar, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { podeAdministrar, isUuid } from '@/lib/nuvem/validacao'
import { CAMPOS } from '@/lib/campanhas/permissoes'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string; fid: string }> }
const AREAS = new Set<string>(CAMPOS.map(c => c.id))

/**
 * Ações do mestre sobre uma ficha da campanha:
 * decisao (aprovar | recusar | ajustar + observacao), bloqueada, areasBloqueadas, oculta, acao: 'duplicar'.
 */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id, fid } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre pode fazer isso.')
  const f = isUuid(fid) ? await buscarFicha(fid) : null
  if (!f || f.campanha_id !== id) throw new ErroApi(404, 'Ficha não encontrada.')
  const b = await lerJson(req) as Record<string, unknown>
  const obs = typeof b.observacao === 'string' ? b.observacao.trim().slice(0, 600) : undefined

  if (b.acao === 'duplicar') {
    const [copia] = await rest<{ id: string }[]>('prg_fichas', {
      method: 'POST', prefer: 'return=representation',
      body: JSON.stringify({ dono_id: f.dono_id, campanha_id: id, sistema: f.sistema, nome: (f.nome + ' (cópia)').slice(0, 90), dados: f.dados, npc: f.npc, oculta: true, status: 'ativa' }),
    })
    await registrar([{ ficha_id: copia.id, campanha_id: id, autor_id: eu, tipo: 'npc', descricao: `Duplicado de "${f.nome || 'sem nome'}"` }])
    return ok({ ficha: copia }, 201)
  }

  const mudanca: Record<string, unknown> = {}
  const log: string[] = []
  if (b.decisao !== undefined) {
    if (f.status !== 'pendente' && b.decisao !== 'recusar') throw new ErroApi(409, 'Esta ficha não está aguardando aprovação.')
    if (b.decisao === 'aprovar') { mudanca.status = 'ativa'; log.push('Ficha aprovada') }
    else if (b.decisao === 'recusar') { mudanca.status = 'recusada'; log.push('Ficha recusada') }
    else if (b.decisao === 'ajustar') { if (!obs) throw new ErroApi(400, 'Explique o ajuste que o jogador deve fazer.'); log.push('Ajustes solicitados') }
    else throw new ErroApi(400, 'Decisão inválida.')
    if (obs !== undefined) mudanca.observacao_mestre = obs
  } else if (obs !== undefined) mudanca.observacao_mestre = obs
  if (typeof b.bloqueada === 'boolean') { mudanca.bloqueada = b.bloqueada; log.push(b.bloqueada ? 'Ficha travada' : 'Ficha destravada') }
  if (Array.isArray(b.areasBloqueadas)) {
    const areas = b.areasBloqueadas.filter((a): a is string => typeof a === 'string' && AREAS.has(a))
    mudanca.areas_bloqueadas = areas; log.push('Áreas travadas: ' + (areas.join(', ') || 'nenhuma'))
  }
  if (typeof b.oculta === 'boolean') { mudanca.oculta = b.oculta; log.push(b.oculta ? 'NPC ocultado' : 'NPC revelado') }
  if (!Object.keys(mudanca).length && !log.length) throw new ErroApi(400, 'Nada para alterar.')
  if (Object.keys(mudanca).length) await rest(`prg_fichas?id=eq.${q(f.id)}`, { method: 'PATCH', body: JSON.stringify(mudanca) })
  await registrar([{ ficha_id: f.id, campanha_id: id, autor_id: eu, tipo: b.decisao !== undefined ? 'aprovacao' : 'bloqueio', descricao: log.join(' · ') + (obs ? ` — "${obs}"` : '') }])
  return ok({ ok: true })
})
