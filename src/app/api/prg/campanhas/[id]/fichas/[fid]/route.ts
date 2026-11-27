import { apelidoDe, ator, linkCampanha, linkFichaNuvem, mestresDe, nomeDaCampanha, notificar, participantes, buscarFicha, lerJson, ok, papelNaCampanha, q, registrar, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { devolverFicha } from '@/lib/nuvem/devolverFicha'
import { podeAdministrar, isUuid } from '@/lib/nuvem/validacao'
import { CAMPOS } from '@/lib/campanhas/permissoes'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string; fid: string }> }
const AREAS = new Set<string>(CAMPOS.map(c => c.id))

/**
 * Ações do mestre sobre uma ficha da campanha:
 * decisao (aprovar | recusar | ajustar + observacao), bloqueada, areasBloqueadas, oculta, acao: 'duplicar' | 'devolver'.
 */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id, fid } = await params
  const eu = await ator(req)
  const b = await lerJson(req) as Record<string, unknown>
  const f = isUuid(fid) ? await buscarFicha(fid) : null
  // O próprio jogador também pode desvincular a ficha dele (v0.37.0); o resto é só do mestre/co-mestre.
  const proprio = b.acao === 'devolver' && !!f && f.dono_id === eu && !f.npc
  if (!proprio && !podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre pode fazer isso.')
  if (!f || f.campanha_id !== id) throw new ErroApi(404, 'Ficha não encontrada.')
  const obs = typeof b.observacao === 'string' ? b.observacao.trim().slice(0, 600) : undefined

  // Tirar da campanha (v0.36.7): a ficha de jogador sai da mesa e volta para ele como ficha avulsa — nada se perde.
  // v0.37.0: o próprio jogador também pode (“Desvincular”); cópia enviada e nunca mexida só some (a original já é dele).
  if (b.acao === 'devolver') {
    if (f.npc) throw new ErroApi(400, 'NPCs são do mestre: para tirar um NPC, use Excluir.')
    const nomeC = await nomeDaCampanha(id), nomeF = f.nome || 'Personagem'
    const r = await devolverFicha(f, nomeC)
    if (proprio) {
      await registrar([{ campanha_id: id, autor_id: eu, tipo: 'administracao', descricao: r === 'removida' ? `Envio cancelado pelo jogador: ${nomeF}` : `O jogador desvinculou a ficha da campanha: ${nomeF}` }])
      const quem = await apelidoDe(eu)
      await notificar(mestresDe(await participantes(id)).map(m => ({ destinatario_id: m, campanha_id: id, tipo: 'ficha_desvinculada',
        titulo: r === 'removida' ? `↩️ ${quem} cancelou o envio de ${nomeF}` : `📦 ${quem} tirou ${nomeF} de ${nomeC}`, link: linkCampanha(id) })), eu)
    } else {
      await registrar([{ campanha_id: id, autor_id: eu, tipo: 'administracao', descricao: `Ficha tirada da campanha e devolvida ao jogador: ${nomeF}` }])
      await notificar([{ destinatario_id: f.dono_id, campanha_id: id, tipo: 'ficha_devolvida', titulo: `📦 ${nomeF} saiu de ${nomeC}`, texto: 'O mestre tirou a ficha da campanha. Ela continua com você, nas suas fichas avulsas.', link: r === 'devolvida' ? linkFichaNuvem(f) : null }], eu)
    }
    return ok({ ok: true, resultado: r })
  }

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
  if (!f.npc) {
    const nomeF = f.nome || 'sua ficha', nomeC = await nomeDaCampanha(id), link = linkFichaNuvem(f)
    const aviso = b.decisao === 'aprovar' ? { tipo: 'ficha_aprovada', titulo: `✅ ${nomeF} foi aprovada em ${nomeC}` }
      : b.decisao === 'recusar' ? { tipo: 'ficha_recusada', titulo: `❌ ${nomeF} foi recusada em ${nomeC}` }
      : b.decisao === 'ajustar' ? { tipo: 'ficha_ajuste', titulo: `✏️ O mestre pediu ajustes em ${nomeF}` }
      : typeof b.bloqueada === 'boolean' ? { tipo: 'ficha_trava', titulo: b.bloqueada ? `🔒 O mestre travou ${nomeF}` : `🔓 O mestre destravou ${nomeF}` } : null
    if (aviso) await notificar([{ destinatario_id: f.dono_id, campanha_id: id, ...aviso, texto: obs ?? '', link }], eu)
  }
  return ok({ ok: true })
})
