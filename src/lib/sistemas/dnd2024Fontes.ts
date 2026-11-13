/**
 * D&D 2024 — fontes e suplementos (v0.33.6).
 *
 * Regra da plataforma: livros COMERCIAIS entram só como metadados — nome do livro e nomes das opções
 * (subclasses, espécie, antecedentes), para a ficha registrar a escolha e o mestre liberar a fonte.
 * Nenhum texto de regra desses livros fica aqui: cada característica aponta para o livro.
 * Os nomes em português são tradução da plataforma.
 */
import type { MarcoDnd } from './dnd2024Progressao'
import type { DadosFicha } from './tipos'
import { idDe } from './dnd2024Classes'

export type FonteDnd = {
  id: string; nome: string; original: string; ano: number
  tipo: 'aberta' | 'comercial'
  /** O que o livro traz (só para o mestre saber; o conteúdo fica no livro). */
  traz: string
  /** A plataforma registra opções dele (nomes) nas escolhas da ficha. */
  opcoesNaFicha: boolean
}

export const FONTE_SRD = 'srd521'
export const FONTE_PHB = 'phb2024'
/** Livro legado de 2014: habilitar explicitamente na campanha. */
export const FONTE_LEGADO_2014 = 'phb2014'

export const FONTES_DND: FonteDnd[] = [
  { id: FONTE_SRD, nome: 'SRD 5.2.1 (aberto)', original: 'System Reference Document 5.2.1', ano: 2025, tipo: 'aberta', opcoesNaFicha: true,
    traz: '12 classes com 1 subclasse cada, 9 espécies, 4 antecedentes, talentos e 339 magias. Já vem com texto e regras na plataforma (CC BY 4.0).' },
  { id: FONTE_LEGADO_2014, nome: 'Livro do Jogador (2014) — legado', original: "Player's Handbook (2014)", ano: 2014, tipo: 'comercial', opcoesNaFicha: true,
    traz: 'Opções legadas compatíveis mediante aprovação do mestre. Inclui o antecedente Forasteiro (Outlander); regras completas no livro de 2014.' },
  { id: FONTE_PHB, nome: 'Livro do Jogador (2024)', original: "Player's Handbook (2024)", ano: 2024, tipo: 'comercial', opcoesNaFicha: true,
    traz: 'As outras 36 subclasses, o Aasimar, mais 12 antecedentes, talentos e magias. A ficha registra os nomes; as regras ficam no livro.' },
  { id: 'dmg2024', nome: 'Guia do Mestre (2024)', original: "Dungeon Master's Guide (2024)", ano: 2024, tipo: 'comercial', opcoesNaFicha: false,
    traz: 'Ferramentas do mestre, tesouros e itens mágicos, criação de mundo. Só marca que a mesa usa o livro.' },
  { id: 'mm2025', nome: 'Manual dos Monstros (2025)', original: 'Monster Manual (2025)', ano: 2025, tipo: 'comercial', opcoesNaFicha: false,
    traz: 'Fichas de criaturas. Só marca que a mesa usa o livro (o encontro aceita qualquer criatura pelo Nível de Desafio).' },
]
export const nomeDaFonte = (id: string) => FONTES_DND.find(f => f.id === id)?.nome ?? id

/** Fontes liberadas numa campanha (o SRD sempre). `null` = ficha avulsa: tudo liberado. */
export function fontesLiberadas(ids: string[] | undefined | null): Set<string> {
  return new Set([FONTE_SRD, ...(ids ?? []).filter(id => FONTES_DND.some(f => f.id === id))])
}
export const fontePermitida = (fonte: string | undefined, liberadas: Set<string> | null) => !fonte || fonte === FONTE_SRD || !liberadas || liberadas.has(fonte)

const LIVRO = 'Livro do Jogador (2024)'
const NOTA = 'Fonte comercial: consulte o Livro do Jogador (2024). A plataforma guarda só o nome da escolha, sem o texto da regra.'

