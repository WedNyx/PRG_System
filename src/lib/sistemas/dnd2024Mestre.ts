/**
 * D&D 2024 — ferramentas do mestre (v0.33.6). Tabelas do SRD 5.2.1 (Wizards of the Coast, CC BY 4.0):
 * XP por Nível de Desafio, orçamento de XP por personagem, CDs típicas, avanço de nível, condições e ações.
 * Os resumos em português são texto próprio da plataforma.
 */
import type { DadosFicha } from './tipos'
import type { Calculo } from './calculo'
import { classesDaFicha, requisitosMulticlasse } from './dnd2024Classes'
import { conjuradoresDnd, contarMagias, lerMagiasDnd } from './dnd2024Conjuracao'
import { progressaoVisivel } from './dnd2024Progressao'
import { MARCOS_DND_2024 } from './dnd2024Marcos'
import { progressoDaFichaDnd } from './dnd2024Ficha'

/** XP por Nível de Desafio (ND). ND 0 vale 0 ou 10; aqui 10 (criaturas com algum ataque). */
export const XP_POR_ND: [string, number][] = [
  ['0', 10], ['1/8', 25], ['1/4', 50], ['1/2', 100], ['1', 200], ['2', 450], ['3', 700], ['4', 1100], ['5', 1800], ['6', 2300], ['7', 2900],
  ['8', 3900], ['9', 5000], ['10', 5900], ['11', 7200], ['12', 8400], ['13', 10000], ['14', 11500], ['15', 13000], ['16', 15000], ['17', 18000],
  ['18', 20000], ['19', 22000], ['20', 25000], ['21', 33000], ['22', 41000], ['23', 50000], ['24', 62000], ['25', 75000], ['26', 90000],
  ['27', 105000], ['28', 120000], ['29', 135000], ['30', 155000],
]
export const xpDoNd = (nd: string) => XP_POR_ND.find(([n]) => n === nd)?.[1] ?? 0
/** Valor numérico do ND (1/4 → 0,25). */
export const valorNd = (nd: string) => nd.includes('/') ? Number(nd.split('/')[0]) / Number(nd.split('/')[1]) : Number(nd) || 0
/** Bônus de proficiência de uma criatura pelo ND. */
export const proficienciaDoNd = (nd: string) => { const v = valorNd(nd); return v < 5 ? 2 : Math.min(9, Math.floor((Math.ceil(v) - 1) / 4) + 2) }

