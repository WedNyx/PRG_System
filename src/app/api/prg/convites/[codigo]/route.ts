import { apelidoDe, linkCampanha, mestresDe, nomeDaCampanha, notificar, participantes, ator, lerJson, ok, papelNaCampanha, q, rest, rpc, rota, ErroApi } from '@/lib/nuvem/servidor'
import { normalizarCodigo, situacaoConvite, type ConviteRow } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ codigo: string }> }
type Convite = ConviteRow & { campanha_id: string; para_id: string | null }

async function buscar(codigoBruto: string) {
  const codigo = normalizarCodigo(codigoBruto)
  if (!codigo) throw new ErroApi(404, 'Convite não encontrado.')
  const [c] = await rest<Convite[]>(`prg_convites?select=codigo,campanha_id,expira_em,usos,max_usos,revogado,para_id&codigo=eq.${q(codigo)}&limit=1`)
  if (!c) throw new ErroApi(404, 'Convite não encontrado.')
  return c
}

/** Prévia do convite: nome da campanha, sistema, mestre e se ainda vale. */
export const GET = rota<Ctx>(async (req, { params }) => {
  const c = await buscar((await params).codigo)
  const eu = await ator(req)
  // Convite pelo @ é só de quem foi chamado: para os outros, ele “não existe”.
  if (c.para_id && c.para_id !== eu) throw new ErroApi(404, 'Convite não encontrado.')
  const [camp] = await rest<Record<string, unknown>[]>(
    `prg_campanhas?select=nome,descricao,sistema,estado,mestre:prg_public_adventurers!prg_campanhas_mestre_id_fkey(apelido)&id=eq.${q(c.campanha_id)}&limit=1`)
  const pend = await rest<unknown[]>(`prg_solicitacoes?select=id&campanha_id=eq.${q(c.campanha_id)}&aventureiro_id=eq.${q(eu)}&estado=eq.pendente&limit=1`)
  return ok({
    convite: { codigo: c.codigo, situacao: situacaoConvite(c), direto: !!c.para_id },
    campanha: camp ? { id: c.campanha_id, ...camp } : null,
    jaParticipa: !!(await papelNaCampanha(c.campanha_id, eu)),
    pedidoPendente: pend.length > 0,
  })
})

/** Pede para entrar. O mestre aceita ou recusa depois. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const c = await buscar((await params).codigo)
  const eu = await ator(req)
  if (c.para_id && c.para_id !== eu) throw new ErroApi(404, 'Convite não encontrado.')
  const body = await lerJson(req) as { mensagem?: unknown }
  const mensagem = typeof body.mensagem === 'string' ? body.mensagem.trim().slice(0, 300) : ''
  if (await papelNaCampanha(c.campanha_id, eu)) throw new ErroApi(409, 'Você já participa desta campanha.')
  const [camp] = await rest<{ estado: string }[]>(`prg_campanhas?select=estado&id=eq.${q(c.campanha_id)}`)
  if (!camp || camp.estado === 'encerrada') throw new ErroApi(409, 'Esta campanha foi encerrada.')
  const pend = await rest<unknown[]>(`prg_solicitacoes?select=id&campanha_id=eq.${q(c.campanha_id)}&aventureiro_id=eq.${q(eu)}&estado=eq.pendente&limit=1`)
  if (pend.length && !c.para_id) throw new ErroApi(409, 'Seu pedido já foi enviado. Aguarde o mestre.')
  const usados = await rpc<unknown[]>('prg_usar_convite', { p_codigo: c.codigo })
  if (!usados.length) throw new ErroApi(410, 'Este convite expirou, foi revogado ou atingiu o limite de usos.')
  if (c.para_id) {
    // Convite pelo @ (v0.37.0): o mestre já escolheu esta pessoa, então ela entra direto como jogador.
    await rest(`prg_solicitacoes?campanha_id=eq.${q(c.campanha_id)}&aventureiro_id=eq.${q(eu)}&estado=eq.pendente`, { method: 'DELETE' })
    await rest('prg_campanha_membros', { method: 'POST', prefer: 'resolution=ignore-duplicates', body: JSON.stringify({ campanha_id: c.campanha_id, aventureiro_id: eu, papel: 'jogador' }) })
    const [quem, nomeC, ps] = await Promise.all([apelidoDe(eu), nomeDaCampanha(c.campanha_id), participantes(c.campanha_id)])
    await notificar(mestresDe(ps).map(m => ({ destinatario_id: m, campanha_id: c.campanha_id, tipo: 'convite_aceito',
      titulo: `🎉 ${quem} aceitou o convite para ${nomeC}`, link: linkCampanha(c.campanha_id) })), eu)
    return ok({ ok: true, entrou: true, campanhaId: c.campanha_id }, 201)
  }
  await rest('prg_solicitacoes', {
    method: 'POST',
    body: JSON.stringify({ campanha_id: c.campanha_id, aventureiro_id: eu, convite_codigo: c.codigo, mensagem }),
  })
  const [quem, nomeC, ps] = await Promise.all([apelidoDe(eu), nomeDaCampanha(c.campanha_id), participantes(c.campanha_id)])
  await notificar(mestresDe(ps).map(m => ({ destinatario_id: m, campanha_id: c.campanha_id, tipo: 'pedido_entrada',
    titulo: `${quem} quer entrar em ${nomeC}`, texto: mensagem || 'Aceite ou recuse em “Pedidos para entrar”.', link: linkCampanha(c.campanha_id) })), eu)
  return ok({ ok: true }, 201)
})
