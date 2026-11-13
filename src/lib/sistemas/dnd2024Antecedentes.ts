/**
 * D&D 2024 — distribuição guiada de aumentos de atributos de antecedente.
 * Fonte: SRD 5.2.1, Character Origins, CC BY 4.0.
 * Antecedente Forasteiro é LEGADO 2014: consulte o PHB 2014 e a compatibilidade
 * oficial de Creating a Character 2024. Não reproduz texto do livro comercial.
 *
 * Os atributos da ficha são valores FINAIS. A aplicação é explícita, não acontece
 * só ao escolher o antecedente. O registro preserva o último bônus aplicado e
 * permite recalcular por DELTA, sem somar os mesmos três pontos duas vezes.
 */
import type { DadosFicha } from './tipos'
import { classesDaFicha, idDe } from './dnd2024Classes'
import { FONTE_LEGADO_2014, FONTE_PHB, TALENTOS_ORIGEM_PHB, fontePermitida } from './dnd2024Fontes'
import { ANTECEDENTES_PHB_GUIA } from './dnd2024AntecedentesPhb'
import { MAGIAS_SRD } from './dnd2024Magias'

export const ATRIBUTOS_DND = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'] as const
/** Identificadores das dezoito perícias, compartilhados com os seletores de talentos. */
export const PERICIAS_DND_ORIGENS = [
  'acrobacia', 'adestrar_animais', 'arcanismo', 'atletismo', 'atuacao', 'enganacao',
  'furtividade', 'historia', 'intimidacao', 'intuicao', 'investigacao', 'medicina',
  'natureza', 'percepcao', 'persuasao', 'prestidigitacao', 'religiao', 'sobrevivencia',
] as const

export type AtributoDnd = typeof ATRIBUTOS_DND[number]
export type AumentosDnd = Partial<Record<AtributoDnd, number>>
export type RegistroAntecedenteDnd = {
  id: string
  aumentos: AumentosDnd
  /** Pacote do antecedente ou alternativa em moedas (apenas origens de 2024). */
  equipamento?: 'pacote' | 'moedas'
  /** Forasteiro 2014: talento de origem livre por compatibilidade 2024. */
  talento?: string
  instrumento?: string
  idioma?: string
  /** Tipo escolhido quando a ferramenta do PHB requer especialização. */
  ferramentaEscolhida?: string
  /** Escolhas adicionais de perícias do talento Habilidoso (as ferramentas continuam anotáveis). */
  talentoPericias?: string[]
  /** Escolhas do talento Artesão ou Músico, até três ferramentas/instrumentos. */
  talentoFerramentas?: string[]
  /** Iniciado em Magia: lista, atributo e três magias escolhidas. */
  talentoLista?: 'clerigo' | 'druida' | 'mago'
  talentoAtributo?: 'INT' | 'SAB' | 'CAR'
  talentoMagias?: string[]
}
export type ModeloAntecedenteDnd = {
  id: string; nome: string; elegiveis: readonly AtributoDnd[]; talento: string
  pericias: readonly string[]; ferramenta: string
  fonte: 'srd521' | 'phb2024' | 'phb2014'
  /** Nome/identificador mecânico do talento de origem; texto integral continua na fonte. */
  talentoId?: string
  /** Se o tipo de ferramenta deve ser escolhido pelo jogador. */
  ferramentaEscolha?: 'artesao' | 'instrumento' | 'jogo'
  /** Pacote inicial factual (lista exibida, mas não adicionada automaticamente ao inventário). */
  pacote?: readonly string[]
  moedasPacote?: number
  nota: string
}

