/**
 * D&D 2024 — magias da ficha (v0.33.6). Fonte das regras: SRD 5.2.1 (CC BY 4.0).
 *
 * A ficha guarda só { idDaMagia: 'preparada' | 'extra' }:
 *  - 'preparada' conta no limite da tabela da classe (Truques / Magias preparadas) e precisa estar
 *    na lista da classe e num nível com espaço de magia;
 *  - 'extra' é magia que veio de outro lugar (subclasse, talento, item, liberação do mestre):
 *    sempre preparada, não conta no limite.
 * Nada aqui mexe em atributos ou bônus: CD e ataque mágico usam o modificador já calculado.
 */
import type { DadosFicha } from './tipos'
import { CLASSES_SRD } from './dnd2024Srd'
import { MAGIAS_SRD, type MagiaSrd } from './dnd2024Magias'
import { progressoDaFichaDnd, lerEscolhasDnd } from './dnd2024Ficha'

export type TipoMagia = 'preparada' | 'extra'
export const MAX_MAGIAS = 120
const POR_ID = new Map(MAGIAS_SRD.map(m => [m.id, m]))
export const magiaPorId = (id: string): MagiaSrd | undefined => POR_ID.get(id)

/** Atributo de conjuração de cada classe. */
export const ATRIBUTO_CONJURACAO: Record<string, 'INT' | 'SAB' | 'CAR'> = {
  bardo: 'CAR', clerigo: 'SAB', druida: 'SAB', paladino: 'CAR', patrulheiro: 'SAB', feiticeiro: 'CAR', bruxo: 'CAR', mago: 'INT',
}
/** Arcana Mística do Bruxo: nível da magia → nível do Bruxo em que ela chega. */
const ARCANA: Record<number, number> = { 6: 11, 7: 13, 8: 15, 9: 17 }

export function lerMagiasDnd(valor: unknown): Record<string, TipoMagia> {
  const r: Record<string, TipoMagia> = {}
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return r
  for (const [id, tipo] of Object.entries(valor).slice(0, MAX_MAGIAS)) {
    if (POR_ID.has(id) && (tipo === 'preparada' || tipo === 'extra')) r[id] = tipo
  }
  return r
}

const numero = (v: string | undefined) => { const m = (v ?? '').match(/(\d+)/); return m ? Number(m[1]) : 0 }

export type LimitesMagia = {
  classeId: string
  classeNome: string
  nivel: number
  /** Atributo de conjuração (INT/SAB/CAR); vazio se a classe não conjura. */
  atributo: '' | 'INT' | 'SAB' | 'CAR'
  truques: number
  preparadas: number
  /** Maior nível de magia com espaço (Bruxo: nível dos espaços de pacto). */
  nivelMax: number
  /** Bruxo: níveis 6–9 liberados pela Arcana Mística (uma magia de cada). */
  arcana: number[]
  /** Listas de classe de onde vêm as magias de nível 1+ e os truques. */
  listas: string[]
  listasTruque: string[]
}

