import { NextRequest } from 'next/server'
import { apelidoDe, ator, buscarFicha, linkCampanha, mestresDe, notificar, participantes, checarOrigem, lerJson, ok, papelNaCampanha, q, regrasDoJogador, registrar, rest, rpc, rota, ErroApi, type FichaRow } from '@/lib/nuvem/servidor'
import { isUuid, normalizarPermissoes, normalizarExcecoes, podeAdministrar, validarFichaDados, isModelo } from '@/lib/nuvem/validacao'
import { diferencas, aplicar, separarPorRegra, resumoMudanca, type Mudanca } from '@/lib/nuvem/categorias'
import type { Campo } from '@/lib/campanhas/permissoes'
import { carregarSistema } from '@/lib/nuvem/sistemasServidor'
import { normalizarFicha } from '@/lib/sistemas/calculo'
import { lerArvore } from '@/lib/sistemas/arvore'
import type { DadosFicha } from '@/lib/sistemas/tipos'
import { lerConfiguracaoProgressao } from '@/lib/sistemas/modoProgressao'
import { lerEscolhasDnd, validarAlteracoesEscolhasDnd } from '@/lib/sistemas/dnd2024Ficha'
import { lerMagiasDnd, validarAlteracoesMagiasDnd } from '@/lib/sistemas/dnd2024Conjuracao'
import { idDe, lerMulticlasseDnd, validarAlteracoesMulticlasseDnd } from '@/lib/sistemas/dnd2024Classes'
import { fontesLiberadas, validarFontesCamposDnd, FONTE_PHB, FONTE_LEGADO_2014, FONTE_SRD } from '@/lib/sistemas/dnd2024Fontes'
import { lerLivrosDnd, validarLivrosDnd } from '@/lib/sistemas/dndLivros'
import { validarAlteracoesExclusivas2024 } from '@/lib/sistemas/dnd2014Criacao'
import { validarAlteracoes2014 } from '@/lib/sistemas/dnd2014Regras'
import { validarAlteracoesMagias2014 } from '@/lib/sistemas/dnd2014Magias'
import { validarTalentos2014 } from '@/lib/sistemas/dnd2014Talentos'
import { lerRegistroAntecedenteDnd, validarAlteracoesAntecedenteDnd } from '@/lib/sistemas/dnd2024Antecedentes'
import { lerTalentoMagiaHumano, validarAlteracoesTalentoMagiaHumano } from '@/lib/sistemas/dnd2024MagiaHumano'

export const dynamic = 'force-dynamic'
type Ctx = { params: Promise<{ id: string }> }

async function carregar(req: NextRequest, id: string) {
  if (!isUuid(id)) throw new ErroApi(404, 'Ficha não encontrada.')
  const eu = await ator(req)
  const f = await buscarFicha(id)
  if (!f) throw new ErroApi(404, 'Ficha não encontrada.')
  const dono = f.dono_id === eu
  const papel = f.campanha_id ? await papelNaCampanha(f.campanha_id, eu) : null
  const admin = !!f.campanha_id && podeAdministrar(papel)
  return { f, eu, dono, admin, espectador: papel === 'espectador' }
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

/**
 * Criação livre (v0.33.7): enquanto a ficha está sendo montada (o mestre ligou a criação livre, ou a ficha
 * ainda aguarda a aprovação de entrada), as áreas “com aprovação” salvam direto para o dono. Áreas “só mestre” continuam travadas.
 */
const emCriacao = (f: FichaRow) => f.status === 'pendente' || (f.dados as Partial<DadosFicha> | null)?.criacaoLivre === true
function semAprovacao<T extends Record<string, string>>(r: T): T {
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v === 'aprovacao' ? 'livre' : v])) as T
}