export const ANTECEDENTES_GUIADOS: Record<string, ModeloAntecedenteDnd> = {
  acolito: {
    id: 'acolito', nome: 'Acólito', elegiveis: ['INT', 'SAB', 'CAR'],
    talento: 'Iniciado em Magia (Clérigo)', talentoId: 'iniciado-magia-clerigo', pericias: ['intuicao', 'religiao'],
    ferramenta: 'Suprimentos de caligrafia', fonte: 'srd521',
    pacote: ['Suprimentos de caligrafia', 'Livro de orações', 'Símbolo sagrado', '10 folhas de pergaminho', 'Robe'], moedasPacote: 8,
    nota: 'Confira o talento, as perícias, a ferramenta e o equipamento do antecedente no SRD.',
  },
  criminoso: {
    id: 'criminoso', nome: 'Criminoso', elegiveis: ['DES', 'CON', 'INT'],
    talento: 'Alerta', talentoId: 'alerta', pericias: ['prestidigitacao', 'furtividade'],
    ferramenta: 'Ferramentas de ladrão', fonte: 'srd521',
    pacote: ['2 adagas', 'Ferramentas de ladrão', 'Pé de cabra', '2 bolsas', 'Roupas de viajante'], moedasPacote: 16,
    nota: 'O bônus de Iniciativa por Alerta vem da progressão, sem somar duas vezes.',
  },
  sabio: {
    id: 'sabio', nome: 'Sábio', elegiveis: ['CON', 'INT', 'SAB'],
    talento: 'Iniciado em Magia (Mago)', talentoId: 'iniciado-magia-mago', pericias: ['arcanismo', 'historia'],
    ferramenta: 'Suprimentos de caligrafia', fonte: 'srd521',
    pacote: ['Bordão', 'Suprimentos de caligrafia', 'Livro de história', '8 folhas de pergaminho', 'Robe'], moedasPacote: 8,
    nota: 'As escolhas de magias do talento ainda exigem conferência com o mestre.',
  },
  soldado: {
    id: 'soldado', nome: 'Soldado', elegiveis: ['FOR', 'DES', 'CON'],
    talento: 'Atacante Selvagem', talentoId: 'atacante-selvagem', pericias: ['atletismo', 'intimidacao'],
    ferramenta: 'Kit de jogos à escolha', ferramentaEscolha: 'jogo', fonte: 'srd521',
    pacote: ['Lança', 'Arco curto', '20 flechas', 'Kit de jogos escolhido', 'Kit de curandeiro', 'Aljava', 'Roupas de viajante'], moedasPacote: 14,
    nota: 'O kit de jogos precisa ser escolhido e registrado; efeitos do talento ainda exigem consulta.',
  },
  forasteiro: {
    id: 'forasteiro', nome: 'Forasteiro (2014)', elegiveis: ATRIBUTOS_DND,
    talento: 'Talento de origem à escolha (compatibilidade 2024)',
    pericias: ['atletismo', 'sobrevivencia'],
    ferramenta: 'Um instrumento musical à escolha', fonte: 'phb2014',
    nota: 'O antecedente de 2014 também concede um idioma à escolha e a característica Viajante (Wanderer). Consulte o PHB 2014. Pela compatibilidade 2024, distribua +2/+1 ou +1 em três atributos e escolha um talento de origem.',
  },
  ...ANTECEDENTES_PHB_GUIA,
}
export const TALENTOS_ORIGEM_LEGADO: { id: string; nome: string; fonte: 'srd521' | 'phb2024' }[] = [
  { id: 'alerta', nome: 'Alerta', fonte: 'srd521' },
  { id: 'iniciado-magia', nome: 'Iniciado em Magia', fonte: 'srd521' },
  { id: 'atacante-selvagem', nome: 'Atacante Selvagem', fonte: 'srd521' },
  { id: 'habilidoso', nome: 'Habilidoso', fonte: 'srd521' },
  ...TALENTOS_ORIGEM_PHB.map(([id, nome]) => ({ id, nome, fonte: 'phb2024' as const })),
]
const chaves = new Set<string>(ATRIBUTOS_DND)
const stringCurta = (x: unknown) => typeof x === 'string' ? x.trim().slice(0, 70) : ''

