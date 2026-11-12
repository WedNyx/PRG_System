/**
 * D&D 2024 — classes da ficha e multiclasse (v0.33.6). Regras do SRD 5.2.1 (CC BY 4.0), “Multiclassing”.
 *
 * Formato (compatível com fichas antigas):
 *  - campos.classe = classe inicial; campos.nivel = nível TOTAL do personagem (proficiência, truques, espécie).
 *  - dndMulticlasse = { idDaOutraClasse: níveis } — a classe inicial fica com o que sobra (total − soma).
 * Sem multiclasse tudo continua exatamente como antes.
 */
import type { DadosFicha } from './tipos'
import { CLASSES_SRD, type ClasseSrd } from './dnd2024Srd'

/** Mesmo id usado nos marcos (“Clérigo” → “clerigo”). */
export const idDe = (valor: unknown): string => typeof valor === 'string'
  ? valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) : ''

/** Atributo principal de cada classe (13+ para entrar ou sair numa multiclasse). 'ou' = basta um. */
export const ATRIBUTO_PRINCIPAL: Record<string, { atributos: string[]; ou?: boolean }> = {
  barbaro: { atributos: ['FOR'] }, bardo: { atributos: ['CAR'] }, clerigo: { atributos: ['SAB'] }, druida: { atributos: ['SAB'] },
  guerreiro: { atributos: ['FOR', 'DES'], ou: true }, monge: { atributos: ['DES', 'SAB'] }, paladino: { atributos: ['FOR', 'CAR'] },
  patrulheiro: { atributos: ['DES', 'SAB'] }, ladino: { atributos: ['DES'] }, feiticeiro: { atributos: ['CAR'] }, bruxo: { atributos: ['CAR'] }, mago: { atributos: ['INT'] },
}
const NOME_ATR: Record<string, string> = { FOR: 'Força', DES: 'Destreza', CON: 'Constituição', INT: 'Inteligência', SAB: 'Sabedoria', CAR: 'Carisma' }

/** O que se ganha ao entrar na classe como multiclasse (resumo do SRD). */
export const AO_ENTRAR: Record<string, string> = {
  barbaro: 'Dado de Vida, armas marciais e escudos.',
  bardo: 'Dado de Vida, 1 perícia à escolha, 1 instrumento musical e armaduras leves.',
  clerigo: 'Dado de Vida, armaduras leves e médias e escudos.',
  druida: 'Dado de Vida, armaduras leves e escudos.',
  guerreiro: 'Dado de Vida, armas marciais, armaduras leves e médias e escudos.',
  monge: 'Só o Dado de Vida.',
  paladino: 'Dado de Vida, armas marciais, armaduras leves e médias e escudos.',
  patrulheiro: 'Dado de Vida, armas marciais, 1 perícia da lista do Patrulheiro, armaduras leves e médias e escudos.',
  ladino: 'Dado de Vida, 1 perícia da lista do Ladino, Ferramentas de Ladrão e armaduras leves.',
  feiticeiro: 'Só o Dado de Vida.',
  bruxo: 'Dado de Vida e armaduras leves.',
  mago: 'Só o Dado de Vida.',
}

export function lerMulticlasseDnd(valor: unknown, principalId = ''): Record<string, number> {
  const r: Record<string, number> = {}
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return r
  for (const [id, n] of Object.entries(valor).slice(0, 12)) {
    if (id !== principalId && CLASSES_SRD.some(c => c.id === id) && Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 19) r[id] = n as number
  }
  return r
}

export type ClasseNaFicha = { cls: ClasseSrd; nivel: number; principal: boolean }

/** Classes da ficha com o nível em cada uma. A inicial nunca fica abaixo de 1. */
export function classesDaFicha(d: Pick<DadosFicha, 'campos' | 'dndMulticlasse'>): { total: number; lista: ClasseNaFicha[]; outras: Record<string, number> } {
  const principalId = idDe(d.campos.classe)
  const lido = Number(d.campos.nivel)
  const total = Number.isInteger(lido) ? Math.max(1, Math.min(20, lido)) : 1
  const cls = CLASSES_SRD.find(c => c.id === principalId)
  const outras = lerMulticlasseDnd(d.dndMulticlasse, principalId)
  const soma = Object.values(outras).reduce((a, b) => a + b, 0)
  const lista: ClasseNaFicha[] = []
  if (cls) lista.push({ cls, nivel: Math.max(1, total - soma), principal: true })
  for (const [id, nivel] of Object.entries(outras)) lista.push({ cls: CLASSES_SRD.find(c => c.id === id)!, nivel, principal: false })
  return { total, lista, outras }
}

const numero = (v: string | undefined) => { const m = (v ?? '').match(/(\d+)/); return m ? Number(m[1]) : 0 }
const coluna = (c: ClasseNaFicha, nome: string) => c.cls.colunas[nome]?.[Math.max(1, Math.min(20, c.nivel)) - 1]