export type Dificuldade = 'baixa' | 'moderada' | 'alta'
export const NOME_DIFICULDADE: Record<Dificuldade, string> = { baixa: 'Baixa', moderada: 'Moderada', alta: 'Alta' }
/** Orçamento de XP por personagem, por nível (1–20): [baixa, moderada, alta]. */
export const ORCAMENTO: [number, number, number][] = [
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
  [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
]
const nivelOk = (n: number) => Math.max(1, Math.min(20, Math.round(n) || 1))

export type Criatura = { nome?: string; nd: string; qtd: number }
export type Encontro = {
  orcamento: Record<Dificuldade, number>
  gasto: number
  /** Em que faixa o encontro cai ('trivial' = abaixo da Baixa; 'acima' = passou da Alta). */
  faixa: 'trivial' | Dificuldade | 'acima'
  sobra: number
  criaturas: number
  xpPorPersonagem: number
  avisos: string[]
}

/** Monta o encontro: orçamento somado pelo nível de cada personagem e os avisos do “Troubleshooting” do SRD. */
export function montarEncontro(niveis: number[], criaturas: Criatura[], alvo: Dificuldade = 'moderada'): Encontro {
  const grupo = niveis.length ? niveis.map(nivelOk) : [1]
  const orcamento = { baixa: 0, moderada: 0, alta: 0 }
  for (const n of grupo) { const [b, m, a] = ORCAMENTO[n - 1]; orcamento.baixa += b; orcamento.moderada += m; orcamento.alta += a }
  const validas = criaturas.filter(c => c.qtd > 0 && XP_POR_ND.some(([n]) => n === c.nd))
  const gasto = validas.reduce((t, c) => t + xpDoNd(c.nd) * c.qtd, 0)
  const total = validas.reduce((t, c) => t + c.qtd, 0)
  const faixa: Encontro['faixa'] = !gasto ? 'trivial' : gasto > orcamento.alta ? 'acima' : gasto > orcamento.moderada ? 'alta' : gasto > orcamento.baixa ? 'moderada' : gasto >= orcamento.baixa * 0.5 ? 'baixa' : 'trivial'
  const media = grupo.reduce((a, b) => a + b, 0) / grupo.length
  const avisos: string[] = []
  if (total > grupo.length * 2) avisos.push(`Mais de 2 criaturas por personagem: uma sequência de sorte delas pode causar mais dano que o esperado. Use criaturas frágeis${media <= 2 ? ' (ainda mais importante nos níveis 1 e 2)' : ''}.`)
  const fortes = validas.filter(c => valorNd(c.nd) > media)
  if (fortes.length) avisos.push(`ND acima do nível do grupo (${fortes.map(c => (c.nome || 'criatura') + ' ND ' + c.nd).join(', ')}): uma única ação pode derrubar um ou mais personagens.`)
  if (validas.some(c => c.nd === '0') && validas.filter(c => c.nd === '0').reduce((t, c) => t + c.qtd, 0) > 4) avisos.push('Muitas criaturas de ND 0: prefira um enxame.')
  const blocos = new Set(validas.map(c => (c.nome || '').trim().toLowerCase() || c.nd)).size
  if (blocos > 3) avisos.push(`${blocos} fichas de criatura diferentes: mais de 2 ou 3 num encontro fica difícil de conduzir.`)
  if (gasto > orcamento[alvo] && faixa !== 'trivial') avisos.push(`Passou ${gasto - orcamento[alvo]} XP do orçamento ${NOME_DIFICULDADE[alvo].toLowerCase()}.`)
  return { orcamento, gasto, faixa, sobra: orcamento[alvo] - gasto, criaturas: total, xpPorPersonagem: Math.floor(gasto / grupo.length), avisos }
}

/** XP para chegar a cada nível (índice 0 = nível 1). */
export const XP_DO_NIVEL = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]
export function nivelPeloXp(xp: number) { let n = 1; for (let i = 0; i < 20; i++) if (xp >= XP_DO_NIVEL[i]) n = i + 1; return n }
export const proficienciaDoNivel = (n: number) => Math.floor((nivelOk(n) - 1) / 4) + 2
/** Patamares de jogo (Tiers of Play). */
export const PATAMAR = (n: number) => n <= 4 ? 'Patamar 1 (níveis 1–4): aprendizes, ameaças locais' : n <= 10 ? 'Patamar 2 (5–10): heróis de uma região' : n <= 16 ? 'Patamar 3 (11–16): mestres do ofício, ameaças a nações' : 'Patamar 4 (17–20): lendas que mudam o mundo'

export const CDS_TIPICAS: [string, number][] = [['Muito fácil', 5], ['Fácil', 10], ['Média', 15], ['Difícil', 20], ['Muito difícil', 25], ['Quase impossível', 30]]