export function lerRegistroAntecedenteDnd(valor: unknown): RegistroAntecedenteDnd | null {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return null
  const v = valor as Record<string, unknown>
  if (typeof v.id !== 'string' || !ANTECEDENTES_GUIADOS[v.id]) return null
  if (!v.aumentos || typeof v.aumentos !== 'object' || Array.isArray(v.aumentos)) return null
  const aumentos: AumentosDnd = {}
  for (const [k, n] of Object.entries(v.aumentos)) {
    if (!chaves.has(k) || !Number.isInteger(n) || Number(n) < 1 || Number(n) > 2) return null
    aumentos[k as AtributoDnd] = Number(n)
  }
  return {
    id: v.id, aumentos,
    ...(v.equipamento === 'pacote' || v.equipamento === 'moedas' ? { equipamento: v.equipamento } : {}),
    ...(stringCurta(v.talento) ? { talento: stringCurta(v.talento) } : {}),
    ...(stringCurta(v.instrumento) ? { instrumento: stringCurta(v.instrumento) } : {}),
    ...(stringCurta(v.idioma) ? { idioma: stringCurta(v.idioma) } : {}),
    ...(stringCurta(v.ferramentaEscolhida) ? { ferramentaEscolhida: stringCurta(v.ferramentaEscolhida) } : {}),
    ...(Array.isArray(v.talentoPericias) && v.talentoPericias.length <= 3
      ? { talentoPericias: v.talentoPericias.filter((x): x is string => typeof x === 'string' && /^[a-z_]{2,70}$/.test(x)) }
      : {}),
    ...(Array.isArray(v.talentoFerramentas) && v.talentoFerramentas.length <= 3
      ? { talentoFerramentas: v.talentoFerramentas.filter((x): x is string => typeof x === 'string' && x.trim().length > 0 && x.trim().length <= 70).map(x => x.trim()) }
      : {}),
    ...(['clerigo', 'druida', 'mago'].includes(String(v.talentoLista)) ? { talentoLista: v.talentoLista as 'clerigo' | 'druida' | 'mago' } : {}),
    ...(['INT', 'SAB', 'CAR'].includes(String(v.talentoAtributo)) ? { talentoAtributo: v.talentoAtributo as 'INT' | 'SAB' | 'CAR' } : {}),
    ...(Array.isArray(v.talentoMagias) && v.talentoMagias.length <= 3
      ? { talentoMagias: v.talentoMagias.filter((x): x is string => typeof x === 'string' && /^[a-z0-9-]{2,70}$/.test(x)) } : {}),
  }
}

export function validarDistribuicaoAntecedenteDnd(id: string, aumentos: AumentosDnd): string[] {
  const def = ANTECEDENTES_GUIADOS[id]
  if (!def) return ['Este antecedente ainda não possui distribuição guiada: consulte o livro com o mestre.']
  const entradas = Object.entries(aumentos).filter(([, n]) => n !== 0)
  if (entradas.some(([a, n]) => !def.elegiveis.includes(a as AtributoDnd) || (n !== 1 && n !== 2)))
    return ['Atributos ou valores não permitidos para este antecedente.']
  const vals = entradas.map(([, n]) => n).sort((a, b) => a! - b!)
  if (vals.join(',') !== '1,2' && vals.join(',') !== '1,1,1')
    return ['Distribua +2 e +1 em atributos diferentes, ou +1 em três atributos diferentes.']
  return []
}