export function limitesMagiasDnd(d: Pick<DadosFicha, 'campos' | 'dndEscolhas'>): LimitesMagia {
  const p = progressoDaFichaDnd(d)
  const escolhas = lerEscolhasDnd(d.dndEscolhas)
  const [classeId, nivelClasse] = Object.entries(p.nivelPorClasse)[0] ?? ['', 0]
  const cls = CLASSES_SRD.find(c => c.id === classeId)
  const nivel = Math.max(1, Math.min(20, nivelClasse || 1))
  const vazio: LimitesMagia = { classeId, classeNome: cls?.nome ?? '', nivel, atributo: '', truques: 0, preparadas: 0, nivelMax: 0, arcana: [], listas: [], listasTruque: [] }
  if (!cls || !ATRIBUTO_CONJURACAO[cls.id]) return vazio
  const col = (nome: string) => cls.colunas[nome]?.[nivel - 1]
  let truques = numero(col('Truques'))
  const listasTruque = [cls.id]
  const escolheu = (sufixo: string, opcao: string) => Object.entries(escolhas).some(([k, o]) => k.endsWith(sufixo) && o === opcao)
  // Ordem Divina (Taumaturgo) e Ordem Primal (Mágico): um truque a mais.
  if (cls.id === 'clerigo' && escolheu('-ordem-divina', 'taumaturgo')) truques += 1
  if (cls.id === 'druida' && escolheu('-ordem-primal', 'magico')) truques += 1
  // Guerreiro Abençoado / Druídico: dois truques da lista de Clérigo / Druida.
  if (cls.id === 'paladino' && nivel >= 2 && escolhas['paladino-n2-estilo-de-luta'] === 'guerreiro-abencoado') { truques += 2; listasTruque.push('clerigo') }
  if (cls.id === 'patrulheiro' && nivel >= 2 && escolhas['patrulheiro-n2-estilo-de-luta'] === 'guerreiro-druidico') { truques += 2; listasTruque.push('druida') }
  let nivelMax = 0
  for (let n = 1; n <= 9; n++) if (numero(col(`Espaços de ${n}º nível`)) > 0) nivelMax = n
  const arcana: number[] = []
  if (cls.id === 'bruxo') {
    nivelMax = numero(col('Nível dos espaços'))
    for (const [n, req] of Object.entries(ARCANA)) if (nivel >= req) arcana.push(Number(n))
  }
  // Segredos Mágicos (Bardo 10+): magias novas também das listas de Clérigo, Druida e Mago.
  const listas = cls.id === 'bardo' && nivel >= 10 ? ['bardo', 'clerigo', 'druida', 'mago'] : [cls.id]
  return { ...vazio, atributo: ATRIBUTO_CONJURACAO[cls.id], truques, preparadas: numero(col('Magias preparadas')), nivelMax, arcana, listas, listasTruque }
}

/** É uma magia de Arcana Mística (Bruxo, nível acima dos espaços de pacto)? */
const ehArcana = (m: MagiaSrd, l: LimitesMagia) => l.classeId === 'bruxo' && m.nivel > l.nivelMax && l.arcana.includes(m.nivel)

export function contarMagias(sel: Record<string, TipoMagia>, l: LimitesMagia) {
  let truques = 0, preparadas = 0
  const arcana: Record<number, number> = {}
  for (const [id, tipo] of Object.entries(sel)) {
    const m = POR_ID.get(id)
    if (!m || tipo !== 'preparada') continue
    if (m.nivel === 0) truques++
    else if (ehArcana(m, l)) arcana[m.nivel] = (arcana[m.nivel] ?? 0) + 1
    else preparadas++
  }
  return { truques, preparadas, arcana }
}

/** Motivo pelo qual a magia NÃO pode entrar como preparada (null = pode). */
export function motivoBloqueio(m: MagiaSrd, l: LimitesMagia, sel: Record<string, TipoMagia>): string | null {
  if (!l.atributo) return 'Esta classe não conjura magias pela tabela.'
  const listas = m.nivel === 0 ? l.listasTruque : l.listas
  if (!m.classes.some(c => listas.includes(c))) return 'Fora da lista de magias da classe.'
  const c = contarMagias(sel, l)
  if (m.nivel === 0) return c.truques >= l.truques ? (l.truques ? `Limite de truques (${l.truques}).` : 'A classe não tem truques neste nível.') : null
  if (ehArcana(m, l)) return (c.arcana[m.nivel] ?? 0) >= 1 ? `Já tem a Arcana Mística de ${m.nivel}º nível.` : null
  if (m.nivel > l.nivelMax) return l.nivelMax ? `Precisa de espaço de ${m.nivel}º nível (o maior agora é ${l.nivelMax}º).` : 'Ainda sem espaços de magia.'
  return c.preparadas >= l.preparadas ? `Limite de magias preparadas (${l.preparadas}).` : null
}

