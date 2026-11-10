/**
 * Sistemas autorais criados no construtor. A definição usa o MESMO formato dos sistemas
 * do catálogo (tipos.ts), então a ficha, os cálculos, o inventário e as permissões funcionam iguais.
 * Tudo aqui é puro e testado (autoral.test.ts): o servidor valida antes de salvar.
 */
import { calcular, fichaVazia } from './calculo'
import { erroDaFormula } from './regrasRolagem'
import { lerArvore } from './arvore'
import { alvosDeBonus } from './inventario'
import { avaliar, variaveisDaFormula } from './formula'
import type { Sistema } from './tipos'

export const PREFIXO_AUTORAL = 'autoral-'
export const ehAutoral = (id: unknown): id is string => typeof id === 'string' && /^autoral-[0-9a-f]{32}$/.test(id)
export const idAutoral = (uuid: string) => PREFIXO_AUTORAL + uuid.replace(/-/g, '').toLowerCase()
export const uuidDoAutoral = (id: string) => { const h = id.slice(PREFIXO_AUTORAL.length); return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}` }

export const LIMITES = { campos: 30, atributos: 20, derivados: 30, pericias: 80, treinos: 8, recursos: 12, listas: 12, limites: 12, observacoes: 12, formula: 600, nome: 60, classes: 6, colunas: 12 }
const RESERVADO = /^(mod_|per_|tot_|qtd_|prog_)|^(soma_atributos|atributos_zero|maior_atributo|custo_pericias|maior_valor_pericia|carga_total|nivel_total|X|MOD|ATR|TREINO|VALOR)$/

/** Transforma um nome em identificador de fórmula: "Pontos de Mana" → pontos_de_mana. */
export function slug(nome: string, maiusculo = false): string {
  let s = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24)
  s = maiusculo ? s.toUpperCase() : s.toLowerCase()
  if (!/^[A-Za-z]/.test(s)) s = (maiusculo ? 'A' : 'v') + s
  return s.slice(0, 24) || (maiusculo ? 'A' : 'v')
}
/** Dá um id único (acrescenta _2, _3…). */
export function idUnico(base: string, usados: Set<string>): string {
  let id = base, i = 1
  while (usados.has(id) || RESERVADO.test(id)) id = base.slice(0, 21) + '_' + ++i
  usados.add(id); return id
}

const txt = (v: unknown, max: number) => typeof v === 'string' ? v.trim().slice(0, max) : ''
const num = (v: unknown, min: number, max: number, padrao: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : padrao }
const lista = (v: unknown, max: number): Record<string, unknown>[] => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').slice(0, max) as Record<string, unknown>[]
const ID_OK = /^[A-Za-z][A-Za-z0-9_]{0,23}$/

export type ResultadoValidacao = { ok: true; sistema: Sistema; avisos: string[] } | { ok: false; erros: string[] }

/**
 * Limpa e confere uma definição vinda do construtor: tamanhos, ids, e se TODA fórmula
 * só usa variáveis que existem. `meta` traz o id, o nome do autor e se veio de um modelo aberto (créditos).
 */
export function validarSistema(entrada: unknown, meta: { id: string; autor?: string }): ResultadoValidacao {
  const e = (entrada && typeof entrada === 'object' ? entrada : {}) as Record<string, unknown>
  const erros: string[] = [], avisos: string[] = []
  const nome = txt(e.nome, 80)
  if (nome.length < 2) erros.push('Dê um nome ao sistema (pelo menos 2 letras).')
  // Cada grupo tem seus próprios nomes: campos/atributos/valores viram variáveis (não podem repetir entre si);
  // perícias (per_/tot_), recursos e espaços de texto têm listas separadas.
  const usadosVars = new Set<string>(), usadosPer = new Set<string>(), usadosRec = new Set<string>(), usadosListas = new Set<string>()
  let usados = usadosVars
  const pegarId = (bruto: unknown, nomeItem: string, maiusculo = false) => {
    const id = typeof bruto === 'string' && ID_OK.test(bruto) && !usados.has(bruto) && !RESERVADO.test(bruto) ? bruto : idUnico(slug(nomeItem, maiusculo), usados)
    usados.add(id); return id
  }

  const campos = lista(e.campos, LIMITES.campos).flatMap(c => {
    const n = txt(c.nome, LIMITES.nome); if (!n) return []
    const tipo = c.tipo === 'numero' || c.tipo === 'area' ? c.tipo : 'texto'
    return [{ id: pegarId(c.id, n), nome: n, tipo: tipo as 'texto' | 'numero' | 'area', ...(tipo === 'numero' ? { padrao: num(c.padrao, -99999, 99999, 0) } : {}) }]
  })
  const atributos = lista(e.atributos, LIMITES.atributos).flatMap(a => {
    const n = txt(a.nome, LIMITES.nome); if (!n) return []
    const min = num(a.min, -100, 1000, 0), max = Math.max(min, num(a.max, -100, 1000, 10))
    return [{ id: pegarId(a.id, n, true), nome: n, min, max, padrao: num(a.padrao, min, max, min) }]
  })
  usados = usadosVars
  const derivados = lista(e.derivados, LIMITES.derivados).flatMap(d => {
    const n = txt(d.nome, LIMITES.nome); if (!n) return []
    const dica = txt(d.dica, 120)
    return [{ id: pegarId(d.id, n), nome: n, formula: txt(d.formula, LIMITES.formula) || '0', ...(dica ? { dica } : {}) }]
  })
  const p = e.pericias && typeof e.pericias === 'object' ? e.pericias as Record<string, unknown> : null
  let pericias: Sistema['pericias']
  if (p && p.modo !== 'nenhuma') {
    const modo = p.modo === 'valor' ? 'valor' : 'treino'
    const idsTreino = new Set<string>()
    const treinos = modo === 'treino' ? lista(p.treinos, LIMITES.treinos).flatMap(t => {
      const n = txt(t.nome, 40); if (!n) return []
      const id = typeof t.id === 'string' && ID_OK.test(t.id) && !idsTreino.has(t.id) ? t.id : idUnico(slug(n), idsTreino); idsTreino.add(id)
      return [{ id, nome: n, formula: txt(t.formula, LIMITES.formula) || '0', ...(Number(t.custo) ? { custo: num(t.custo, 0, 100, 0) } : {}) }]
    }) : undefined
    const idsAtr = new Set(atributos.map(a => a.id))
    usados = usadosPer
    const listaP = lista(p.lista, LIMITES.pericias).flatMap(x => {
      const n = txt(x.nome, LIMITES.nome); if (!n) return []
      const atr = typeof x.atributo === 'string' ? x.atributo.split('/').filter(a => idsAtr.has(a)).slice(0, 2).join('/') : ''
      const grupo = txt(x.grupo, 50)
      return [{ id: pegarId(x.id, n), nome: n, ...(atr ? { atributo: atr } : {}), ...(grupo ? { grupo } : {}) }]
    })
    if (modo === 'treino' && !treinos?.length) erros.push('Perícias por treino precisam de pelo menos um grau (ex.: Destreinado +0).')
    if (listaP.length) pericias = { titulo: txt(p.titulo, 40) || undefined, modo, lista: listaP, ...(treinos ? { treinos } : {}), total: txt(p.total, LIMITES.formula) || (modo === 'valor' ? 'VALOR' : 'MOD + TREINO') }
  }
  usados = usadosRec
  const recursos = lista(e.recursos, LIMITES.recursos).flatMap(r => {
    const n = txt(r.nome, LIMITES.nome); if (!n) return []
    const formula = txt(r.formula, LIMITES.formula)
    const maxFixo = !formula && Number(r.maxFixo) > 0 ? num(r.maxFixo, 1, 99999, 1) : undefined
    return [{ id: pegarId(r.id, n), nome: n, ...(formula ? { formula } : {}), ...(maxFixo ? { maxFixo } : {}) }]
  })
  usados = usadosListas
  const listas = lista(e.listas, LIMITES.listas).flatMap(l => {
    const n = txt(l.nome, LIMITES.nome); if (!n) return []
    return [{ id: pegarId(l.id, n), nome: n }]
  })
  const limites = lista(e.limites, LIMITES.limites).flatMap(l => {
    const n = txt(l.nome, 80), uso = txt(l.uso, LIMITES.formula), max = txt(l.max, LIMITES.formula)
    return n && uso && max ? [{ nome: n, uso, max }] : []
  })
  const observacoes = (Array.isArray(e.observacoes) ? e.observacoes : []).map(o => txt(o, 300)).filter(Boolean).slice(0, LIMITES.observacoes)
  const formulaModificador = txt(e.formulaModificador, LIMITES.formula) || undefined
  let rolagem: Sistema['rolagem'] = e.rolagem === 'd100' || e.rolagem === 'nenhuma' || e.rolagem === 'personalizada' ? e.rolagem : 'd20'
  let regraRolagem: Sistema['regraRolagem']
  if (rolagem === 'personalizada') {
    const r = e.regraRolagem && typeof e.regraRolagem === 'object' ? e.regraRolagem as Record<string, unknown> : {}
    const formula = txt(r.formula, 60).trim(), erro = erroDaFormula(formula)
    if (erro) { erros.push('Rolagem personalizada: ' + erro); rolagem = 'd20' }
    else regraRolagem = { nome: txt(r.nome, 40).trim() || 'Teste', formula: formula.replace(/\s+/g, '') }
  }
  const cargaF = e.carga && typeof e.carga === 'object' ? e.carga as Record<string, unknown> : null
  const carga = cargaF && txt(cargaF.formula, LIMITES.formula) ? { formula: txt(cargaF.formula, LIMITES.formula), unidade: txt(cargaF.unidade, 16) || 'kg' } : undefined
  const creditos = txt(e.creditos, 1500) || undefined

  // ---- Progressão por nível (tabelas por classe): cada coluna vira a variável prog_<coluna> ----
  let progressoes: Sistema['progressoes']
  const pe = e.progressoes && typeof e.progressoes === 'object' ? e.progressoes as Record<string, unknown> : null
  if (pe && Array.isArray(pe.classes) && pe.classes.length) {
    const numericos = new Set(campos.filter(c => c.tipo === 'numero').map(c => c.id))
    const idsCl = new Set<string>(), colunasNomes: Record<string, string> = {}
    const nomesIn = pe.colunas && typeof pe.colunas === 'object' ? pe.colunas as Record<string, unknown> : {}
    const classes = (pe.classes as unknown[]).slice(0, LIMITES.classes).flatMap(x => {
      const c = x && typeof x === 'object' ? x as Record<string, unknown> : {}
      const nomeCl = txt(c.nome, 40).trim(); if (!nomeCl) return []
      const id = idUnico(typeof c.id === 'string' && /^[a-z][a-z0-9_]{0,24}$/.test(c.id) ? c.id : slug(nomeCl) || 'classe', idsCl); idsCl.add(id)
      const campoNivel = typeof c.campoNivel === 'string' ? c.campoNivel : ''
      if (!numericos.has(campoNivel)) { erros.push(`Progressão “${nomeCl}”: escolha o campo do nível (um campo de número, ex.: Nível).`); return [] }
      const tabela: Record<string, number[]> = {}
      const t = c.tabela && typeof c.tabela === 'object' ? c.tabela as Record<string, unknown> : {}
      for (const [col, valores] of Object.entries(t).slice(0, LIMITES.colunas)) {
        if (!/^[a-z][a-z0-9_]{0,24}$/.test(col) || !Array.isArray(valores)) continue
        const v = valores.slice(0, 20).map(n => Math.round(Math.max(-10000, Math.min(10000, Number(n) || 0)) * 100) / 100)
        while (v.length < 20) v.push(v.at(-1) ?? 0)
        tabela[col] = v
        const nomeCol = txt(nomesIn[col], 40).trim(); if (nomeCol) colunasNomes[col] = nomeCol
      }
      return [{ id, nome: nomeCl, campoNivel, tabela }]
    })
    if (classes.length) progressoes = { classes, ...(Object.keys(colunasNomes).length ? { colunas: colunasNomes } : {}) }
  }

  const sistema: Sistema = {
    id: meta.id, nome, resumo: txt(e.resumo, 400), tipo: 'autoral',
    licenca: 'Sistema autoral' + (meta.autor ? ' de ' + meta.autor : ''), ...(creditos ? { creditos } : {}),
    dados: txt(e.dados, 40) || (rolagem === 'd100' ? 'd100' : rolagem === 'd20' ? 'd20' : regraRolagem ? regraRolagem.formula.replace(/VALOR/gi, 'X') : 'Livre'), rolagem, ...(regraRolagem ? { regraRolagem } : {}),
    campos, atributos, ...(formulaModificador ? { formulaModificador } : {}), derivados, ...(pericias ? { pericias } : {}),
    recursos, ...(limites.length ? { limites } : {}), listas: listas.length ? listas : [{ id: 'anotacoes', nome: 'Anotações' }],
    ...(observacoes.length ? { observacoes } : {}), ...(carga ? { carga } : {}), ...(progressoes ? { progressoes } : {}),
  }
  // ---- Árvore padrão: bônus só em alvos que existem neste sistema ----
  const arv = lerArvore(e.arvore)
  if (arv.nos.length) {
    const alvos = new Set(alvosDeBonus(sistema).map(a => a.id))
    let tirados = 0
    for (const n of arv.nos) n.efeitos = n.efeitos.filter(ef => ef.tipo !== 'bonus' || alvos.has(ef.alvo) || (tirados++, false))
    if (tirados) avisos.push(`${tirados} bônus da árvore apontavam para algo que não existe mais e foram tirados.`)
    sistema.arvore = { pontos: arv.pontos, nos: arv.nos }
  }

  // ---- Fórmulas: só podem usar variáveis que existem ----
  const vars = new Set<string>([
    ...campos.filter(c => c.tipo === 'numero').map(c => c.id), ...atributos.flatMap(a => [a.id, 'mod_' + a.id]),
    ...derivados.map(d => d.id), ...(pericias?.lista ?? []).flatMap(x => ['per_' + x.id, 'tot_' + x.id]),
    ...(pericias?.treinos ?? []).map(t => 'qtd_' + t.id),
    'soma_atributos', 'atributos_zero', 'maior_atributo', 'custo_pericias', 'maior_valor_pericia', 'carga_total',
    ...(progressoes ? ['nivel_total', ...new Set(progressoes.classes.flatMap(c => Object.keys(c.tabela).map(k => 'prog_' + k)))] : []),
  ])
  const conferir = (rotulo: string, f: string | undefined, extras: string[] = []) => {
    if (!f) return
    try {
      const desconhecidas = variaveisDaFormula(f).filter(v => !vars.has(v) && !extras.includes(v))
      if (desconhecidas.length) erros.push(`${rotulo}: “${desconhecidas.join('”, “')}” não existe. Use os nomes da lista de variáveis.`)
      else avaliar(f, Object.fromEntries([...vars, ...extras].map(v => [v, 1])))
    } catch (er) { erros.push(`${rotulo}: fórmula com erro (${er instanceof Error ? er.message : 'inválida'}).`) }
  }
  conferir('Modificador dos atributos', formulaModificador, ['X'])
  derivados.forEach(d => conferir(`Valor “${d.nome}”`, d.formula))
  pericias?.treinos?.forEach(t => conferir(`Grau “${t.nome}”`, t.formula))
  if (pericias) conferir('Total das perícias', pericias.total, ['MOD', 'ATR', 'TREINO', 'VALOR'])
  recursos.forEach(r => conferir(`Recurso “${r.nome}”`, r.formula))
  limites.forEach(l => { conferir(`Limite “${l.nome}” (uso)`, l.uso); conferir(`Limite “${l.nome}” (máximo)`, l.max) })
  conferir('Capacidade de carga', carga?.formula)
  if (!atributos.length && !pericias && !recursos.length && !campos.length) erros.push('Adicione pelo menos um atributo, perícia, recurso ou campo.')
  if (erros.length) return { ok: false, erros }

  // ---- Ficha de teste: tudo precisa calcular sem erro ----
  try {
    const c = calcular(sistema, fichaVazia(sistema))
    for (const d of derivados) if (c.derivados[d.id] === null) erros.push(`Valor “${d.nome}” não conseguiu calcular.`)
  } catch { erros.push('A ficha de teste não conseguiu calcular. Revise as fórmulas.') }
  if (erros.length) return { ok: false, erros }
  if (atributos.some(a => a.max === a.min)) avisos.push('Algum atributo tem mínimo igual ao máximo.')
  return { ok: true, sistema, avisos }
}

/** Ponto de partida do construtor: um sistema pequeno e funcional. */
export function sistemaEmBranco(): Record<string, unknown> {
  return {
    nome: '', resumo: '', dados: 'd20', rolagem: 'd20',
    campos: [{ id: 'conceito', nome: 'Conceito', tipo: 'texto' }, { id: 'nivel', nome: 'Nível', tipo: 'numero', padrao: 1 }],
    atributos: [{ id: 'FOR', nome: 'Força', min: 0, max: 5, padrao: 1 }, { id: 'AGI', nome: 'Agilidade', min: 0, max: 5, padrao: 1 }, { id: 'MEN', nome: 'Mente', min: 0, max: 5, padrao: 1 }],
    derivados: [{ id: 'vida_max', nome: 'Vida máxima', formula: '10 + FOR * 2 + nivel * 3' }, { id: 'defesa', nome: 'Defesa', formula: '10 + AGI' }],
    pericias: { modo: 'treino', total: 'MOD + TREINO', treinos: [{ id: 'nenhum', nome: 'Destreinado', formula: '0' }, { id: 'treinado', nome: 'Treinado', formula: '2' }, { id: 'mestre', nome: 'Mestre', formula: '4' }],
      lista: [{ id: 'luta', nome: 'Luta', atributo: 'FOR' }, { id: 'furtividade', nome: 'Furtividade', atributo: 'AGI' }, { id: 'conhecimento', nome: 'Conhecimento', atributo: 'MEN' }] },
    recursos: [{ id: 'vida', nome: 'Vida', formula: 'vida_max' }],
    listas: [{ id: 'habilidades', nome: 'Habilidades' }, { id: 'anotacoes', nome: 'Anotações e história' }],
  }
}
