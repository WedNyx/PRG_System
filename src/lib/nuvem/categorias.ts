/**
 * Divide os dados de uma ficha em "partes" (caminhos) e classifica cada parte numa das
 * áreas de permissão da campanha (identidade, pv, atributos...). Funciona para a Ficha V8
 * e para as fichas genéricas. Usado no servidor para aplicar as regras do mestre.
 */
import type { Campo, Permissoes, Regra } from '../campanhas/permissoes'

type Dados = Record<string, unknown>
const obj = (v: unknown): Dados => (v && typeof v === 'object' && !Array.isArray(v) ? v as Dados : {})

// ---- Ficha V8 ----
const V8_FIELDS: Record<string, Campo> = {
  name: 'identidade', player: 'identidade', origin: 'identidade', concept: 'identidade',
  level: 'nivel', xp: 'nivel',
  hpCurrent: 'pv', hpMax: 'pv', conditions: 'pv', defMod: 'pv', dodges: 'pv', guards: 'pv', reaction: 'pv', energy: 'pv',
  inventory: 'equipamentos', notes: 'anotacoes',
}
const V8_TOPO: Record<string, Campo> = { portrait: 'identidade', powers: 'habilidades', weapons: 'equipamentos', inventoryItems: 'equipamentos', version: 'anotacoes' }
function categoriaV8(caminho: string): Campo {
  if (caminho.startsWith('fields.')) {
    const k = caminho.slice(7)
    if (k.startsWith('stat')) return 'atributos'
    if (k.startsWith('skill')) return 'pericias'
    return V8_FIELDS[k] ?? 'identidade'
  }
  return V8_TOPO[caminho] ?? 'identidade'
}

// ---- Fichas genéricas ----
const LISTA_CAT: [RegExp, Campo][] = [
  [/inventario|equipamento|armas|protecao|ataques/, 'equipamentos'],
  [/habilidade|tecnica|talento|magia|poder|facanha|transforma|rituais|tracos/, 'habilidades'],
  [/ferimento|dano|consequencia/, 'pv'],
]
function categoriaGenerica(caminho: string): Campo {
  if (caminho === 'nome') return 'identidade'
  if (caminho === 'atributos') return 'atributos'
  if (caminho === 'pericias') return 'pericias'
  if (caminho === 'recursos') return 'pv'
  // Inventário estruturado: os itens/poderes em si seguem as regras do mestre;
  // quantidade, equipado, usos gastos e carteira mudam no jogo (área de PV e recursos).
  if (caminho === 'itens') return 'equipamentos'
  if (caminho === 'poderes') return 'habilidades'
  if (caminho === 'arvore') return 'habilidades'
  if (caminho === 'dndLivros') return 'identidade'
  if (caminho === 'dnd2014AtributosBase' || caminho === 'dnd2014AtributosExtras') return 'atributos'
  if (caminho === 'dnd2014PericiasClasse') return 'pericias'
  if (caminho === 'dnd2014PericiasRaciais') return 'pericias'
  if (caminho === 'dnd2014Subclasse') return 'habilidades'
  if (caminho === 'dnd2014Multiclasse') return 'nivel'
  if (caminho === 'dnd2014Magias') return 'habilidades'
  if (caminho === 'dndAntecedente') return 'atributos'
  if (caminho === 'dndTalentoHumano') return 'habilidades'
  if (caminho === 'dndEscolhas') return 'habilidades'
  if (caminho === 'dndMagias') return 'habilidades'
  if (caminho === 'dndMulticlasse') return 'nivel'
  if (caminho === 'uso') return 'pv'
  if (caminho.startsWith('campos.')) {
    const k = caminho.slice(7)
    if (/^(nivel|xp)$|^nivel_|nex/.test(k)) return 'nivel'
    if (/armadura|deflexao|outros_ca|defesa_bonus|prof_armadura/.test(k)) return 'equipamentos'
    return 'identidade'
  }
  if (caminho.startsWith('listas.')) {
    const k = caminho.slice(7)
    for (const [re, c] of LISTA_CAT) if (re.test(k)) return c
    return 'anotacoes'
  }
  return 'identidade'
}

export const ehV8 = (sistema: string) => sistema === 'lunethernnyis-v8'

/** Lista os caminhos de uma ficha: 'fields.name', 'portrait', 'campos.classe', 'atributos'... */
export function caminhos(sistema: string, d: Dados): string[] {
  if (ehV8(sistema)) return [...Object.keys(obj(d.fields)).map(k => 'fields.' + k), ...Object.keys(d).filter(k => k !== 'fields')]
  return [...Object.keys(d).filter(k => k !== 'campos' && k !== 'listas' && k !== 'sistema'),
    ...Object.keys(obj(d.campos)).map(k => 'campos.' + k), ...Object.keys(obj(d.listas)).map(k => 'listas.' + k)]
}
export const categoria = (sistema: string, caminho: string): Campo => ehV8(sistema) ? categoriaV8(caminho) : categoriaGenerica(caminho)

