import { ator, nomeDaCampanha, notificar, participantes, checarOrigem, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

/** Sessões / diário da aventura. Jogadores veem só as publicadas (sem a preparação do mestre). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await papelNaCampanha(id, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  const admin = podeAdministrar(papel)
  const campos = admin ? '*' : 'id,numero,titulo,data,resumo,publicada,atualizada_em'
  const sessoes = await rest(`prg_sessoes?select=${campos}&campanha_id=eq.${q(id)}${admin ? '' : '&publicada=eq.true'}&order=numero.desc&limit=200`)
  return ok({ sessoes })
})

export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre organiza as sessões.')
  const b = await lerJson(req, 90_000) as Record<string, unknown>
  const titulo = typeof b.titulo === 'string' ? b.titulo.trim().slice(0, 120) : ''
  if (!titulo) throw new ErroApi(400, 'Dê um título à sessão.')
  const linha: Record<string, unknown> = {
    titulo, numero: Math.max(1, Math.min(9999, Math.round(Number(b.numero) || 1))),
    data: typeof b.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.data) ? b.data : null,
    preparacao: typeof b.preparacao === 'string' ? b.preparacao.slice(0, 20000) : '',
    resumo: typeof b.resumo === 'string' ? b.resumo.slice(0, 20000) : '',
    publicada: b.publicada === true, atualizada_em: new Date().toISOString(),
  }
  /** Avisa o grupo quando o resumo de uma sessão é publicado (só na primeira vez). */
  const avisarPublicacao = async () => {
    const [nomeC, ps] = await Promise.all([nomeDaCampanha(id), participantes(id)])
    await notificar(ps.map(p => ({ destinatario_id: p.aventureiro_id, campanha_id: id, tipo: 'diario', titulo: `📖 Novo resumo no diário de ${nomeC}`, texto: `Sessão ${linha.numero}: ${titulo}`, link: `/mesa?campanha=${id}` })), eu)
  }
  if (isUuid(b.id)) {
    const [antes] = await rest<{ publicada: boolean }[]>(`prg_sessoes?select=publicada&id=eq.${q(b.id)}&campanha_id=eq.${q(id)}`)
    const r = await rest<unknown[]>(`prg_sessoes?id=eq.${q(b.id)}&campanha_id=eq.${q(id)}`, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify(linha) })
    if (!r.length) throw new ErroApi(404, 'Sessão não encontrada.')
    if (linha.publicada && antes && !antes.publicada) await avisarPublicacao()
    return ok({ sessao: r[0] })
  }
  const [s] = await rest<unknown[]>('prg_sessoes', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ ...linha, campanha_id: id }) })
  if (linha.publicada) await avisarPublicacao()
  return ok({ sessao: s }, 201)
})

export const DELETE = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  checarOrigem(req)
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre exclui sessões.')
  const sid = req.nextUrl.searchParams.get('sessao')
  if (!isUuid(sid)) throw new ErroApi(400, 'Sessão inválida.')
  await rest(`prg_sessoes?id=eq.${q(sid)}&campanha_id=eq.${q(id)}`, { method: 'DELETE' })
  return ok({ ok: true })
})
