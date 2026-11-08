import { ator, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string; sid: string }> }

/** Mestre aceita ou recusa um pedido de participação. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id, sid } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre decide participações.')
  if (!isUuid(sid)) throw new ErroApi(400, 'Pedido inválido.')
  const body = await lerJson(req) as { decisao?: unknown }
  if (body.decisao !== 'aceitar' && body.decisao !== 'recusar') throw new ErroApi(400, 'Escolha aceitar ou recusar.')
  // Só muda se ainda estiver pendente (evita decidir duas vezes).
  const [pedido] = await rest<{ aventureiro_id: string }[]>(
    `prg_solicitacoes?id=eq.${q(sid)}&campanha_id=eq.${q(id)}&estado=eq.pendente`, {
      method: 'PATCH', prefer: 'return=representation',
      body: JSON.stringify({ estado: body.decisao === 'aceitar' ? 'aceita' : 'recusada', decidida_em: new Date().toISOString() }),
    })
  if (!pedido) throw new ErroApi(404, 'Pedido não encontrado ou já decidido.')
  if (body.decisao === 'aceitar') {
    await rest('prg_campanha_membros', {
      method: 'POST', prefer: 'resolution=ignore-duplicates',
      body: JSON.stringify({ campanha_id: id, aventureiro_id: pedido.aventureiro_id, papel: 'jogador' }),
    })
  }
  return ok({ ok: true })
})
