import { ator, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { podeAdministrar } from '@/lib/nuvem/validacao'
import { lerMundo, mundoParaJogador } from '@/lib/mundo'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

/** Mundo da campanha: o mestre vê tudo; jogadores e espectadores não veem o que é “só o mestre”. */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await papelNaCampanha(id, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  const [c] = await rest<{ nome: string; mundo: unknown }[]>(`prg_campanhas?select=nome,mundo&id=eq.${q(id)}`)
  const mundo = lerMundo(c?.mundo)
  const admin = podeAdministrar(papel)
  return ok({ campanha: { id, nome: c?.nome ?? '' }, admin, mundo: admin ? mundo : mundoParaJogador(mundo) })
})

/** Só o mestre muda o mundo. `versao` evita apagar o que outro mestre salvou ao mesmo tempo. */
export const PUT = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Só o mestre muda o mundo da campanha.')
  const b = await lerJson(req, 600_000) as { mundo?: unknown; versao?: unknown }
  const [c] = await rest<{ mundo: unknown }[]>(`prg_campanhas?select=mundo&id=eq.${q(id)}`)
  const atual = lerMundo(c?.mundo)
  if (Number(b.versao) !== atual.versao) throw new ErroApi(409, 'O mundo foi mudado em outro lugar. Recarregue para ver a versão nova.')
  const novo = { ...lerMundo(b.mundo), versao: atual.versao + 1 }
  await rest(`prg_campanhas?id=eq.${q(id)}`, { method: 'PATCH', body: JSON.stringify({ mundo: novo }) })
  return ok({ mundo: novo })
})
