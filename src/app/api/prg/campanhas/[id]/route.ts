import { ator, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar, situacaoConvite, validarCampanha, type ConviteRow } from '@/lib/nuvem/validacao'
import { lerConfiguracaoProgressao, type ModoProgressao } from '@/lib/sistemas/modoProgressao'

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
  const corpo = await lerJson(req)
  // Exceção de UMA ficha (v0.33.6): { excecaoFicha: { fichaId, modo: 'hibrido'|'automatico'|'manual'|null } }. null volta a seguir a campanha.
  const ex = (corpo as { excecaoFicha?: { fichaId?: unknown; modo?: unknown } } | null)?.excecaoFicha
  if (ex !== undefined) {
    if (!ex || typeof ex !== 'object' || !isUuid(ex.fichaId) || !(ex.modo === null || ex.modo === 'hibrido' || ex.modo === 'automatico' || ex.modo === 'manual'))
      throw new ErroApi(400, 'Exceção inválida.')
    const [ficha] = await rest<{ id: string }[]>(`prg_fichas?select=id&id=eq.${q(ex.fichaId as string)}&campanha_id=eq.${q(id)}&limit=1`)
    if (!ficha) throw new ErroApi(404, 'Ficha não encontrada nesta campanha.')
    const [atual] = await rest<{ config_progressao?: unknown }[]>(`prg_campanhas?select=config_progressao&id=eq.${q(id)}&limit=1`)
      .catch(() => { throw new ErroApi(409, 'O modo de progressão precisa da migração 027 no banco. Avise o administrador.') })
    const cfg = lerConfiguracaoProgressao(atual?.config_progressao)
    const excecoesPorFicha = { ...cfg.excecoesPorFicha }
    if (ex.modo) excecoesPorFicha[ficha.id] = ex.modo as ModoProgressao; else delete excecoesPorFicha[ficha.id]
    const [campanha] = await rest<Record<string, unknown>[]>(`prg_campanhas?id=eq.${q(id)}`, {
      method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ config_progressao: { ...cfg, excecoesPorFicha }, atualizada_em: new Date().toISOString() }),
    })
    return ok({ campanha })
  }
  const v = validarCampanha(corpo, true)
  if (!v.ok) throw new ErroApi(400, v.erro)
  if (!Object.keys(v.valor).length) throw new ErroApi(400, 'Nada para alterar.')
  if (v.valor.config_progressao) {
    // Trocar o modo da campanha não apaga as exceções por ficha já autorizadas (só troca as que vierem no pedido).
    const [atual] = await rest<{ config_progressao?: unknown }[]>(`prg_campanhas?select=config_progressao&id=eq.${q(id)}&limit=1`)
      .catch(() => { throw new ErroApi(409, 'O modo de progressão precisa da migração 027 no banco. Avise o administrador.') })
    const antes = lerConfiguracaoProgressao(atual?.config_progressao)
    v.valor.config_progressao = { ...v.valor.config_progressao, excecoesPorFicha: { ...antes.excecoesPorFicha, ...v.valor.config_progressao.excecoesPorFicha },
      // Fontes: só mudam quando vierem no pedido.
      ...(v.valor.config_progressao.baseLivro === undefined && antes.baseLivro ? { baseLivro: antes.baseLivro } : {}),
      ...(v.valor.config_progressao.fontes === undefined && antes.fontes ? { fontes: antes.fontes } : {}),
      ...(v.valor.config_progressao.fontesExtras === undefined && antes.fontesExtras ? { fontesExtras: antes.fontesExtras } : {}) }
  }
  const [campanha] = await rest<Record<string, unknown>[]>(`prg_campanhas?id=eq.${q(id)}`, {
    method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ ...v.valor, atualizada_em: new Date().toISOString() }),
  })
  return ok({ campanha })
})

/**
 * Excluir a campanha (v0.33.2): só o mestre, escrevendo o nome dela. Some tudo da campanha
 * (mesa, diário, convites, cópias das fichas); as fichas avulsas originais dos jogadores continuam.
 */
export const DELETE = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const [c] = await rest<{ nome: string; mestre_id: string }[]>(`prg_campanhas?select=nome,mestre_id&id=eq.${q(id)}&limit=1`)
  if (!c || !(await papelNaCampanha(id, eu))) throw new ErroApi(404, 'Campanha não encontrada.')
  if (c.mestre_id !== eu) throw new ErroApi(403, 'Só o mestre pode excluir a campanha.')
  const b = await lerJson(req, 1000) as { confirmar?: unknown }
  if (typeof b.confirmar !== 'string' || b.confirmar.trim().toLowerCase() !== c.nome.trim().toLowerCase())
    throw new ErroApi(400, 'Para confirmar, escreva o nome da campanha exatamente como ele é.')
  await rest(`prg_campanhas?id=eq.${q(id)}`, { method: 'DELETE' })
  return ok({ ok: true })
})