/** Condições do D&D 2024 (resumo próprio do Glossário de Regras do SRD 5.2.1). */
export const CONDICOES_DND: { id: string; nome: string; efeitos: string[] }[] = [
  { id: 'agarrado', nome: 'Agarrado', efeitos: ['Deslocamento 0, não aumenta.', 'Desvantagem nos ataques contra qualquer alvo que não seja quem agarra.', 'Quem agarra pode arrastar ou carregar você (cada 1,5 m custa 1,5 m a mais, salvo se você for 2 tamanhos menor).'] },
  { id: 'amedrontado', nome: 'Amedrontado', efeitos: ['Desvantagem em testes de atributo e ataques enquanto vê a fonte do medo.', 'Não pode se aproximar da fonte do medo por vontade própria.'] },
  { id: 'atordoado', nome: 'Atordoado', efeitos: ['Incapacitado.', 'Falha automaticamente nas salvaguardas de Força e Destreza.', 'Ataques contra você têm Vantagem.'] },
  { id: 'caido', nome: 'Caído', efeitos: ['Só rasteja, ou gasta metade do deslocamento para se levantar (não dá com deslocamento 0).', 'Desvantagem nos seus ataques.', 'Ataques contra você: Vantagem a até 1,5 m, Desvantagem de mais longe.'] },
  { id: 'cego', nome: 'Cego', efeitos: ['Não enxerga: falha em testes que dependem da visão.', 'Ataques contra você têm Vantagem; os seus têm Desvantagem.'] },
  { id: 'contido', nome: 'Contido', efeitos: ['Deslocamento 0, não aumenta.', 'Ataques contra você têm Vantagem; os seus têm Desvantagem.', 'Desvantagem nas salvaguardas de Destreza.'] },
  { id: 'enfeiticado', nome: 'Enfeitiçado', efeitos: ['Não ataca nem mira quem o enfeitiçou com efeitos de dano.', 'Quem enfeitiçou tem Vantagem nos testes sociais com você.'] },
  { id: 'exaustao', nome: 'Exaustão', efeitos: ['Acumula níveis; no nível 6 a criatura morre.', 'Testes de d20 sofrem −2 por nível.', 'Deslocamento −1,5 m por nível.', 'Descanso longo tira 1 nível.'] },
  { id: 'inconsciente', nome: 'Inconsciente', efeitos: ['Incapacitado e Caído; solta o que segura (continua Caído ao acordar).', 'Deslocamento 0; não percebe o que acontece em volta.', 'Falha nas salvaguardas de Força e Destreza; ataques contra você têm Vantagem.', 'Acerto a até 1,5 m é crítico automático.'] },
  { id: 'incapacitado', nome: 'Incapacitado', efeitos: ['Sem ações, Ações Bônus nem Reações.', 'Perde a Concentração e não fala.', 'Se estiver assim ao rolar Iniciativa, rola com Desvantagem.'] },
  { id: 'invisivel', nome: 'Invisível', efeitos: ['Vantagem na Iniciativa.', 'Efeitos que exigem ver o alvo não o afetam (nem o equipamento).', 'Ataques contra você têm Desvantagem; os seus têm Vantagem (a menos que o vejam).'] },
  { id: 'paralisado', nome: 'Paralisado', efeitos: ['Incapacitado, deslocamento 0.', 'Falha nas salvaguardas de Força e Destreza; ataques contra você têm Vantagem.', 'Acerto a até 1,5 m é crítico automático.'] },
  { id: 'petrificado', nome: 'Petrificado', efeitos: ['Vira pedra (peso ×10, não envelhece); Incapacitado, deslocamento 0.', 'Ataques contra você têm Vantagem; falha nas salvaguardas de Força e Destreza.', 'Resistência a todo dano e imune a Envenenado.'] },
  { id: 'envenenado', nome: 'Envenenado', efeitos: ['Desvantagem em ataques e testes de atributo.'] },
  { id: 'surdo', nome: 'Surdo', efeitos: ['Não ouve: falha em testes que dependem da audição.'] },
]

