import { NextRequest } from 'next/server'
import { ator, checarOrigem, lerJson, ok, papelNaCampanha, q, rest, rpc, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar, validarFichaDados } from '@/lib/nuvem/validacao'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
type Ficha = { id: string; dono_id: string; campanha_id: string | null; versao: number }

async function carregar(req: NextRequest, id: string) {
  if (!isUuid(id)) throw new ErroApi(404, 'Ficha não encontrada.')
  const eu = await ator(req)
  const [f] = await rest<(Ficha & Record<string, unknown>)[]>(`prg_fichas?select=*&id=eq.${q(id)}&limit=1`)
  if (!f) throw new ErroApi(404, 'Ficha não encontrada.')
  const dono = f.dono_id === eu
  const admin = !!f.campanha_id && podeAdministrar(await papelNaCampanha(f.campanha_id, eu))
  return { f, eu, dono, admin }
}

/** Dono vê sempre; o mestre vê fichas da sua campanha. */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { f, dono, admin } = await carregar(req, (await params).id)
  if (!dono && !admin) throw new ErroApi(404, 'Ficha não encontrada.')
  return ok({ ficha: f, podeEditar: dono })
})

/** Salvar com versão: se outra aba/dispositivo salvou antes, devolve 409 com a versão atual. */
export const PUT = rota<Ctx>(async (req, { params }) => {
  const { f, eu, dono } = await carregar(req, (await params).id)
  // Fase 1: só o dono salva. Regras por campo (mestre/aprovação) chegam na Fase 2.
  if (!dono) throw new ErroApi(403, 'Somente o dono pode salvar esta ficha.')
  const body = await lerJson(req, 600_000) as { versao?: unknown; dados?: unknown }
  if (!Number.isInteger(body.versao)) throw new ErroApi(400, 'Versão ausente.')
  const v = validarFichaDados(body.dados)
  if (!v.ok) throw new ErroApi(400, v.erro)
  const [salva] = await rpc<Ficha[]>('prg_salvar_ficha', { p_id: f.id, p_dono: eu, p_versao: body.versao, p_nome: v.valor.nome, p_dados: v.valor.dados })
  if (!salva) {
    const [atual] = await rest<Ficha[]>(`prg_fichas?select=versao,atualizada_em&id=eq.${q(f.id)}`)
    return ok({ erro: 'A ficha foi alterada em outro lugar.', conflito: true, versaoAtual: atual?.versao }, 409)
  }
  return ok({ versao: salva.versao })
})

export const DELETE = rota<Ctx>(async (req, { params }) => {
  checarOrigem(req)
  const { f, dono } = await carregar(req, (await params).id)
  if (!dono) throw new ErroApi(403, 'Somente o dono pode excluir esta ficha.')
  await rest(`prg_fichas?id=eq.${q(f.id)}`, { method: 'DELETE' })
  return ok({ ok: true })
})
