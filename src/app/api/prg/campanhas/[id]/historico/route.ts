import { ator, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { podeAdministrar } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

/** Registro de decisões e alterações da campanha (somente mestre/co-mestre). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre vê o registro.')
  const historico = await rest(`prg_historico?select=id,tipo,categoria,descricao,criado_em,ficha_id,autor:prg_public_adventurers(apelido),ficha:prg_fichas(nome)&campanha_id=eq.${q(id)}&order=criado_em.desc&limit=150`)
  return ok({ historico })
})