/** Dono vê sempre; mestre/co-mestre vê todas as fichas da campanha (NPCs só eles). */
export const GET = rota<Ctx>(async (req, { params }) => {
  const { f, eu, dono, admin } = await carregar(req, (await params).id)
  if (f.npc ? !admin : (!dono && !admin)) throw new ErroApi(404, 'Ficha não encontrada.')
  let regras = null, pendentes: string[] = [], pedido: Pick<Mudanca, 'caminho' | 'depois'>[] = []
  if (f.campanha_id && !admin) {
    const ef = (await regrasEfetivas(f, eu)).efetivas
    regras = emCriacao(f) ? semAprovacao(ef) : ef
    const [p] = await rest<{ categorias: string[]; mudancas: Mudanca[] }[]>(`prg_alteracoes?select=categorias,mudancas&ficha_id=eq.${q(f.id)}&autor_id=eq.${q(eu)}&estado=eq.pendente`)
    pendentes = p?.categorias ?? []
    // O que o jogador pediu e ainda espera o mestre: a ficha mostra esses valores (sem isso, ao recarregar parecia que não tinha salvo).
    pedido = (p?.mudancas ?? []).map(m => ({ caminho: m.caminho, depois: m.depois }))
  }
  const podeEditar = f.campanha_id ? (admin || (dono && f.status !== 'recusada' && !f.bloqueada)) : dono
  const [configCampanha] = f.campanha_id && f.sistema === 'dnd5e-srd'
    ? await rest<{ config_progressao?: unknown }[]>(`prg_campanhas?select=config_progressao&id=eq.${q(f.campanha_id)}&limit=1`).catch(() => [])
    : []
  const configProgressao = lerConfiguracaoProgressao(configCampanha?.config_progressao)
  return ok({ ficha: f, podeEditar, souMestre: admin, regras, pendentes, pedido, criacaoLivre: !!f.campanha_id && emCriacao(f), configProgressao })
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
  const { f, eu, dono, admin, espectador } = await carregar(req, (await params).id)
  if (espectador) throw new ErroApi(403, 'Espectadores não editam fichas da campanha.')
  const body = await lerJson(req, 600_000) as { versao?: unknown; dados?: unknown }
  if (!Number.isInteger(body.versao)) throw new ErroApi(400, 'Versão ausente.')
  const v = validarFichaDados(body.dados)
  if (!v.ok) throw new ErroApi(400, v.erro)
  // Livro-base e fontes liberadas pelo mestre. Revalidar também na gravação da ficha.
  let configLivros: ReturnType<typeof lerConfiguracaoProgressao> | null = null
  if (f.sistema === 'dnd5e-srd' && f.campanha_id) {
    const [cc] = await rest<{ config_progressao?: unknown }[]>(`prg_campanhas?select=config_progressao&id=eq.${q(f.campanha_id)}&limit=1`).catch(() => [])
    configLivros = lerConfiguracaoProgressao(cc?.config_progressao)
  }
  const liberadasCampanha = configLivros && !admin ? fontesLiberadas(configLivros.fontes) : null
  // Campanhas preexistentes permanecem na edição 2024 até o mestre mudar a opção.
  const regrasLivros = configLivros ? { ...configLivros, baseLivro: configLivros.baseLivro ?? 'phb2024' as const } : null
  const fontesDaFicha = (selecao: unknown): Set<string> | null => {
    if (selecao === undefined || selecao === null) return liberadasCampanha // compatibilidade com fichas antigas
    const x = lerLivrosDnd(selecao, configLivros?.baseLivro ?? 'phb2024')
    const ids = [FONTE_SRD, x.base === 'phb2024' ? FONTE_PHB : FONTE_LEGADO_2014, ...x.suplementos]
    return new Set(ids.filter(id =>
      id === FONTE_SRD || !liberadasCampanha || liberadasCampanha.has(id) ||
      (!!configLivros?.baseLivro && configLivros.baseLivro === x.base &&
        id === (x.base === 'phb2024' ? FONTE_PHB : FONTE_LEGADO_2014))))
  }
  // Valida mudanças em escolhas D&D ANTES da aplicação de permissão/aprovação.
  // Personagens antigos podem conservar escolhas históricas sem bloqueios retroativos.
  if (f.sistema === 'dnd5e-srd') {
    const antigo = f.dados as Partial<DadosFicha>
    const candidato = v.valor.dados as Partial<DadosFicha>
    const edicao = lerLivrosDnd(candidato.dndLivros, configLivros?.baseLivro ?? 'phb2024').base
    const erros = validarLivrosDnd(antigo.dndLivros, candidato.dndLivros, regrasLivros, admin)
    erros.push(...validarAlteracoesMagias2014(antigo, candidato, edicao))
    erros.push(...validarTalentos2014(antigo, candidato, edicao, admin))
    const liberadas = fontesDaFicha(candidato.dndLivros)
    if (edicao === 'phb2014') {
      erros.push(...validarAlteracoesExclusivas2024(antigo, candidato))
      erros.push(...validarAlteracoes2014(antigo, candidato, 'phb2014', admin))
    } else {
    erros.push(...validarAlteracoes2014(antigo, candidato, 'phb2024'))
    erros.push(...validarAlteracoesEscolhasDnd(
      { campos: antigo.campos ?? {}, dndEscolhas: antigo.dndEscolhas, dndMulticlasse: antigo.dndMulticlasse },
      { campos: candidato.campos ?? {}, dndEscolhas: candidato.dndEscolhas, dndMulticlasse: candidato.dndMulticlasse },
      liberadas
    ))
    erros.push(...validarAlteracoesMagiasDnd(
      { campos: antigo.campos ?? {}, dndEscolhas: antigo.dndEscolhas, dndMagias: antigo.dndMagias, dndMulticlasse: antigo.dndMulticlasse },
      { campos: candidato.campos ?? {}, dndEscolhas: candidato.dndEscolhas, dndMagias: candidato.dndMagias, dndMulticlasse: candidato.dndMulticlasse },
    ))
    erros.push(...validarFontesCamposDnd({ campos: antigo.campos ?? {} }, { campos: candidato.campos ?? {} }, liberadas))
    erros.push(...validarAlteracoesAntecedenteDnd(
      { campos: antigo.campos ?? {}, atributos: antigo.atributos ?? {}, dndAntecedente: antigo.dndAntecedente },
      { campos: candidato.campos ?? {}, atributos: candidato.atributos ?? {}, dndAntecedente: candidato.dndAntecedente },
      liberadas,
    ))
    erros.push(...validarAlteracoesTalentoMagiaHumano(
      { campos: antigo.campos ?? {}, dndEscolhas: antigo.dndEscolhas, dndAntecedente: antigo.dndAntecedente, dndTalentoHumano: antigo.dndTalentoHumano },
      { campos: candidato.campos ?? {}, dndEscolhas: candidato.dndEscolhas, dndAntecedente: candidato.dndAntecedente, dndTalentoHumano: candidato.dndTalentoHumano },
    ))
    erros.push(...validarAlteracoesMulticlasseDnd(
      { campos: antigo.campos ?? {}, atributos: antigo.atributos ?? {}, dndMulticlasse: antigo.dndMulticlasse },
      { campos: candidato.campos ?? {}, atributos: candidato.atributos ?? {}, dndMulticlasse: candidato.dndMulticlasse },
      { ignorarRequisitos: admin },
    ))

    }
    if (erros.length) throw new ErroApi(400, erros.join(' '))
    if (candidato.dndAntecedente !== undefined && lerRegistroAntecedenteDnd(candidato.dndAntecedente)) {
      v.valor.dados = { ...v.valor.dados, dndAntecedente: lerRegistroAntecedenteDnd(candidato.dndAntecedente) }
    }
    if (candidato.dndTalentoHumano !== undefined && lerTalentoMagiaHumano(candidato.dndTalentoHumano)) {
      v.valor.dados = { ...v.valor.dados, dndTalentoHumano: lerTalentoMagiaHumano(candidato.dndTalentoHumano) }
    }
    if (candidato.dndMulticlasse !== undefined) {
      v.valor.dados = { ...v.valor.dados, dndMulticlasse: lerMulticlasseDnd(candidato.dndMulticlasse, idDe(candidato.campos?.classe)) }
    }
    if (candidato.dndLivros !== undefined) {
      v.valor.dados = { ...v.valor.dados, dndLivros: lerLivrosDnd(candidato.dndLivros, configLivros?.baseLivro ?? 'phb2024') }
    }
    if (candidato.dndEscolhas !== undefined) {
      v.valor.dados = { ...v.valor.dados, dndEscolhas: lerEscolhasDnd(candidato.dndEscolhas) }
    }
    if (candidato.dndMagias !== undefined) {
      v.valor.dados = { ...v.valor.dados, dndMagias: lerMagiasDnd(candidato.dndMagias) }
    }
  }

  // Hexágonos concedidos (exceção do mestre, sem custo): na campanha, só o mestre concede ou retira.
  if (f.campanha_id && !admin) {
    const antes = lerArvore((f.dados as Partial<DadosFicha>)?.arvore).concedidos ?? []
    const depois = lerArvore((v.valor.dados as Partial<DadosFicha>)?.arvore).concedidos ?? []
    if (antes.length !== depois.length || antes.some(x => !depois.includes(x))) throw new ErroApi(403, 'Só o mestre concede ou retira hexágonos sem custo.')
  }

  // Criação livre: só o mestre liga; o dono pode desligar (“Terminei a criação”).
  if (f.campanha_id && !admin) {
    const antes = (f.dados as Partial<DadosFicha> | null)?.criacaoLivre === true
    const cand = v.valor.dados as Partial<DadosFicha>
    if (cand.criacaoLivre === true && !antes) v.valor.dados = { ...v.valor.dados, criacaoLivre: false }
  }
  const criando = !!f.campanha_id && !admin && emCriacao(f)

  let final: Record<string, unknown> = v.valor.dados
  let pendentes: Mudanca[] = [], ignoradas: Mudanca[] = [], salvas: Mudanca[] = []

  if (!f.campanha_id) {
    if (!dono) throw new ErroApi(403, 'Somente o dono pode salvar esta ficha.')
  } else {
    if (f.npc ? !admin : (!dono && !admin)) throw new ErroApi(403, 'Sem permissão para editar esta ficha.')
    // Fichas genéricas: completa as chaves que faltam com os valores iniciais do modelo antes de comparar.
    const s = await carregarSistema(f.sistema)
    const antes = s ? normalizarFicha(s, f.dados as Partial<DadosFicha>) as unknown as Record<string, unknown> : (f.dados ?? {})
    if (s) v.valor.dados = normalizarFicha(s, v.valor.dados as Partial<DadosFicha>) as unknown as Record<string, unknown>
    f.dados = antes
    const mudancas = diferencas(f.sistema, antes, v.valor.dados)
    if (admin) { salvas = mudancas; final = v.valor.dados }
    else {
      if (f.status === 'recusada') throw new ErroApi(403, 'Esta ficha foi recusada pelo mestre.')
      if (f.bloqueada) throw new ErroApi(423, 'O mestre travou esta ficha neste momento.')
      const r = await regrasEfetivas(f, eu)
      const sep = criando ? separarPorRegra(mudancas, semAprovacao(r.padrao), semAprovacao(r.excecoes as Record<string, string>)) : separarPorRegra(mudancas, r.padrao, r.excecoes)
      salvas = sep.livres; pendentes = sep.aprovacao; ignoradas = sep.bloqueadas
      final = aplicar(f.dados ?? {}, salvas)
    }
  }

  // Revalida contra o estado EFETIVAMENTE autorizado depois da separação
  // livre/aprovação/bloqueado. Evita usar um nível rejeitado para liberar escolha.
  if (f.sistema === 'dnd5e-srd') {
    const anterior = f.dados as Partial<DadosFicha>
    const autorizado = final as Partial<DadosFicha>
    const edicao = lerLivrosDnd(autorizado.dndLivros, configLivros?.baseLivro ?? 'phb2024').base
    const erros = validarLivrosDnd(anterior.dndLivros, autorizado.dndLivros, regrasLivros, admin)
    erros.push(...validarAlteracoesMagias2014(anterior, autorizado, edicao))
    erros.push(...validarTalentos2014(anterior, autorizado, edicao, admin))
    const liberadas = fontesDaFicha(autorizado.dndLivros)
    if (edicao === 'phb2014') {
      erros.push(...validarAlteracoesExclusivas2024(anterior, autorizado))
      erros.push(...validarAlteracoes2014(anterior, autorizado, 'phb2014', admin))
    } else {
    erros.push(...validarAlteracoes2014(anterior, autorizado, 'phb2024'))
    erros.push(...validarAlteracoesEscolhasDnd(
      { campos: anterior.campos ?? {}, dndEscolhas: anterior.dndEscolhas, dndMulticlasse: anterior.dndMulticlasse },
      { campos: autorizado.campos ?? {}, dndEscolhas: autorizado.dndEscolhas, dndMulticlasse: autorizado.dndMulticlasse },
      liberadas
    ))
    erros.push(...validarAlteracoesMagiasDnd(
      { campos: anterior.campos ?? {}, dndEscolhas: anterior.dndEscolhas, dndMagias: anterior.dndMagias, dndMulticlasse: anterior.dndMulticlasse },
      { campos: autorizado.campos ?? {}, dndEscolhas: autorizado.dndEscolhas, dndMagias: autorizado.dndMagias, dndMulticlasse: autorizado.dndMulticlasse },
    ))
    erros.push(...validarAlteracoesMulticlasseDnd(
      { campos: anterior.campos ?? {}, atributos: anterior.atributos ?? {}, dndMulticlasse: anterior.dndMulticlasse },
      { campos: autorizado.campos ?? {}, atributos: autorizado.atributos ?? {}, dndMulticlasse: autorizado.dndMulticlasse },
      { ignorarRequisitos: admin },
    ))
    erros.push(...validarAlteracoesAntecedenteDnd(
      { campos: anterior.campos ?? {}, atributos: anterior.atributos ?? {}, dndAntecedente: anterior.dndAntecedente },
      { campos: autorizado.campos ?? {}, atributos: autorizado.atributos ?? {}, dndAntecedente: autorizado.dndAntecedente },
      liberadas,
    ))

    }
    if (erros.length) throw new ErroApi(400, 'A escolha não foi liberada no nível autorizado: ' + erros.join(' '))
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
    // Na criação livre tudo já salvou: um pedido antigo deste jogador não faz mais sentido.
    if (criando && !pendentes.length) await rest(`prg_alteracoes?ficha_id=eq.${q(f.id)}&autor_id=eq.${q(eu)}&estado=eq.pendente`, { method: 'DELETE' })
    if (pendentes.length) {
      // Substitui o pedido pendente anterior deste jogador nesta ficha.
      await rest(`prg_alteracoes?ficha_id=eq.${q(f.id)}&autor_id=eq.${q(eu)}&estado=eq.pendente`, { method: 'DELETE' })
      await rest('prg_alteracoes', {
        method: 'POST',
        body: JSON.stringify({ ficha_id: f.id, campanha_id: f.campanha_id, autor_id: eu, mudancas: pendentes, categorias: [...new Set(pendentes.map(m => m.categoria))] }),
      })
      const [quem, ps] = await Promise.all([apelidoDe(eu), participantes(f.campanha_id)])
      await notificar(mestresDe(ps).map(m => ({ destinatario_id: m, campanha_id: f.campanha_id, tipo: 'pedido_alteracao', titulo: `✋ ${quem} pediu para alterar “${f.nome || 'uma ficha'}”`, texto: 'Áreas: ' + [...new Set(pendentes.map(x => x.categoria))].join(', '), link: linkCampanha(f.campanha_id!) })), eu)
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