/** Ações do turno (resumo próprio). */
export const ACOES_DND: [string, string][] = [
  ['Atacar', 'Um ataque com arma ou desarmado (Ataque Extra dá mais). Pode sacar ou guardar uma arma em cada ataque.'],
  ['Disparada', 'Ganha deslocamento extra igual ao seu deslocamento neste turno.'],
  ['Desengajar', 'Seu movimento não provoca Ataques de Oportunidade neste turno.'],
  ['Esquivar', 'Até seu próximo turno, ataques contra você têm Desvantagem (se vê o atacante) e salvaguardas de Destreza com Vantagem.'],
  ['Ajudar', 'Dá Vantagem no próximo teste de um aliado numa perícia sua, ou no próximo ataque de um aliado contra um inimigo a 1,5 m de você.'],
  ['Esconder', 'Destreza (Furtividade) CD 15, fora da linha de visão e com cobertura ou escuridão: fica Invisível enquanto escondido. O total vira a CD para acharem você.'],
  ['Influenciar', 'Convence um monstro. Disposto: faz sem teste. Contra a vontade: não faz. Hesitante: teste de Carisma ou Sabedoria (CD 15 ou a Inteligência do monstro, o que for maior).'],
  ['Magia', 'Conjura uma magia de 1 ação ou usa um item ou característica que pede a ação Magia.'],
  ['Preparar', 'Escolhe um gatilho e uma ação (ou movimento) para fazer como Reação antes do próximo turno. Magia preparada exige Concentração.'],
  ['Procurar', 'Teste de Sabedoria para perceber algo (Intuição, Medicina, Percepção ou Sobrevivência).'],
  ['Estudar', 'Teste de Inteligência para lembrar ou entender algo (Arcanismo, História, Investigação, Natureza ou Religião).'],
  ['Usar', 'Usa um objeto que precisa de uma ação.'],
]
export const DESCANSOS: [string, string][] = [
  ['Descanso curto (1 hora)', 'Precisa ter 1 PV. Gasta Dados de Vida para curar (dado + Constituição, mínimo 1 cada). Algumas características voltam. É interrompido por Iniciativa, magia que não seja truque ou dano.'],
  ['Descanso longo (8 horas)', 'Pelo menos 6 horas de sono. Recupera todos os PV e Dados de Vida, atributos reduzidos voltam e a Exaustão baixa 1. Só um a cada 24 horas. Interrompido por Iniciativa, magia que não seja truque, dano ou 1 hora de esforço.'],
]

/* ───────── Conferência da ficha ───────── */
export type ItemConferencia = { tipo: 'ok' | 'aviso' | 'erro'; texto: string; aba?: 'principal' | 'atributos' | 'habilidades' | 'arvore' | 'equipamentos' }
const ATR = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR']
const PADRAO = [15, 14, 13, 12, 10, 8]
const CUSTO: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

/**
 * Revisão da ficha de D&D 2024 (para o mestre e o jogador): o que falta, o que passou do limite e o que bate com as regras.
 * Não muda nada na ficha. `c` = cálculo da ficha (calcular()).
 */