/** Ações explícitas: calcula o DELTA do registro anterior e aplica uma única vez. */
export function aplicarAntecedenteDnd(
  d: DadosFicha, aumentos: AumentosDnd, detalhes: Partial<Pick<RegistroAntecedenteDnd, 'equipamento' | 'talento' | 'instrumento' | 'idioma' | 'ferramentaEscolhida' | 'talentoPericias' | 'talentoFerramentas' | 'talentoLista' | 'talentoAtributo' | 'talentoMagias'>> = {},
): { ok: true; dados: DadosFicha } | { ok: false; erro: string } {
  const id = idDe(d.campos.antecedente)
  const erros = validarDistribuicaoAntecedenteDnd(id, aumentos)
  if (erros.length) return { ok: false, erro: erros[0] }
  const antes = lerRegistroAntecedenteDnd(d.dndAntecedente)
  const atributos = { ...d.atributos }
  for (const a of ATRIBUTOS_DND) {
    const atual = Number(atributos[a])
    const novo = atual - (antes?.aumentos[a] ?? 0) + (aumentos[a] ?? 0)
    if (!Number.isInteger(atual) || novo < 1 || novo > 20)
      return { ok: false, erro: a + ': resultado fora de 1–20. Confira se os bônus já foram aplicados à mão.' }
    atributos[a] = novo
  }
  const dados: DadosFicha = { ...d, atributos, dndAntecedente: { id, aumentos: { ...aumentos }, ...detalhes } }
  // Nova ficha: disponibiliza a primeira conjuração sem espaço na criação inicial.
  // Em trocas posteriores de antecedente, não restaura usos gastos; só descanso longo o fará.
  if (!antes && magiasDeAntecedenteDnd(dados)) {
    dados.recursos = { ...d.recursos, magia_origem_gratis: { atual: 1 } }
  }
  if (!antes && (ANTECEDENTES_GUIADOS[id]?.talentoId === 'lucky' || (id === 'forasteiro' && detalhes.talento === 'lucky'))) {
    const prof = Math.floor((Math.max(1, classesDaFicha(dados).total) - 1) / 4) + 2
    dados.recursos = { ...dados.recursos, pontos_sorte: { atual: prof } }
  }
  return { ok: true, dados }
}

/**
 * Servidor: protege o registro, as fontes e a aplicação dos aumentos.
 * A escolha inalterada é preservada para não quebrar fichas antigas.
 */
/** Valida as decisões específicas dos talentos e ferramentas, sem prometer os efeitos ainda não automatizados. */
export function validarDetalhesAntecedenteDnd(r: RegistroAntecedenteDnd): string[] {
  const def = ANTECEDENTES_GUIADOS[r.id]
  if (!def) return ['Antecedente não cadastrado.']
  const erros: string[] = []
  if (r.id !== 'forasteiro' && !r.equipamento) erros.push('Selecione o pacote de equipamentos ou 50 PO.')
  if (def.ferramentaEscolha && !r.ferramentaEscolhida?.trim()) erros.push('Escolha um tipo de ferramenta para este antecedente.')
  const talento = r.id === 'forasteiro' ? r.talento : def.talentoId
  if (talento === 'habilidoso') {
    const escolhas = r.talentoPericias ?? []
    if (escolhas.length !== 3 || new Set(escolhas).size !== 3 ||
      escolhas.some(id => !PERICIAS_DND_ORIGENS.includes(id as typeof PERICIAS_DND_ORIGENS[number]) && !/^ferramenta_[a-z_]{2,58}$/.test(id)))
      erros.push('Habilidoso exige três perícias ou ferramentas diferentes.')
  }
  if (talento === 'crafter' || talento === 'musician') {
    const ferramentas = r.talentoFerramentas ?? []
    if (ferramentas.length !== 3 || new Set(ferramentas.map(x => x.toLowerCase())).size !== 3 ||
      ferramentas.some(x => !x.trim() || x.length > 70))
      erros.push(talento === 'crafter' ? 'Artesão: escolha três tipos diferentes de ferramentas de artesão.' : 'Músico: escolha três instrumentos musicais diferentes.')
  }
  if (talento?.startsWith('iniciado-magia')) {
    const lista = talento === 'iniciado-magia-clerigo' ? 'clerigo'
      : talento === 'iniciado-magia-druida' ? 'druida'
      : talento === 'iniciado-magia-mago' ? 'mago' : r.talentoLista
    if (!lista) erros.push('Iniciado em Magia: escolha uma lista de magias.')
    if (!r.talentoAtributo) erros.push('Iniciado em Magia: escolha INT, SAB ou CAR como atributo de conjuração.')
    const magias = r.talentoMagias ?? []
    if (magias.length !== 3 || new Set(magias).size !== 3 ||
      magias.some((id, i) => !MAGIAS_SRD.some(m => m.id === id && m.classes.includes(lista ?? '') && m.nivel === (i === 2 ? 1 : 0))))
      erros.push('Iniciado em Magia: escolha dois truques diferentes e uma magia de nível 1 da lista correta.')
  }
  return erros
}

