import { ator, lerJson, ok, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { validarCampanha } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
const MAX_CAMPANHAS_MESTRE = 50

type Membro = { papel: string; campanha: Record<string, unknown> | null }

/** Lista as campanhas em que o aventureiro participa (como mestre ou jogador). */
export const GET = rota(async req => {
  const eu = await ator(req)
  const rows = await rest<Membro[]>(
    `prg_campanha_membros?select=papel,campanha:prg_campanhas(id,nome,descricao,sistema,modelo_padrao,permissoes,estado,mestre_id,criada_em,sessao_aberta,capa_url)&aventureiro_id=eq.${q(eu)}&order=entrou_em.desc&limit=200`)
  const campanhas = rows.filter(r => r.campanha).map(r => ({ ...r.campanha, meuPapel: r.papel, pendencias: 0 })) as (Record<string, unknown> & { id: string; meuPapel: string; pendencias: number })[]
  // Notificações para o mestre: pedidos de entrada, fichas para aprovar e pedidos de alteração.
  const adm = campanhas.filter(c => c.meuPapel === 'mestre' || c.meuPapel === 'comestre').map(c => c.id)
  if (adm.length) {
    const lista = `in.(${adm.map(q).join(',')})`
    const [a, b, c] = await Promise.all([
      rest<{ campanha_id: string }[]>(`prg_solicitacoes?select=campanha_id&estado=eq.pendente&campanha_id=${lista}`),
      rest<{ campanha_id: string }[]>(`prg_fichas?select=campanha_id&status=eq.pendente&campanha_id=${lista}`),
      rest<{ campanha_id: string }[]>(`prg_alteracoes?select=campanha_id&estado=eq.pendente&campanha_id=${lista}`),
    ])
    for (const x of [...a, ...b, ...c]) { const camp = campanhas.find(k => k.id === x.campanha_id); if (camp) camp.pendencias++ }
  }
  return ok({ campanhas })
})

/** Cria campanha; quem cria vira mestre. */
export const POST = rota(async req => {
  const eu = await ator(req)
  const v = validarCampanha(await lerJson(req))
  if (!v.ok) throw new ErroApi(400, v.erro)
  const minhas = await rest<unknown[]>(`prg_campanhas?select=id&mestre_id=eq.${q(eu)}&limit=${MAX_CAMPANHAS_MESTRE}`)
  if (minhas.length >= MAX_CAMPANHAS_MESTRE) throw new ErroApi(429, `Limite de ${MAX_CAMPANHAS_MESTRE} campanhas por mestre.`)
  const [campanha] = await rest<Record<string, unknown>[]>('prg_campanhas', {
    method: 'POST', prefer: 'return=representation',
    body: JSON.stringify({ ...v.valor, mestre_id: eu }),
  })
  try {
    await rest('prg_campanha_membros', { method: 'POST', body: JSON.stringify({ campanha_id: campanha.id, aventureiro_id: eu, papel: 'mestre' }) })
  } catch (e) {
    // Sem o vínculo de mestre a campanha ficaria órfã: desfaz.
    await rest(`prg_campanhas?id=eq.${q(String(campanha.id))}`, { method: 'DELETE' }).catch(() => {})
    throw e
  }
  return ok({ campanha: { ...campanha, meuPapel: 'mestre' } }, 201)
})
