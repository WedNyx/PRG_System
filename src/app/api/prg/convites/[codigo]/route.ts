import { ator, lerJson, ok, papelNaCampanha, q, rest, rpc, rota, ErroApi } from '@/lib/nuvem/servidor'
import { normalizarCodigo, situacaoConvite, type ConviteRow } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ codigo: string }> }
type Convite = ConviteRow & { campanha_id: string }

async function buscar(codigoBruto: string) {
  const codigo = normalizarCodigo(codigoBruto)
  if (!codigo) throw new ErroApi(404, 'Convite não encontrado.')
  const [c] = await rest<Convite[]>(`prg_convites?select=codigo,campanha_id,expira_em,usos,max_usos,revogado&codigo=eq.${q(codigo)}&limit=1`)
  if (!c) throw new ErroApi(404, 'Convite não encontrado.')
  return c
}

/** Prévia do convite: nome da campanha, sistema, mestre e se ainda vale. */
export const GET = rota<Ctx>(async (req, { params }) => {
  const c = await buscar((await params).codigo)
  const eu = await ator(req)
  const [camp] = await rest<Record<string, unknown>[]>(
    `prg_campanhas?select=nome,descricao,sistema,estado,mestre:prg_public_adventurers!prg_campanhas_mestre_id_fkey(apelido)&id=eq.${q(c.campanha_id)}&limit=1`)
  const pend = await rest<unknown[]>(`prg_solicitacoes?select=id&campanha_id=eq.${q(c.campanha_id)}&aventureiro_id=eq.${q(eu)}&estado=eq.pendente&limit=1`)
  return ok({
    convite: { codigo: c.codigo, situacao: situacaoConvite(c) },
    campanha: camp ? { id: c.campanha_id, ...camp } : null,
    jaParticipa: !!(await papelNaCampanha(c.campanha_id, eu)),
    pedidoPendente: pend.length > 0,
  })
})

/** Pede para entrar. O mestre aceita ou recusa depois. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const c = await buscar((await params).codigo)
  const eu = await ator(req)
  const body = await lerJson(req) as { mensagem?: unknown }
  const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim().slice(0, 300) : ''
  if (await papelNaCampanha(c.campanha_id, eu)) throw new ErroApi(409, 'Você já participa desta campanha.')
  const [camp] = await rest<{ estado: string }[]>(`prg_campanhas?select=estado&id=eq.${q(c.campanha_id)}`)
  if (!camp || camp.estado === 'encerrada') throw new ErroApi(409, 'Esta campanha foi encerrada.')
  const pend = await rest<unknown[]>(`prg_solicitacoes?select=id&campanha_id=eq.${q(c.campanha_id)}&aventureiro_id=eq.${q(eu)}&estado=eq.pendente&limit=1`)
  if (pend.length) throw new ErroApi(409, 'Seu pedido já foi enviado. Aguarde o mestre.')
  const usados = await rpc<unknown[]>('prg_usar_convite', { p_codigo: c.codigo })
  if (!usados.length) throw new ErroApi(410, 'Este convite expirou, foi revogado ou atingiu o limite de usos.')
  await rest('prg_solicitacoes', {
    method: 'POST',
    body: JSON.stringify({ campanha_id: c.campanha_id, aventureiro_id: eu, convite_codigo: c.codigo, mensagem }),
  })
  return ok({ ok: true }, 201)
})