/** Tabela “Conjurador Multiclasse” do SRD 5.2.1 (nível de conjurador → espaços de 1º a 9º). */
const MULTI: number[][] = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
]
const COMPLETOS = ['bardo', 'clerigo', 'druida', 'feiticeiro', 'mago'], MEIOS = ['paladino', 'patrulheiro']

/**
 * Espaços de magia. Uma só classe com Conjuração → a tabela dela. Duas ou mais → níveis completos
 * + metade (para cima) de Paladino e Patrulheiro na tabela de multiclasse. Magia de Pacto fica à parte.
 */
export function espacosDeMagia(lista: ClasseNaFicha[]) {
  const espacos = Array(10).fill(0) as number[]
  const conjuradores = lista.filter(c => COMPLETOS.includes(c.cls.id) || MEIOS.includes(c.cls.id))
  let nivelConjurador = 0
  if (conjuradores.length === 1) {
    for (let n = 1; n <= 9; n++) espacos[n] = numero(coluna(conjuradores[0], `Espaços de ${n}º nível`))
  } else if (conjuradores.length > 1) {
    nivelConjurador = conjuradores.reduce((t, c) => t + (MEIOS.includes(c.cls.id) ? Math.ceil(c.nivel / 2) : c.nivel), 0)
    MULTI[Math.min(20, nivelConjurador) - 1]?.forEach((q, i) => { espacos[i + 1] = q })
  }
  const bruxo = lista.find(c => c.cls.id === 'bruxo')
  return {
    espacos, nivelConjurador, multiclasse: conjuradores.length > 1,
    pacto: bruxo ? numero(coluna(bruxo, 'Espaços de magia')) : 0,
    pactoNivel: bruxo ? numero(coluna(bruxo, 'Nível dos espaços')) : 0,
  }
}

/** Atributos que faltam (13+) para ter estas classes juntas. Vazio = pode. */
export function requisitosMulticlasse(atributos: Record<string, number>, classes: string[]): string[] {
  const faltas: string[] = []
  for (const id of classes) {
    const r = ATRIBUTO_PRINCIPAL[id]; if (!r) continue
    const ok = r.ou ? r.atributos.some(a => (Number(atributos[a]) || 0) >= 13) : r.atributos.every(a => (Number(atributos[a]) || 0) >= 13)
    if (!ok) faltas.push(`${CLASSES_SRD.find(c => c.id === id)?.nome ?? id} pede ${r.atributos.map(a => NOME_ATR[a]).join(r.ou ? ' ou ' : ' e ')} 13`)
  }
  return faltas
}

/**
 * Valida só o que mudou: classes conhecidas, a classe inicial com pelo menos 1 nível, total até 20 e,
 * ao ENTRAR numa classe nova, 13+ no atributo principal dela e das classes atuais.
 * O mestre pode liberar a entrada sem os requisitos (ignorarRequisitos).
 */
export function validarAlteracoesMulticlasseDnd(
  antes: Pick<DadosFicha, 'campos' | 'atributos' | 'dndMulticlasse'>,
  depois: Pick<DadosFicha, 'campos' | 'atributos' | 'dndMulticlasse'>,
  opcoes: { ignorarRequisitos?: boolean } = {},
): string[] {
  const v = depois.dndMulticlasse
  if (v === undefined || v === null) return []
  if (typeof v !== 'object' || Array.isArray(v)) return ['Multiclasse de D&D deve formar um objeto.']
  const principal = idDe(depois.campos.classe)
  const novas = lerMulticlasseDnd(v, principal), velhas = lerMulticlasseDnd(antes.dndMulticlasse, idDe(antes.campos.classe))
  const erros: string[] = []
  for (const id of Object.keys(v)) if (!Object.hasOwn(novas, id)) erros.push(id === principal ? 'A classe inicial não entra na multiclasse.' : 'Classe ou nível inválido na multiclasse: ' + id)
  if (!Object.keys(novas).length) return erros
  if (!CLASSES_SRD.some(c => c.id === principal)) erros.push('Escolha a classe inicial antes da multiclasse.')
  const mudou = JSON.stringify(novas) !== JSON.stringify(velhas) || idDe(antes.campos.classe) !== principal || Number(antes.campos.nivel) !== Number(depois.campos.nivel)
  if (!mudou) return erros
  const total = Number(depois.campos.nivel) || 1
  const soma = Object.values(novas).reduce((a, b) => a + b, 0)
  if (soma >= total) erros.push(`A classe inicial precisa de pelo menos 1 nível (nível total ${total}, outras classes ${soma}).`)
  const entrou = Object.keys(novas).filter(id => !velhas[id])
  if (entrou.length && !opcoes.ignorarRequisitos) {
    const faltas = requisitosMulticlasse(depois.atributos ?? {}, [principal, ...Object.keys(novas)])
    if (faltas.length) erros.push('Requisitos de multiclasse: ' + faltas.join('; ') + '.')
  }
  return erros
}
