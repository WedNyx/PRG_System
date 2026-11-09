import { ator, buscarFicha, linkFichaNuvem, notificar, lerJson, ok, papelNaCampanha, q, registrar, rest, rota, ErroApi } from '@/lib/nuvem/servidor'
import { isUuid, podeAdministrar, validarFichaDados } from '@/lib/nuvem/validacao'
import { aplicar, resumoMudanca, type Mudanca } from '@/lib/nuvem/categorias'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }
type Pedido = { id: string; ficha_id: string; autor_id: string; mudancas: Mudanca[]; categorias: string[]; estado: string }

/** Mestre: pedidos pendentes (com resumo antes → depois). Jogador: os próprios pedidos recentes. */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  const papel = await papelNaCampanha(id, eu)
  if (!papel) throw new ErroApi(404, 'Campanha não encontrada.')
  const admin = podeAdministrar(papel)
  const filtro = admin ? '&estado=eq.pendente' : `&autor_id=eq.${q(eu)}`
  const rows = await rest<(Pedido & Record<string, unknown>)[]>(`prg_alteracoes?select=id,ficha_id,autor_id,mudancas,categorias,estado,justificativa,criada_em,autor:prg_public_adventurers!prg_alteracoes_autor_id_fkey(apelido),ficha:prg_fichas(nome)&campanha_id=eq.${q(id)}${filtro}&order=criada_em.desc&limit=100`)
  return ok({
    alteracoes: rows.map(({ mudancas, ...r }) => ({
      ...r, itens: (mudancas ?? []).slice(0, 40).map(m => { const [antes, depois] = resumoMudanca(m.antes, m.depois); return { campo: m.caminho, categoria: m.categoria, antes, depois } }),
    })),
  })
})

/** Mestre decide: aceitar (aplica na ficha atual), recusar ou pedir ajuste (com justificativa). */
export const POST = rota<Ctx>(async (req, { params }) => {
  const { id } = await params
  const eu = await ator(req)
  if (!podeAdministrar(await papelNaCampanha(id, eu))) throw new ErroApi(403, 'Apenas o mestre decide pedidos.')
  const b = await lerJson(req) as { id?: unknown; decisao?: unknown; justificativa?: unknown }
  if (!isUuid(b.id)) throw new ErroApi(400, 'Pedido inválido.')
  const just = typeof b.justificativa === 'string' ? b.justificativa.trim().slice(0, 600) : ''
  const estado = b.decisao === 'aceitar' ? 'aceita' : b.decisao === 'recusar' ? 'recusada' : b.decisao === 'ajuste' ? 'ajuste' : null
  if (!estado) throw new ErroApi(400, 'Decisão inválida.')
  if (estado === 'ajuste' && !just) throw new ErroApi(400, 'Explique o ajuste.')
  const [p] = await rest<Pedido[]>(`prg_alteracoes?id=eq.${q(b.id)}&campanha_id=eq.${q(id)}&estado=eq.pendente`, {
    method: 'PATCH', prefer: 'return=representation',
    body: JSON.stringify({ estado, justificativa: just, decidida_por: eu, decidida_em: new Date().toISOString() }),
  })
  if (!p) throw new ErroApi(404, 'Pedido não encontrado ou já decidido.')
  if (estado === 'aceita') {
    // Aplica sobre a versão ATUAL da ficha (outras mudanças livres feitas depois são preservadas).
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const f = await buscarFicha(p.ficha_id)
      if (!f) break
      const novos = aplicar(f.dados ?? {}, p.mudancas)
      const v = validarFichaDados(novos)
      const r = await rest<unknown[]>(`prg_fichas?id=eq.${q(f.id)}&versao=eq.${f.versao}`, {
        method: 'PATCH', prefer: 'return=representation',
        body: JSON.stringify({ dados: novos, nome: v.ok ? v.valor.nome : f.nome, versao: f.versao + 1, atualizada_em: new Date().toISOString() }),
      })
      if (r.length) break
    }
  }
  await registrar([{ ficha_id: p.ficha_id, campanha_id: id, autor_id: eu, tipo: 'decisao',
    descricao: `Pedido de alteração (${p.categorias.join(', ')}) ${estado === 'aceita' ? 'aceito' : estado === 'recusada' ? 'recusado' : 'devolvido para ajuste'}${just ? ` — "${just}"` : ''}`,
    antes: estado === 'aceita' ? p.mudancas.slice(0, 20).map(m => ({ campo: m.caminho, valor: resumoMudanca(m.antes, m.depois)[0] })) : null,
    depois: estado === 'aceita' ? p.mudancas.slice(0, 20).map(m => ({ campo: m.caminho, valor: resumoMudanca(m.antes, m.depois)[1] })) : null }])
  const f = await buscarFicha(p.ficha_id)
  await notificar([{ destinatario_id: p.autor_id, campanha_id: id, tipo: 'alteracao_' + estado,
    titulo: estado === 'aceita' ? `✅ Alteração aceita em “${f?.nome || 'sua ficha'}”` : estado === 'recusada' ? `❌ Alteração recusada em “${f?.nome || 'sua ficha'}”` : `✏️ O mestre pediu ajustes na alteração de “${f?.nome || 'sua ficha'}”`,
    texto: just, link: f ? linkFichaNuvem(f) : null }], eu)
  return ok({ ok: true })
})
