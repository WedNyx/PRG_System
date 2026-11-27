import { NextRequest } from 'next/server'
import { apelidoDe, ator, lerJson, nomeDaCampanha, notificar, ok, papelNaCampanha, q, rest, rota, ErroApi, checarOrigem } from '@/lib/nuvem/servidor'
import { limparUsuario, validarUsuario } from '@/lib/usuario'
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
  const body = await lerJson(req) as Record<string, unknown>
  const [{ estado } = { estado: '' }] = await rest<{ estado: string }[]>(`prg_campanhas?select=estado&id=eq.${q(id)}`)
  if (estado === 'encerrada') throw new ErroApi(409, 'Campanha encerrada não aceita convites.')
  if (body.usuario !== undefined) return convidarPeloArroba(eu, id, body.usuario)
  const v = validarConvite(body)
  if (!v.ok) throw new ErroApi(400, v.erro)
  const ativos = await rest<unknown[]>(`prg_convites?select=codigo&campanha_id=eq.${q(id)}&para_id=is.null&revogado=eq.false&expira_em=gt.${q(new Date().toISOString())}`)
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

/**
 * Convite pelo @ (v0.37.0): só a pessoa escolhida pode usar, uma vez, por 14 dias. Ela recebe o aviso no sino
 * e, ao aceitar, entra direto (sem pedido), porque foi o mestre quem chamou.
 */
async function convidarPeloArroba(eu: string, campanhaId: string, bruto: unknown) {
  const usuario = limparUsuario(bruto)
  if (!validarUsuario(usuario).ok) throw new ErroApi(400, 'Digite o @ de quem você quer convidar.')
  const [alvo] = await rest<{ id: string; apelido: string }[]>(`prg_public_adventurers?select=id,apelido&usuario=eq.${q(usuario)}&limit=1`)
  if (!alvo) throw new ErroApi(404, `Ninguém usa o @${usuario}.`)
  if (alvo.id === eu) throw new ErroApi(400, 'Você já está na campanha.')
  if (await papelNaCampanha(campanhaId, alvo.id)) throw new ErroApi(409, `${alvo.apelido} já participa desta campanha.`)
  const agora = new Date().toISOString()
  const [aberto] = await rest<{ codigo: string }[]>(`prg_convites?select=codigo&campanha_id=eq.${q(campanhaId)}&para_id=eq.${q(alvo.id)}&revogado=eq.false&usos=eq.0&expira_em=gt.${q(agora)}&limit=1`)
  if (aberto) throw new ErroApi(409, `${alvo.apelido} já tem um convite esperando resposta.`)
  const pendentes = await rest<unknown[]>(`prg_convites?select=codigo&campanha_id=eq.${q(campanhaId)}&para_id=not.is.null&revogado=eq.false&usos=eq.0&expira_em=gt.${q(agora)}`)
  if (pendentes.length >= 30) throw new ErroApi(429, 'Muitos convites esperando resposta. Revogue alguns antes.')
  const expira = new Date(Date.now() + 14 * 86_400_000).toISOString()
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const [convite] = await rest<Record<string, unknown>[]>('prg_convites', {
        method: 'POST', prefer: 'return=representation',
        body: JSON.stringify({ codigo: gerarCodigoConvite(), campanha_id: campanhaId, criado_por: eu, expira_em: expira, max_usos: 1, para_id: alvo.id }),
      })
      const [quem, nomeC] = await Promise.all([apelidoDe(eu), nomeDaCampanha(campanhaId)])
      await notificar([{ destinatario_id: alvo.id, campanha_id: campanhaId, tipo: 'convite', titulo: `✉️ ${quem} chamou você para ${nomeC}`,
        texto: 'Abra para aceitar o convite.', link: '/convite/' + convite.codigo }], eu)
      return ok({ convite: { ...convite, situacao: 'valido', para: { apelido: alvo.apelido, usuario } } }, 201)
    } catch (e) { if (!(e instanceof ErroApi && e.status === 409)) throw e }
  }
  throw new ErroApi(500, 'Não foi possível criar o convite. Tente de novo.')
}

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