/** Magias de Iniciado em Magia já confirmadas na criação, sem alterar a lista da classe. */
export type MagiasDeAntecedenteDnd = {
  antecedente: string
  lista: 'clerigo' | 'druida' | 'mago'
  atributo: 'INT' | 'SAB' | 'CAR'
  ids: [string, string, string]
}
export function magiasDeAntecedenteDnd(d: Pick<DadosFicha, 'campos' | 'dndAntecedente'>): MagiasDeAntecedenteDnd | null {
  const registro = lerRegistroAntecedenteDnd(d.dndAntecedente)
  if (!registro || registro.id !== idDe(d.campos.antecedente)) return null
  const def = ANTECEDENTES_GUIADOS[registro.id]
  const talento = registro.id === 'forasteiro' ? registro.talento : def?.talentoId
  if (!talento?.startsWith('iniciado-magia') || validarDetalhesAntecedenteDnd(registro).length) return null
  const lista = talento === 'iniciado-magia-clerigo' ? 'clerigo'
    : talento === 'iniciado-magia-druida' ? 'druida'
    : talento === 'iniciado-magia-mago' ? 'mago' : registro.talentoLista
  if (!lista || !registro.talentoAtributo || registro.talentoMagias?.length !== 3) return null
  return {
    antecedente: def.nome, lista, atributo: registro.talentoAtributo,
    ids: registro.talentoMagias as [string, string, string],
  }
}

export function validarAlteracoesAntecedenteDnd(
  antes: Pick<DadosFicha, 'campos' | 'atributos' | 'dndAntecedente'>,
  depois: Pick<DadosFicha, 'campos' | 'atributos' | 'dndAntecedente'>,
  fontes: Set<string> | null = null,
): string[] {
  if (JSON.stringify(antes.dndAntecedente ?? null) === JSON.stringify(depois.dndAntecedente ?? null)) return []
  const atual = lerRegistroAntecedenteDnd(depois.dndAntecedente)
  if (!atual) return ['Registro dos aumentos do antecedente inválido ou ausente.']
  const erros = validarDistribuicaoAntecedenteDnd(atual.id, atual.aumentos)
  if (atual.id !== idDe(depois.campos.antecedente)) erros.push('A distribuição deve corresponder ao antecedente selecionado.')
  if (atual.id === 'forasteiro') {
    if (!fontePermitida(FONTE_LEGADO_2014, fontes)) erros.push('Forasteiro exige autorização da fonte Livro do Jogador (2014).')
    const talento = TALENTOS_ORIGEM_LEGADO.find(f => f.id === atual.talento)
    if (!talento) erros.push('Escolha um talento de origem permitido para o Forasteiro.')
    else if (talento.fonte === 'phb2024' && !fontePermitida(FONTE_PHB, fontes)) erros.push('Talento de origem do PHB 2024 não liberado nesta campanha.')
    if (!atual.instrumento || !atual.idioma) erros.push('Informe o instrumento musical e o idioma do Forasteiro.')
    if (atual.equipamento === 'moedas') erros.push('O Forasteiro legado usa equipamento conforme o livro de 2014, não a opção automática de 50 PO do SRD 2024.')
  }
  const def = ANTECEDENTES_GUIADOS[atual.id]
  if (def?.fonte === 'phb2024' && !fontePermitida(FONTE_PHB, fontes)) {
    erros.push('Este antecedente é do Livro do Jogador 2024 e a fonte não foi liberada pelo mestre.')
  }
  erros.push(...validarDetalhesAntecedenteDnd(atual))
  if (atual.talento && atual.id !== 'forasteiro') erros.push('Talento diferente do determinado pelo antecedente.')
  const anterior = lerRegistroAntecedenteDnd(antes.dndAntecedente)
  for (const a of ATRIBUTOS_DND) {
    const esperado = Number(antes.atributos[a] ?? 10) - (anterior?.aumentos[a] ?? 0) + (atual.aumentos[a] ?? 0)
    const recebido = Number(depois.atributos[a] ?? 10)
    if (recebido !== esperado) erros.push(a + ': valor da ficha não corresponde à distribuição registrada.')
    if (recebido < 1 || recebido > 20) erros.push(a + ': excede o limite de atributo inicial de 20.')
  }
  return erros
}
