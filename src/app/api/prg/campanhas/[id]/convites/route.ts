import { NextRequest } from 'next/server'
import { ator, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi, checarOrigem } from '@/lib/nuvem/servidor'
import { gerarCodigoConvite, normalizarCodigo, podeAdministrar, validarConvite } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

async function exigirAdmin(req: NextRequest, id: string) {
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre gerencia convites.')
  return eu
}

/** Gera um convite novo. Para "renovar", gere outro e revogue o antigo. */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await exigirAdmin(req, id)
  const v = validarConvite(await lerJson(req))
  if (!v.ok) throw new ErroApi(400, v.erro)
  const [{ estado } = { estado: '' }] = await rest<{ estado: string }[]>(`prg_campanhas?select=estado&id=eq.${q(id)}`)
  if (estado === 'encerrada') throw new ErroApi(409, 'Campanha encerrada não aceita convites.')
  const ativos = await rest<unknown[]>(`prg_convites?select=codigo&campanha_id=eq.${q(id)}&revogado=eq.false&expira_em=gt.${q(new Date().toISOString())}`)
  if (ativos.length >= 10) throw new ErroApi(429, 'Limite de 10 convites ativos. Revogue algum antes.')
  const expira = new Date(Date.now() + v.valor.dias * 86_400_000).toISOString()
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const [convite] = await rest<Record<string, unknown>[]>('prg_convites', {
        method: 'POST', prefer: 'return=representation',
        body: JSON.stringify({ codigo: gerarCodigoConvite(), campanha_id: id, criado_por: eu, expira_em: expira, max_usos: v.valor.maxUsos }),
      })
      return ok({ convite: { ...convite, situacao: 'valido' } }, 201)
    } catch (e) { if (!(e instanceof ErroApi && e.status === 409)) throw e }
  }
  throw new ErroApi(500, 'Não foi possível gerar um código. Tente de novo.')
})

/** Revoga: DELETE /api/prg/campanhas/:id/convites?codigo=XXXX */
export const DELETE = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  checarOrigem(req)
  await exigirAdmin(req, id)
  const codigo = normalizarCodigo(req.nextUrl.searchParams.get('codigo'))
  if (!codigo) throw new ErroApi(400, 'Código inválido.')
  await rest(`prg_convites?codigo=eq.${q(codigo)}&campanha_id=eq.${q(id)}`, { method: 'PATCH', body: JSON.stringify({ revogado: true }) })
  return ok({ ok: true })
})
