import { ator, buscarFicha, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const f = isUuid(id) ? await buscarFicha(id) : null
  if (!f) throw new ErroApi(404, 'Ficha não encontrada.')
  const admin = !!f.campanha_id && podeAdministrar(await papelNaCampanha(f.campanha_id, eu))
  if (f.dono_id !== eu && !admin) throw new ErroApi(404, 'Ficha não encontrada.')
  const historico = await rest(`prg_historico?select=id,tipo,categoria,descricao,antes,depois,criado_em,autor:prg_public_adventurers(apelido)&ficha_id=eq.${q(f.id)}&order=criado_em.desc&limit=200`)
  return ok({ ficha: { id: f.id, nome: f.nome, sistema: f.sistema }, historico })
})