/** Subclasses do Livro do Jogador que não estão no SRD (id da classe → [id, nome]). */
export const SUBCLASSES_PHB: Record<string, [string, string][]> = {
  barbaro: [['coracao-selvagem', 'Caminho do Coração Selvagem'], ['arvore-do-mundo', 'Caminho da Árvore do Mundo'], ['fanatico', 'Caminho do Fanático']],
  bardo: [['colegio-danca', 'Colégio da Dança'], ['colegio-glamour', 'Colégio do Glamour'], ['colegio-bravura', 'Colégio da Bravura']],
  clerigo: [['dominio-guerra', 'Domínio da Guerra'], ['dominio-luz', 'Domínio da Luz'], ['dominio-enganacao', 'Domínio da Enganação']],
  druida: [['circulo-lua', 'Círculo da Lua'], ['circulo-mar', 'Círculo do Mar'], ['circulo-estrelas', 'Círculo das Estrelas']],
  guerreiro: [['mestre-batalha', 'Mestre de Batalha'], ['cavaleiro-arcano', 'Cavaleiro Arcano'], ['guerreiro-psiquico', 'Guerreiro Psíquico']],
  monge: [['guerreiro-misericordia', 'Guerreiro da Misericórdia'], ['guerreiro-sombra', 'Guerreiro da Sombra'], ['guerreiro-elementos', 'Guerreiro dos Elementos']],
  paladino: [['juramento-gloria', 'Juramento de Glória'], ['juramento-ancioes', 'Juramento dos Anciões'], ['juramento-vinganca', 'Juramento de Vingança']],
  patrulheiro: [['mestre-feras', 'Mestre das Feras'], ['andarilho-feerico', 'Andarilho Feérico'], ['espreitador-sombrio', 'Espreitador Sombrio']],
  ladino: [['trapaceiro-arcano', 'Trapaceiro Arcano'], ['assassino', 'Assassino'], ['lamina-da-alma', 'Lâmina da Alma']],
  feiticeiro: [['feiticaria-aberrante', 'Feitiçaria Aberrante'], ['feiticaria-mecanica', 'Feitiçaria Mecânica'], ['magia-selvagem', 'Feitiçaria da Magia Selvagem']],
  bruxo: [['patrono-arquifada', 'Patrono Arquifada'], ['patrono-celestial', 'Patrono Celestial'], ['patrono-grande-antigo', 'Patrono Grande Antigo']],
  mago: [['abjurador', 'Abjurador'], ['adivinhador', 'Adivinhador'], ['ilusionista', 'Ilusionista']],
}

/** Espécie e antecedentes do Livro do Jogador fora do SRD (aparecem nos seletores da ficha). */
export const ESPECIES_PHB: [string, string][] = [['aasimar', 'Aasimar']]
/** Antecedentes legados que NÃO fazem parte dos 16 backgrounds do PHB 2024. */
export const ANTECEDENTES_LEGADOS_2014: [string, string][] = [['forasteiro', 'Forasteiro']]
export const ANTECEDENTES_PHB: [string, string][] = [
  ['artesao', 'Artesão'], ['charlatao', 'Charlatão'], ['animador', 'Animador'], ['fazendeiro', 'Fazendeiro'], ['guarda', 'Guarda'], ['guia', 'Guia'],
  ['eremita', 'Eremita'], ['mercador', 'Mercador'], ['nobre', 'Nobre'], ['marinheiro', 'Marinheiro'], ['escriba', 'Escriba'], ['viajante', 'Viajante'],
]

/** Mais seis talentos de origem do PHB 2024 que não constam no catálogo aberto SRD 5.2.1.
 * Somente metadados e fonte: seus efeitos devem ser conferidos no livro comercial.
 */
export const TALENTOS_ORIGEM_PHB: [string, string][] = [
  ['crafter', 'Artesão (Crafter)'],
  ['healer', 'Curandeiro (Healer)'],
  ['lucky', 'Sortudo (Lucky)'],
  ['musician', 'Músico (Musician)'],
  ['tavern-brawler', 'Brigão de Taverna (Tavern Brawler)'],
  ['tough', 'Robusto (Tough)'],
]

/**
 * Junta as opções do Livro do Jogador aos marcos do SRD: a escolha de subclasse ganha as 3 subclasses do livro
 * (com `fonte`), e cada uma ganha marcos “consulte o livro” nos mesmos níveis em que a subclasse do SRD ganha características.
 */