/**
 * Valida só o que MUDOU (como nas escolhas): magias antigas continuam mesmo se o nível baixar,
 * mas uma magia nova 'preparada' precisa caber na lista, no nível e no limite.
 */
export function validarAlteracoesMagiasDnd(
  antes: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMagias'>,
  depois: Pick<DadosFicha, 'campos' | 'dndEscolhas' | 'dndMagias'>,
): string[] {
  if (depois.dndMagias !== undefined && depois.dndMagias !== null && (typeof depois.dndMagias !== 'object' || Array.isArray(depois.dndMagias))) return ['Magias de D&D devem formar um objeto.']
  const velhas = lerMagiasDnd(antes.dndMagias), novas = lerMagiasDnd(depois.dndMagias)
  const l = limitesMagiasDnd(depois)
  const erros: string[] = []
  if (depois.dndMagias && typeof depois.dndMagias === 'object') {
    const ids = Object.keys(depois.dndMagias)
    if (ids.length > MAX_MAGIAS) erros.push(`No máximo ${MAX_MAGIAS} magias.`)
    for (const id of ids.slice(0, MAX_MAGIAS)) if (!Object.hasOwn(novas, id) && !Object.hasOwn(velhas, id)) erros.push('Magia desconhecida: ' + id)
  }
  // Coloca primeiro as que já existiam, depois testa cada nova contra o que já está dentro.
  const base: Record<string, TipoMagia> = {}
  for (const [id, t] of Object.entries(novas)) if (velhas[id] === t) base[id] = t
  for (const [id, t] of Object.entries(novas)) {
    if (velhas[id] === t) continue
    if (t === 'preparada') {
      const motivo = motivoBloqueio(POR_ID.get(id)!, l, base)
      if (motivo) { erros.push(`${POR_ID.get(id)!.nome}: ${motivo}`); continue }
    }
    base[id] = t
  }
  return erros
}

/** Multiplica a quantidade de dados ("1d10" × 2 = "2d10"); mantém o resto ("1d4 + 1"). */
function vezes(expr: string, k: number) { return expr.replace(/^(\d+)d(\d+)/, (_, q, f) => `${Number(q) * k}d${f}`) }
function somar(expr: string, extra: string, k: number) {
  if (k <= 0) return expr
  const a = expr.match(/^(\d+)d(\d+)(.*)$/), b = extra.match(/^(\d+)d(\d+)$/)
  if (a && b && a[2] === b[2]) return `${Number(a[1]) + Number(b[1]) * k}d${a[2]}${a[3]}`
  return `${expr}+${vezes(extra, k)}`
}

/**
 * Expressão de dano/cura no espaço escolhido. Truques crescem nos níveis 5/11/17 do personagem;
 * magias com "Usando um espaço maior" somam o dado extra por nível acima.
 */
export function expressaoMagia(m: MagiaSrd, o: { espaco?: number; nivelPersonagem: number; mod: number }): string | null {
  const base = m.dano ?? m.cura
  if (!base) return null
  let e = base.replace(/\s+/g, '')
  if (m.nivel === 0 && m.escalaTruque) e = vezes(e, 1 + (o.nivelPersonagem >= 5 ? 1 : 0) + (o.nivelPersonagem >= 11 ? 1 : 0) + (o.nivelPersonagem >= 17 ? 1 : 0))
  if (m.nivel > 0 && m.porNivel && o.espaco && o.espaco > m.nivel) e = somar(e, m.porNivel, o.espaco - m.nivel)
  if (m.cura && !m.dano && m.resumo.includes('modificador de conjuração') && o.mod) e += (o.mod > 0 ? '+' : '') + o.mod
  return e
}

/** Id do recurso de espaço de magia usado ao conjurar no nível n (Bruxo usa o pacto). */
export function recursoDoEspaco(l: LimitesMagia, n: number): string | null {
  if (n <= 0) return null
  if (l.classeId === 'bruxo') return n <= l.nivelMax ? 'pacto' : null
  return 'espacos_' + n
}
