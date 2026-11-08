import { NextRequest } from 'next/server'
import { ator, buscarFicha, checarOrigem, lerJson, ok, papelNaCampanha, q, regrasDoJogador, registrar, rest, rpc, rota, ErroApi, type FichaRow } from '@/lib/nuvem/servidor'
import { isUuid, normalizarPermissoes, normalizarExcecoes, podeAdministrar, validarFichaDados, isModelo } from '@/lib/nuvem/validacao'
import { diferencas, aplicar, separarPorRegra, resumoMudanca, type Mudanca } from '@/lib/nuvem/categorias'
import type { Campo } from '@/lib/campanhas/permissoes'
import { sistemaPorId } from '@/lib/sistemas/catalogo'
import { normalizarFicha } from '@/lib/sistemas/calculo'
import type { DadosFicha } from '@/lib/sistemas/tipos'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

async function carregar(req: NextRequest, id: string) {
  if (!isUuid(id)) throw new ErroApi(404, 'Ficha não encontrada.')
  const eu = await ator(req)
  const f = await buscarFicha(id)
  if (!f) throw new ErroApi(404, 'Ficha não encontrada.')
  const dono = f.dono_id === eu
  const admin = !!f.campanha_id && podeAdministrar(await papelNaCampanha(f.campanha_id, eu))
  return { f, eu, dono, admin }
}

/** Regras efetivas do jogador nesta ficha de campanha (para a interface mostrar). */
async function regrasEfetivas(f: FichaRow, eu: string) {
  const { campanha, excecoes } = await regrasDoJogador(f.campanha_id!, eu)
  const modelo = isModelo(campanha?.modelo_padrao) ? campanha.modelo_padrao : 'C'
  const padrao = normalizarPermissoes(campanha?.permissoes, modelo)
  const ex = normalizarExcecoes(excecoes)
  for (const a of f.areas_bloqueadas ?? []) (ex as Record<string, string>)[a] = 'mestre'
  return { padrao, excecoes: ex, efetivas: { ...padrao, ...ex } }
}

/** Dono vê sempre; mestre/co-mestre vê todas as fichas da campanha (NPCs só eles). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { f, eu, dono, admin } = await carregar(req, (await params).id)
  if (f.npc ? !admin : (!dono && !admin)) throw new ErroApi(404, 'Ficha não encontrada.')
  let regras = null, pendentes: string[] = []
  if (f.campanha_id && !admin) {
    regras = (await regrasEfetivas(f, eu)).efetivas
    const [p] = await rest<{ categorias: string[] }[]>(`prg_alteracoes?select=categorias&ficha_id=eq.${q(f.id)}&autor_id=eq.${q(eu)}&estado=eq.pendente`)
    pendentes = p?.categorias ?? []
  }
  const podeEditar = f.campanha_id ? (admin || (dono && f.status !== 'recusada' && !f.bloqueada)) : dono
  return ok({ ficha: f, podeEditar, souMestre: admin, regras, pendentes })
})

function resumoHistorico(mudancas: Mudanca[]) {
  const porCat = new Map<Campo, Mudanca[]>()
  for (const m of mudancas) porCat.set(m.categoria, [...(porCat.get(m.categoria) ?? []), m])
  return [...porCat].map(([categoria, ms]) => ({
    categoria,
    antes: ms.slice(0, 20).map(m => ({ campo: m.caminho, valor: resumoMudanca(m.antes, m.depois)[0] })),
    depois: ms.slice(0, 20).map(m => ({ campo: m.caminho, valor: resumoMudanca(m.antes, m.depois)[1] })),
  }))
}

/**
 * Salvar com versão. Em fichas de campanha, as regras do mestre valem AQUI no servidor:
 * áreas livres salvam, áreas "com aprovação" viram pedido, áreas do mestre são ignoradas.
 */