const partir = (c: string): [string, string | undefined] => { const i = c.indexOf('.'); return i < 0 ? [c, undefined] : [c.slice(0, i), c.slice(i + 1)] }
export function ler(d: Dados, caminho: string): unknown {
  const [a, b] = partir(caminho)
  return b === undefined ? d[a] : obj(d[a])[b]
}
function escrever(d: Dados, caminho: string, valor: unknown): Dados {
  const [a, b] = partir(caminho)
  if (b === undefined) { const n = { ...d }; if (valor === undefined) delete n[a]; else n[a] = valor; return n }
  const filho = { ...obj(d[a]) }; if (valor === undefined) delete filho[b]; else filho[b] = valor
  return { ...d, [a]: filho }
}

/** Valor que a Ficha V8 usa quando o campo ainda não existe (ficha nova). */
function padraoV8(caminho: string): unknown {
  const k = caminho.startsWith('fields.') ? caminho.slice(7) : null
  if (k === null) return caminho === 'version' ? 2 : caminho === 'portrait' ? null : ['powers', 'weapons', 'inventoryItems'].includes(caminho) ? [] : undefined
  if (k.startsWith('stat')) return '1'
  if (k.startsWith('skill')) return '0'
  return ({ level: '1', xp: '0', hpCurrent: '30', hpMax: '30', defMod: '0', dodges: '2', guards: '1', reaction: '1' } as Record<string, string>)[k] ?? ''
}
const vazio = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
const iguais = (a: unknown, b: unknown) => (vazio(a) && vazio(b)) || JSON.stringify(a) === JSON.stringify(b)

export type Mudanca = { caminho: string; categoria: Campo; antes: unknown; depois: unknown }
/** O que mudou entre duas versões da ficha. */
export function diferencas(sistema: string, antes: Dados, depois: Dados): Mudanca[] {
  const todos = new Set([...caminhos(sistema, antes), ...caminhos(sistema, depois)])
  const out: Mudanca[] = []
  for (const c of todos) {
    let a = ler(antes, c), b = ler(depois, c)
    if (ehV8(sistema)) { if (a === undefined) a = padraoV8(c); if (b === undefined) b = padraoV8(c) }
    if (!iguais(a, b)) out.push({ caminho: c, categoria: categoria(sistema, c), antes: a, depois: b })
  }
  return out
}
export function aplicar(base: Dados, mudancas: Pick<Mudanca, 'caminho' | 'depois'>[]): Dados {
  return mudancas.reduce((d, m) => escrever(d, m.caminho, m.depois), base)
}

/**
 * Decide o que fazer com cada mudança de um JOGADOR (o mestre pode tudo):
 * 'livre' salva; 'aprovacao' vira pedido ao mestre; 'mestre' (ou área bloqueada) é ignorada.
 */
export function separarPorRegra(mudancas: Mudanca[], padrao: Permissoes, excecao: Partial<Permissoes>, bloqueadas: string[] = []) {
  const regra = (c: Campo): Regra => bloqueadas.includes(c) ? 'mestre' : excecao[c] ?? padrao[c] ?? 'aprovacao'
  return {
    livres: mudancas.filter(m => regra(m.categoria) === 'livre'),
    aprovacao: mudancas.filter(m => regra(m.categoria) === 'aprovacao'),
    bloqueadas: mudancas.filter(m => regra(m.categoria) === 'mestre'),
  }
}

/** Texto curto para mostrar um valor no histórico/pedidos (sem despejar retratos em base64). */
export function resumoValor(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—'
  if (typeof v === 'string') return v.startsWith('data:image') ? '[imagem]' : v.length > 120 ? v.slice(0, 117) + '…' : v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `${v.length} item(ns)`
  const o = v as Dados
  const entradas = Object.entries(o).filter(([, x]) => typeof x !== 'object').slice(0, 8)
  return entradas.map(([k, x]) => `${k}: ${String(x).slice(0, 20)}`).join(', ') + (Object.keys(o).length > 8 ? '…' : '')
}

/** Para objetos (ex.: atributos), mostra só as chaves que mudaram: "DES: 10" → "DES: 16". */
export function resumoMudanca(antes: unknown, depois: unknown): [string, string] {
  const a = obj(antes), b = obj(depois)
  if (antes && depois && typeof antes === 'object' && typeof depois === 'object' && !Array.isArray(antes) && !Array.isArray(depois)) {
    const chaves = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    if (chaves.length && chaves.length <= 12) {
      const r = (o: Dados) => chaves.map(k => `${k}: ${typeof o[k] === 'object' && o[k] !== null ? resumoValor(o[k]) : resumoValor(o[k])}`).join(', ')
      return [r(a), r(b)]
    }
  }
  return [resumoValor(antes), resumoValor(depois)]
}