export function conferirFichaDnd(d: DadosFicha, c: Pick<Calculo, 'recursosMax' | 'derivados'>, opcoes: { efeitos?: boolean } = {}): ItemConferencia[] {
  const out: ItemConferencia[] = []
  const efeitos = opcoes.efeitos !== false
  const { total, lista } = classesDaFicha(d)
  const p = progressoDaFichaDnd(d)
  if (!lista.length) out.push({ tipo: 'erro', texto: d.campos.classe ? `Classe “${d.campos.classe}” fora do SRD: a ficha não calcula a progressão dela.` : 'Escolha a classe.', aba: 'principal' })
  else out.push({ tipo: 'ok', texto: `${lista.map(x => `${x.cls.nome} ${x.nivel}`).join(' / ')} · nível total ${total}.` })
  if (!p.especieId) out.push({ tipo: 'erro', texto: 'Escolha a espécie.', aba: 'principal' })
  if (!p.antecedenteId) out.push({ tipo: 'erro', texto: 'Escolha o antecedente.', aba: 'principal' })
  // Atributos
  const v = ATR.map(a => Number(d.atributos[a]) || 0)
  if (v.every(x => x === 10)) out.push({ tipo: 'erro', texto: 'Os atributos ainda estão todos em 10. Use o conjunto padrão (15, 14, 13, 12, 10, 8), a compra de 27 pontos ou a rolagem que o mestre permitir.', aba: 'atributos' })
  else {
    if (v.some(x => x > 20)) out.push({ tipo: 'aviso', texto: 'Há atributo acima de 20 (o limite normal; só itens ou Dádivas Épicas passam disso).', aba: 'atributos' })
    if (v.some(x => x < 3)) out.push({ tipo: 'aviso', texto: 'Há atributo abaixo de 3.', aba: 'atributos' })
    if (total === 1) {
      const soma = v.reduce((a, b) => a + b, 0)
      const padraoSoma = PADRAO.reduce((a, b) => a + b, 0) + 3
      if (soma > padraoSoma + 1) out.push({ tipo: 'aviso', texto: `Soma dos atributos ${soma}: acima do conjunto padrão com o antecedente (${padraoSoma}). Confira se foi rolagem combinada com o mestre.`, aba: 'atributos' })
      const base = v.map(x => Math.min(15, x))
      const pontos = base.reduce((t, x) => t + (CUSTO[x] ?? (x < 8 ? 0 : 9)), 0)
      if (pontos > 27 + 6 && soma <= padraoSoma + 1) out.push({ tipo: 'aviso', texto: 'Compra de pontos parece passar de 27 (contando o bônus do antecedente).', aba: 'atributos' })
    }
  }
  // Multiclasse
  if (lista.length > 1) {
    const faltas = requisitosMulticlasse(d.atributos, lista.map(x => x.cls.id))
    if (faltas.length) out.push({ tipo: 'aviso', texto: 'Multiclasse sem os requisitos: ' + faltas.join('; ') + ' (o mestre pode ter liberado).', aba: 'arvore' })
  }
  // Escolhas da progressão
  if (efeitos && lista.length) {
    const vis = progressaoVisivel(MARCOS_DND_2024, p)
    const pend = vis.filter(m => m.estado === 'escolher' || m.estado === 'pendente')
    if (pend.length) out.push({ tipo: 'aviso', texto: `${pend.length} escolha(s) pendente(s): ${pend.slice(0, 4).map(m => m.nome).join(', ')}${pend.length > 4 ? '…' : ''}.`, aba: 'arvore' })
    else out.push({ tipo: 'ok', texto: 'Nenhuma escolha pendente na progressão.' })
  }
  // Magias
  if (efeitos) {
    const sel = lerMagiasDnd(d.dndMagias)
    for (const l of conjuradoresDnd(d)) {
      const n = contarMagias(sel, l)
      if (n.truques > l.truques) out.push({ tipo: 'erro', texto: `${l.classeNome}: ${n.truques} truques, o limite é ${l.truques}.`, aba: 'habilidades' })
      if (n.preparadas > l.preparadas) out.push({ tipo: 'erro', texto: `${l.classeNome}: ${n.preparadas} magias preparadas, o limite é ${l.preparadas}.`, aba: 'habilidades' })
      const faltam = (l.truques - n.truques) + (l.preparadas - n.preparadas)
      if (faltam > 0) out.push({ tipo: 'aviso', texto: `${l.classeNome}: ainda dá para escolher ${l.truques - n.truques > 0 ? `${l.truques - n.truques} truque(s)` : ''}${l.truques - n.truques > 0 && l.preparadas - n.preparadas > 0 ? ' e ' : ''}${l.preparadas - n.preparadas > 0 ? `${l.preparadas - n.preparadas} magia(s) preparada(s)` : ''}.`, aba: 'habilidades' })
      else if (faltam === 0) out.push({ tipo: 'ok', texto: `${l.classeNome}: magias dentro do limite.` })
    }
  }
  // PV
  const sugerido = Number(c.derivados.pv_sugerido) || 0, pvMax = Number(d.recursos.pv?.max ?? c.recursosMax.pv) || 0
  if (sugerido && pvMax && Math.abs(pvMax - sugerido) > Math.max(2, total)) out.push({ tipo: 'aviso', texto: `PV máximos ${pvMax}, a média fixa daria ${sugerido}. Tudo bem se foram rolados; confira.`, aba: 'principal' })
  // CA
  if (Number(d.campos.ca_base) > 10 && Number(d.campos.des_max) === 10) out.push({ tipo: 'aviso', texto: 'Armadura com CA base acima de 10 e sem limite de Destreza: armadura média limita a +2 e pesada não usa Destreza.', aba: 'principal' })
  // XP x nível
  const xp = Number(d.campos.xp) || 0
  if (xp > 0) {
    const pelo = nivelPeloXp(xp)
    if (pelo > total) out.push({ tipo: 'aviso', texto: `Com ${xp} XP o personagem já pode chegar ao nível ${pelo}.`, aba: 'arvore' })
    if (pelo < total) out.push({ tipo: 'aviso', texto: `Nível ${total} pede ${XP_DO_NIVEL[total - 1]} XP (tem ${xp}). Normal se o grupo sobe por marcos.`, aba: 'principal' })
  }
  if (!out.some(x => x.tipo !== 'ok')) out.push({ tipo: 'ok', texto: 'Tudo certo para jogar.' })
  return out
}