export function marcosComFontes(base: MarcoDnd[]): MarcoDnd[] {
  const out = base.map(m => {
    const extra = m.id.endsWith('-subclasse') && SUBCLASSES_PHB[m.origemId]
    if (extra) return { ...m, opcoes: [...(m.opcoes ?? []), ...extra.map(([id, nome]) => ({ id, nome: `${nome} (${LIVRO})`, fonte: FONTE_PHB }))] }
    if (m.id === 'esp-humano-versatil') return { ...m, opcoes: [
      ...(m.opcoes ?? []),
      ...TALENTOS_ORIGEM_PHB.map(([id, nome]) => ({ id, nome: `${nome} (${LIVRO})`, fonte: FONTE_PHB })),
    ] }
    return m
  })
  for (const [classe, subs] of Object.entries(SUBCLASSES_PHB)) {
    const escolha = base.find(m => m.id === `${classe}-subclasse`)
    if (!escolha) continue
    const niveis = [escolha.nivel, ...base.filter(m => new RegExp(`^${classe}-subclasse-n\\d+$`).test(m.id)).map(m => m.nivel)]
    for (const [id, nome] of subs) for (const n of [...new Set(niveis)].sort((a, b) => a - b)) out.push({
      id: `${classe}-${id}-n${n}-livro`, nome: `${nome}: característica do nível ${n}`, nivel: n, origem: 'subclasse', origemId: classe, modo: 'automatico',
      descricao: NOTA, fonte: LIVRO, requer: { marco: `${classe}-subclasse`, opcao: id },
    })
  }
  for (const [id, nome] of ESPECIES_PHB) out.push({ id: `esp-${id}-livro`, nome: `Traços do ${nome}`, nivel: 1, origem: 'especie', origemId: id, modo: 'automatico', descricao: NOTA, fonte: LIVRO })
  for (const [id, nome] of ANTECEDENTES_LEGADOS_2014) out.push({
    id: `ant-${id}-legado`, nome: `Antecedente legado: ${nome} (2014)`, nivel: 1,
    origem: 'antecedente', origemId: id, modo: 'automatico',
    descricao: 'Legado do Livro do Jogador (2014): duas perícias, instrumento, idioma e benefício de exploração. Pela compatibilidade 2024, escolha os atributos e um talento de origem elegível; consulte o livro original.',
    fonte: "Livro do Jogador (2014)",
  })
  for (const [id, nome] of ANTECEDENTES_PHB) out.push({ id: `ant-${id}-livro`, nome: `Antecedente ${nome}: atributos, talento, perícias e ferramenta`, nivel: 1, origem: 'antecedente', origemId: id, modo: 'automatico', descricao: NOTA, fonte: LIVRO })
  return out
}

/** Espécie ou antecedente de fonte comercial não liberada (só confere o que mudou). */
export function validarFontesCamposDnd(antes: Pick<DadosFicha, 'campos'>, depois: Pick<DadosFicha, 'campos'>, liberadas: Set<string> | null): string[] {
  const erros: string[] = []
  const conferir = (campo: 'especie' | 'antecedente', lista: [string, string][]) => {
    const id = idDe(depois.campos[campo])
    if (!id || id === idDe(antes.campos[campo])) return
    const item = lista.find(([x]) => x === id)
    if (item && !fontePermitida(FONTE_PHB, liberadas)) erros.push(`${item[1]} é do ${nomeDaFonte(FONTE_PHB)}, que o mestre não liberou nesta campanha.`)
  }
  conferir('especie', ESPECIES_PHB); conferir('antecedente', ANTECEDENTES_PHB)
  const antigo = idDe(antes.campos.antecedente), novo = idDe(depois.campos.antecedente)
  if (antigo !== novo && ANTECEDENTES_LEGADOS_2014.some(([id]) => id === novo) && !fontePermitida(FONTE_LEGADO_2014, liberadas)) {
    erros.push('Forasteiro (2014) exige que o mestre libere a fonte Livro do Jogador (2014) — legado.')
  }
  return erros
}
