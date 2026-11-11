import { ator, lerJson, ok, papelNaCampanha, q, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar } from '@/lib/nuvem/validacao'
import { normalizarItem, normalizarPoder } from '@/lib/sistemas/inventario'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
const MAX = 500

async function soMestre(req: Parameters<typeof ator>[0], cid: string) {
  if (!isUuid(cid)) throw new ErroApi(404, 'Campanha não encontrada.')
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(cid, eu))) throw new ErroApi(403, 'Só o mestre usa a biblioteca.')
  return eu
}
/** Valida o conteúdo: guarda só os campos do item/poder (sem id; o nome vai na coluna). */
function conteudo(tipo: unknown, dados: unknown): { tipo: 'item' | 'poder'; nome: string; dados: Record<string, unknown> } {
  if (tipo !== 'item' && tipo !== 'poder') throw new ErroApi(400, 'Tipo inválido.')
  const v = tipo === 'item' ? normalizarItem(dados) : normalizarPoder(dados)
  if (!v) throw new ErroApi(400, 'Dê um nome.')
  const { id: _id, nome, ...resto } = v; void _id
  return { tipo, nome, dados: resto }
}

/** Itens e poderes prontos da campanha (só o mestre vê: pode ter segredos). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  await soMestre(req, id)
  return ok({ biblioteca: await rest(`prg_biblioteca?select=id,tipo,nome,dados,atualizado_em&campanha_id=eq.${q(id)}&order=tipo.asc,nome.asc&limit=${MAX}`) })
})

export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await soMestre(req, id)
  const b = await lerJson(req, 30_000) as Record<string, unknown>
  if (b.acao === 'criar') {
    const c = conteudo(b.tipo, b.dados)
    const ja = await rest<unknown[]>(`prg_biblioteca?select=id&campanha_id=eq.${q(id)}&limit=${MAX}`)
    if (ja.length >= MAX) throw new ErroApi(400, `Limite de ${MAX} entradas na biblioteca.`)
    const [r] = await rest<unknown[]>('prg_biblioteca', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ campanha_id: id, criado_por: eu, ...c }) })
    return ok({ entrada: r }, 201)
  }
  if (b.acao === 'importar') {
    // Vários de uma vez (ex.: da biblioteca pronta da plataforma).
    const entradas = (Array.isArray(b.entradas) ? b.entradas : []).slice(0, 60).map(x => { const o = (x ?? {}) as Record<string, unknown>; return conteudo(o.tipo, o.dados) })
    if (!entradas.length) throw new ErroApi(400, 'Nada para importar.')
    const ja = await rest<unknown[]>(`prg_biblioteca?select=id&campanha_id=eq.${q(id)}&limit=${MAX}`)
    if (ja.length + entradas.length > MAX) throw new ErroApi(400, `Limite de ${MAX} entradas na biblioteca.`)
    const r = await rest<unknown[]>('prg_biblioteca', { method: 'POST', prefer: 'return=representation', body: JSON.stringify(entradas.map(c => ({ campanha_id: id, criado_por: eu, ...c }))) })
    return ok({ entradas: r }, 201)
  }
  if (!isUuid(b.id)) throw new ErroApi(400, 'Entrada inválida.')
  const filtro = `prg_biblioteca?id=eq.${q(b.id)}&campanha_id=eq.${q(id)}`
  if (b.acao === 'editar') {
    const c = conteudo(b.tipo, b.dados)
    const r = await rest<unknown[]>(filtro, { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ ...c, atualizado_em: new Date().toISOString() }) })
    if (!r.length) throw new ErroApi(404, 'Entrada não encontrada.')
    return ok({ entrada: r[0] })
  }
  if (b.acao === 'excluir') { await rest(filtro, { method: 'DELETE' }); return ok({ ok: true }) }
  if (b.acao === 'duplicar') {
    const [orig] = await rest<{ tipo: string; nome: string; dados: unknown }[]>(`prg_biblioteca?select=tipo,nome,dados&id=eq.${q(b.id)}&campanha_id=eq.${q(id)}`)
    if (!orig) throw new ErroApi(404, 'Entrada não encontrada.')
    const c = conteudo(orig.tipo, { ...(orig.dados as object), nome: (orig.nome + ' (cópia)').slice(0, 120) })
    const [r] = await rest<unknown[]>('prg_biblioteca', { method: 'POST', prefer: 'return=representation', body: JSON.stringify({ campanha_id: id, criado_por: eu, ...c }) })
    return ok({ entrada: r }, 201)
  }
  throw new ErroApi(400, 'Ação desconhecida.')
})