export const PUT = rota<Ctx>(async (req, { params }) => {
  const { f, eu, dono, admin } = await carregar(req, (await params).id)
  const body = await lerJson(req, 600_000) as { versao?: unknown; dados?: unknown }
  if (!Number.isInteger(body.versao)) throw new ErroApi(400, 'Versão ausente.')
  const v = validarFichaDados(body.dados)
  if (!v.ok) throw new ErroApi(400, v.erro)

  let final: Record<string, unknown> = v.valor.dados
  let pendentes: Mudanca[] = [], ignoradas: Mudanca[] = [], salvas: Mudanca[] = []

  if (!f.campanha_id) {
    if (!dono) throw new ErroApi(403, 'Somente o dono pode salvar esta ficha.')
  } else {
    if (f.npc ? !admin : (!dono && !admin)) throw new ErroApi(403, 'Sem permissão para editar esta ficha.')
    // Fichas genéricas: completa as chaves que faltam com os valores iniciais do modelo antes de comparar.
    const s = sistemaPorId(f.sistema)
    const antes = s ? normalizarFicha(s, f.dados as Partial<DadosFicha>) as unknown as Record<string, unknown> : (f.dados ?? {})
    if (s) v.valor.dados = normalizarFicha(s, v.valor.dados as Partial<DadosFicha>) as unknown as Record<string, unknown>
    f.dados = antes
    const mudancas = diferencas(f.sistema, antes, v.valor.dados)
    if (admin) { salvas = mudancas; final = v.valor.dados }
    else {
      if (f.status === 'recusada') throw new ErroApi(403, 'Esta ficha foi recusada pelo mestre.')
      if (f.bloqueada) throw new ErroApi(423, 'O mestre travou esta ficha neste momento.')
      const r = await regrasEfetivas(f, eu)
      const sep = separarPorRegra(mudancas, r.padrao, r.excecoes)
      salvas = sep.livres; pendentes = sep.aprovacao; ignoradas = sep.bloqueadas
      final = aplicar(f.dados ?? {}, salvas)
    }
  }

  let versao = f.versao
  if (!f.campanha_id || salvas.length) {
    const vf = validarFichaDados(final)
    const nome = vf.ok ? vf.valor.nome : f.nome
    const [salva] = await rpc<FichaRow[]>('prg_salvar_ficha', { p_id: f.id, p_dono: f.dono_id, p_versao: body.versao, p_nome: nome, p_dados: final })
    if (!salva) {
      const atual = await buscarFicha(f.id)
      return ok({ erro: 'A ficha foi alterada em outro lugar.', conflito: true, versaoAtual: atual?.versao }, 409)
    }
    versao = salva.versao
  } else if (body.versao !== f.versao) {
    return ok({ erro: 'A ficha foi alterada em outro lugar.', conflito: true, versaoAtual: f.versao }, 409)
  }

  if (f.campanha_id) {
    if (pendentes.length) {
      // Substitui o pedido pendente anterior deste jogador nesta ficha.
      await rest(`prg_alteracoes?ficha_id=eq.${q(f.id)}&autor_id=eq.${q(eu)}&estado=eq.pendente`, { method: 'DELETE' })
      await rest('prg_alteracoes', {
        method: 'POST',
        body: JSON.stringify({ ficha_id: f.id, campanha_id: f.campanha_id, autor_id: eu, mudancas: pendentes, categorias: [...new Set(pendentes.map(m => m.categoria))] }),
      })
    }
    await registrar([
      ...resumoHistorico(salvas).map(h => ({ ficha_id: f.id, campanha_id: f.campanha_id, autor_id: eu, tipo: 'edicao' as const, categoria: h.categoria, descricao: admin && !dono ? 'Editado pelo mestre' : 'Editado pelo jogador', antes: h.antes, depois: h.depois })),
      ...(pendentes.length ? [{ ficha_id: f.id, campanha_id: f.campanha_id, autor_id: eu, tipo: 'pedido' as const, descricao: 'Pedido de alteração: ' + [...new Set(pendentes.map(m => m.categoria))].join(', ') }] : []),
    ])
  }
  return ok({
    versao,
    pendentes: [...new Set(pendentes.map(m => m.categoria))],
    ignoradas: [...new Set(ignoradas.map(m => m.categoria))],
  })
})

export const DELETE = rota<Ctx>(async (req, { params }) => {
  checarOrigem(req)
  const { f, eu, dono, admin } = await carregar(req, (await params).id)
  if (f.campanha_id ? !admin : !dono) throw new ErroApi(403, f.campanha_id ? 'Fichas de campanha só o mestre exclui.' : 'Somente o dono pode excluir esta ficha.')
  await rest(`prg_fichas?id=eq.${q(f.id)}`, { method: 'DELETE' })
  if (f.campanha_id) await registrar([{ campanha_id: f.campanha_id, autor_id: eu, tipo: 'administracao', descricao: `Ficha excluída: ${f.nome || 'sem nome'}` }])
  return ok({ ok: true })
})
