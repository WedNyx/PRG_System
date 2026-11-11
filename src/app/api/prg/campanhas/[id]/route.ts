import { ator, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { podeAdministrar, situacaoConvite, validarCampanha, type ConviteRow } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

/** Detalhes: participantes para todos os membros; convites e pedidos só para mestre/co-mestre. */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await papelNaCampanha(id, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  const [campanha] = await rest<Record<string, unknown>[]>(`prg_campanhas?select=*&id=eq.${q(id)}&limit=1`)
  // O mundo (com páginas “só o mestre”) só sai pela rota /mundo, que filtra para os jogadores.
  if (campanha) { delete campanha.mundo; delete campanha.tabelas }
  const membros = await rest<Record<string, unknown>[]>(
    `prg_campanha_membros?select=aventureiro_id,papel,excecoes,entrou_em,aventureiro:prg_public_adventurers(apelido,avatar)&campanha_id=eq.${q(id)}&order=entrou_em.asc`)
  const admin = podeAdministrar(papel)
  let convites: (ConviteRow & { situacao: string })[] = []
  let solicitacoes: unknown[] = []
  if (admin) {
    const cs = await rest<ConviteRow[]>(`prg_convites?select=codigo,expira_em,usos,max_usos,revogado,criado_em&campanha_id=eq.${q(id)}&order=criado_em.desc&limit=20`)
    convites = cs.map(c => ({ ...c, situacao: situacaoConvite(c) }))
    solicitacoes = await rest(`prg_solicitacoes?select=id,aventureiro_id,mensagem,criada_em,aventureiro:prg_public_adventurers(apelido,avatar)&campanha_id=eq.${q(id)}&estado=eq.pendente&order=criada_em.asc`)
  }
  return ok({ campanha: { ...campanha, meuPapel: papel }, membros: admin ? membros : membros.map(({ excecoes: _e, ...m }) => m), convites, solicitacoes })
})

/** Editar nome, regras e estado (planejada/ativa/pausada/encerrada). */
export const PATCH = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre pode alterar a campanha.')
  const v = validarCampanha(await lerJson(req), true)
  if (!v.ok) throw new ErroApi(400, v.erro)
  if (!Object.keys(v.valor).length) throw new ErroApi(400, 'Nada para alterar.')
  const [campanha] = await rest<Record<string, unknown>[]>(`prg_campanhas?id=eq.${q(id)}`, {
    method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ ...v.valor, atualizada_em: new Date().toISOString() }),
  })
  return ok({ campanha })
})
