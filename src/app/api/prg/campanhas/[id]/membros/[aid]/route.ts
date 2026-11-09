import { ator, linkCampanha, nomeDaCampanha, notificar, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi, checarOrigem } from '@/lib/nuvem/servidor'
import { isUuid, normalizarExcecoes, podeAdministrar } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string; aid: string }> }

/** Mestre muda papel (jogador/co-mestre/espectador) e exceções de permissão de um participante. */
export const PATCH = rota<Ctx>(async (req, { params }) => {
  const { id, aid } = await params
  const eu = await ator(req)
  const meu = await papelNaCampanha(id, eu)
  if (meu !== 'mestre') throw new ErroApi(403, 'Apenas o mestre altera participantes.')
  if (!isUuid(aid) || aid === eu) throw new ErroApi(400, 'Participante inválido.')
  const alvo = await papelNaCampanha(id, aid)
  if (!alvo) throw new ErroApi(404, 'Participante não encontrado.')
  const body = await lerJson(req) as Record<string, unknown>
  const mudanca: Record<string, unknown> = {}
  if (body.papel !== undefined) {
    if (body.papel !== 'jogador' && body.papel !== 'comestre' && body.papel !== 'espectador') throw new ErroApi(400, 'Papel inválido.')
    mudanca.papel = body.papel
  }
  if (body.excecoes !== undefined) mudanca.excecoes = normalizarExcecoes(body.excecoes)
  if (!Object.keys(mudanca).length) throw new ErroApi(400, 'Nada para alterar.')
  await rest(`prg_campanha_membros?campanha_id=eq.${q(id)}&aventureiro_id=eq.${q(aid)}`, { method: 'PATCH', body: JSON.stringify(mudanca) })
  if (mudanca.papel && mudanca.papel !== alvo) {
    const nomeP: Record<string, string> = { jogador: '⚔️ jogador', espectador: '👁️ espectador', comestre: '👑 co-mestre' }
    await notificar([{ destinatario_id: aid, campanha_id: id, tipo: 'papel', titulo: `Agora você é ${nomeP[mudanca.papel as string]} em ${await nomeDaCampanha(id)}`, link: linkCampanha(id) }], eu)
  }
  return ok({ ok: true })
})

/** Remover participante (mestre/co-mestre) ou sair da campanha (o próprio jogador). */
export const DELETE = rota<Ctx>(async (req, { params }) => {
  const { id, aid } = await params
  checarOrigem(req)
  const eu = await ator(req)
  if (!isUuid(aid)) throw new ErroApi(400, 'Participante inválido.')
  const meu = await papelNaCampanha(id, eu)
  const alvo = await papelNaCampanha(id, aid)
  if (!meu || !alvo) throw new ErroApi(404, 'Participante não encontrado.')
  if (alvo === 'mestre') throw new ErroApi(400, 'O mestre não pode ser removido da própria campanha.')
  const saindo = aid === eu
  if (!saindo && !podeAdministrar(meu)) throw new ErroApi(403, 'Sem permissão para remover participantes.')
  if (!saindo && meu === 'comestre' && alvo === 'comestre') throw new ErroApi(403, 'Só o mestre remove co-mestres.')
  await rest(`prg_campanha_membros?campanha_id=eq.${q(id)}&aventureiro_id=eq.${q(aid)}`, { method: 'DELETE' })
  // As fichas de campanha do jogador ficam arquivadas (não são apagadas).
  await rest(`prg_fichas?campanha_id=eq.${q(id)}&dono_id=eq.${q(aid)}`, { method: 'PATCH', body: JSON.stringify({ status: 'arquivada' }) })
  return ok({ ok: true })
})
