/**
 * Inventário e poderes estruturados das fichas (todos os sistemas genéricos).
 * - `itens` e `poderes` ficam na ficha (área “Armas e equipamentos” / “Habilidades” das permissões).
 * - `uso` guarda o que muda durante o jogo (quantidade, equipado, usos gastos, carteira):
 *   fica na área “PV e recursos”, que normalmente é livre para o jogador.
 * Funções puras, testadas em inventario.test.ts.
 */
import { imagemDaPlataforma } from '../imagens'
import type { Sistema } from './tipos'
import { lerArte, lerRaridade, type ArteItem, type Raridade } from '../itensArte'
import { armaDndPorIdEdicao } from './dnd2014Armas'
import { referenciaArmaDndPorId } from './dnd2024ArmasExpandidas'
import { iconeRpgPorId, sugestaoIconeRpg } from '../iconesRpg'
import { ehIconeGi } from '../iconesGi'

export type CategoriaItem = 'arma' | 'armadura' | 'consumivel' | 'equipamento' | 'tesouro' | 'outro'
export type TipoPoder = 'magia' | 'habilidade' | 'talento' | 'tecnica' | 'outro'
/** Bônus de um item equipado: soma `valor` no alvo (ex.: 'derivado:ca', 'atributo:FOR', 'pericia:furtividade', 'recurso:pv'). */
export type Bonus = { alvo: string; valor: number }
/** `alcance` em metros (ataques na mesa); sem alcance = corpo a corpo (1,5 m). */
/** `arte`: desenho antigo da Forja (só lido para achar o ícone); `raridade` dá a cor da moldura. */
export type Item = { id: string; nome: string; categoria: CategoriaItem; peso: number; dano?: string; alcance?: number; bonus: Bonus[]; descricao?: string; arte?: ArteItem; raridade?: Raridade
  /** Foto enviada (v0.32.5); sem foto, usa o ícone do Game-Icons. */
  imagem?: string
  /** Item mágico: aparece na ala ✨ do inventário. */
  magico?: boolean
  /** Ícone SVG de biblioteca escolhido pelo usuário; foto tem prioridade visual. */
  iconeBiblioteca?: string
  /** Arma canônica da tabela SRD 5.2.1; itens criados manualmente não precisam deste campo. */
  armaDnd?: string
  /** Referência bibliográfica para suplementos, armas modernas e armas mágicas. */
  armaRefDnd?: string
  /** Bônus mágico da arma (+0 a +3), somado uma única vez ao dano. */
  bonusArma?: number
  /** Rolagens prontas do item (v0.35.3): um botão para cada, nas ações rápidas e no inventário. */
  rolagens?: RolagemItem[] }
export type RolagemItem = { nome: string; expr: string }
export const ELEMENTOS_ORDEM = ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo'] as const
export const FONTES_ORDEM = ['Classe', 'Trilha', 'Paranormal', 'Outro'] as const
export type Poder = { elementoOrdem?: typeof ELEMENTOS_ORDEM[number]; fonteOrdem?: typeof FONTES_ORDEM[number]; circuloOrdem?: number; id: string; nome: string; tipo: TipoPoder; recurso?: string; custo?: number; usosMax?: number; expressao?: string; alcance?: number; descricao?: string
  /** Em que descanso os usos voltam (padrão: longo). */
  recarga?: 'curto' }
export type Uso = { itens: Record<string, { qtd: number; equipado: boolean }>; poderes: Record<string, number>; carteira: string }

export const CATEGORIAS_ITEM: { id: CategoriaItem; nome: string; icone: string }[] = [
  { id: 'arma', nome: 'Arma', icone: '⚔️' }, { id: 'armadura', nome: 'Armadura/escudo', icone: '🛡️' },
  { id: 'consumivel', nome: 'Consumível', icone: '🧪' }, { id: 'equipamento', nome: 'Equipamento', icone: '🎒' },
  { id: 'tesouro', nome: 'Tesouro', icone: '💎' }, { id: 'outro', nome: 'Outro', icone: '📦' },
]
export const TIPOS_PODER: { id: TipoPoder; nome: string; icone: string }[] = [
  { id: 'magia', nome: 'Magia', icone: '✨' }, { id: 'habilidade', nome: 'Habilidade', icone: '🌀' },
  { id: 'talento', nome: 'Talento', icone: '⭐' }, { id: 'tecnica', nome: 'Técnica', icone: '🥋' }, { id: 'outro', nome: 'Outro', icone: '📜' },
]

const LIM = { itens: 300, poderes: 200, bonus: 8, texto: 2000 }
const txt = (v: unknown, max: number) => typeof v === 'string' ? v.slice(0, max) : ''
const num = (v: unknown, min: number, max: number, padrao = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : padrao }
const id = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : Math.random().toString(36).slice(2, 12)
const EXPR = /^[0-9dkhlfrs!+\- ]{0,40}$/i
export const MAX_ROLAGENS_ITEM = 6
/** Rolagens prontas: até 6, nome curto e expressão de dados válida. */
export function lerRolagensItem(v: unknown): RolagemItem[] {
  return (Array.isArray(v) ? v : []).flatMap(r => {
    const o = r && typeof r === 'object' ? r as Record<string, unknown> : {}
    const nome = txt(o.nome, 40).trim(), expr = txt(o.expr, 40).trim()
    return nome && expr && EXPR.test(expr) && /\d/.test(expr) ? [{ nome, expr }] : []
  }).slice(0, MAX_ROLAGENS_ITEM)
}

export function normalizarItem(v: unknown): Item | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const nome = txt(o.nome, 120).trim(); if (!nome) return null
  const categoria = CATEGORIAS_ITEM.some(c => c.id === o.categoria) ? o.categoria as CategoriaItem : 'equipamento'
  const bonus = (Array.isArray(o.bonus) ? o.bonus : []).slice(0, LIM.bonus).flatMap(b => {
    const x = b as Record<string, unknown>
    return typeof x?.alvo === 'string' && /^(derivado|atributo|pericia|recurso):[A-Za-z0-9_]{1,40}$/.test(x.alvo) && Number(x.valor)
      ? [{ alvo: x.alvo, valor: num(x.valor, -99, 99) }] : []
  })
  const dano = txt(o.dano, 40).trim()
  // Forja (v0.35.3): o desenho antigo vira o ícone equivalente do Game-Icons e o campo `arte` some.
  const arte = lerArte(o.arte), raridade = lerRaridade(o.raridade)
  // Ícone: do acervo completo (gi:autor/nome, v0.35.3) ou um dos escolhidos da plataforma.
  const iconeBiblioteca = ehIconeGi(o.iconeBiblioteca) ? o.iconeBiblioteca : (iconeRpgPorId(o.iconeBiblioteca) ?? (arte ? iconeRpgPorId(sugestaoIconeRpg(arte.forma)) : null))?.id ?? null
  const armaDnd = categoria === 'arma' ? armaDndPorIdEdicao(o.armaDnd) : null
  const armaRefDnd = categoria === 'arma' ? referenciaArmaDndPorId(o.armaRefDnd) : null
  const rolagens = lerRolagensItem(o.rolagens)
  const bonusArma = armaDnd && typeof o.bonusArma === 'number' && Number.isInteger(o.bonusArma) && o.bonusArma >= 1 && o.bonusArma <= 3 ? o.bonusArma : 0
  return { id: id(o.id), nome, categoria, peso: Math.round(num(o.peso, 0, 100000) * 1000) / 1000, ...(dano && EXPR.test(dano) ? { dano } : {}), ...(Number(o.alcance) > 0 ? { alcance: num(o.alcance, 0, 1000) } : {}), bonus, ...(o.descricao ? { descricao: txt(o.descricao, LIM.texto) } : {}),
    ...(iconeBiblioteca ? { iconeBiblioteca } : {}), ...(raridade ? { raridade } : {}), ...(imagemDaPlataforma(o.imagem) ? { imagem: o.imagem } : {}), ...(o.magico === true || bonusArma > 0 ? { magico: true } : {}),
    ...(armaDnd ? { armaDnd: armaDnd.id } : {}), ...(armaRefDnd ? { armaRefDnd: armaRefDnd.id } : {}), ...(bonusArma > 0 ? { bonusArma } : {}), ...(rolagens.length ? { rolagens } : {}) }
}
export function normalizarPoder(v: unknown): Poder | null {
  if (!v || typeof v !== 'object') return null
  const o = v as Record<string, unknown>
  const nome = txt(o.nome, 120).trim(); if (!nome) return null
  const tipo = TIPOS_PODER.some(t => t.id === o.tipo) ? o.tipo as TipoPoder : 'habilidade'
  const expressao = txt(o.expressao, 40).trim()
  const recurso = typeof o.recurso === 'string' && /^[A-Za-z0-9_]{1,40}$/.test(o.recurso) ? o.recurso : undefined
  return {
    id: id(o.id), nome, tipo,
    ...(ELEMENTOS_ORDEM.some(e => e === o.elementoOrdem) ? { elementoOrdem: o.elementoOrdem as Poder['elementoOrdem'] } : {}),
    ...(FONTES_ORDEM.some(e => e === o.fonteOrdem) ? { fonteOrdem: o.fonteOrdem as Poder['fonteOrdem'] } : {}),
    ...([1,2,3,4].some(n => n === o.circuloOrdem) ? { circuloOrdem: Number(o.circuloOrdem) } : {}),
    ...(recurso ? { recurso, custo: num(o.custo, 0, 999, 1) } : {}),
    ...(Number(o.usosMax) > 0 ? { usosMax: num(o.usosMax, 1, 99), ...(o.recarga === 'curto' ? { recarga: 'curto' as const } : {}) } : {}),
    ...(expressao && EXPR.test(expressao) ? { expressao } : {}),
    ...(Number(o.alcance) > 0 ? { alcance: num(o.alcance, 0, 1000) } : {}),
    ...(o.descricao ? { descricao: txt(o.descricao, LIM.texto) } : {}),
  }
}
export const lerItens = (v: unknown): Item[] => (Array.isArray(v) ? v : []).slice(0, LIM.itens).map(normalizarItem).filter((x): x is Item => !!x)
export const lerPoderes = (v: unknown): Poder[] => (Array.isArray(v) ? v : []).slice(0, LIM.poderes).map(normalizarPoder).filter((x): x is Poder => !!x)
export function lerUso(v: unknown): Uso {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const itens: Uso['itens'] = {}, poderes: Uso['poderes'] = {}
  for (const [k, x] of Object.entries(o.itens && typeof o.itens === 'object' ? o.itens as object : {}).slice(0, LIM.itens)) {
    const e = x as Record<string, unknown>
    itens[k] = { qtd: num(e?.qtd, 0, 99999, 1), equipado: e?.equipado === true }
  }
  for (const [k, x] of Object.entries(o.poderes && typeof o.poderes === 'object' ? o.poderes as object : {}).slice(0, LIM.poderes)) poderes[k] = num(x, 0, 99)
  return { itens, poderes, carteira: txt(o.carteira, 500) }
}

/** Alvos possíveis de bônus para um sistema (para o editor de itens). */
export function alvosDeBonus(s: Sistema): { id: string; nome: string }[] {
  return [
    ...s.derivados.map(d => ({ id: 'derivado:' + d.id, nome: d.nome })),
    ...s.atributos.map(a => ({ id: 'atributo:' + a.id, nome: a.nome })),
    ...(s.pericias?.lista ?? []).map(p => ({ id: 'pericia:' + p.id, nome: (p.grupo && /salva|resist/i.test(p.grupo) ? 'Salvaguarda ' : '') + p.nome })),
    ...s.recursos.map(r => ({ id: 'recurso:' + r.id, nome: r.nome + ' (máximo)' })),
  ]
}

/** Soma os bônus dos itens equipados (com quantidade > 0), por alvo. */
export function bonusEquipados(itens: Item[], uso: Uso): Record<string, number> {
  const out: Record<string, number> = {}
  for (const it of itens) {
    const u = uso.itens[it.id]
    if (!u?.equipado || u.qtd <= 0) continue
    for (const b of it.bonus) out[b.alvo] = (out[b.alvo] ?? 0) + b.valor
  }
  return out
}
export const pesoTotal = (itens: Item[], uso: Uso) => Math.round(itens.reduce((t, it) => t + it.peso * (uso.itens[it.id]?.qtd ?? 1), 0) * 1000) / 1000

const emKg = (unidade: string) => /^(kg|quilo)/i.test(unidade.trim())
/**
 * Peso digitado (v0.33.8): aceita vírgula (“0,25”), gramas (“250 g”, “250g”) e quilos (“1,5 kg”) quando o sistema
 * conta em kg; até milésimos. null = não entendeu.
 */
export function lerPeso(texto: string, unidade = 'kg'): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(g|gr|gramas?|kg|quilos?)?\s*$/i.exec(texto)
  if (!m) return texto.trim() === '' ? 0 : null
  let n = Number(m[1].replace(',', '.'))
  if (m[2] && /^g/i.test(m[2]) && emKg(unidade)) n /= 1000
  return Number.isFinite(n) ? Math.round(Math.min(100000, n) * 1000) / 1000 : null
}
/** Peso para mostrar: em kg, menos de 1 kg aparece em gramas (“250 g”). */
export function mostrarPeso(peso: number, unidade = 'kg'): string {
  if (emKg(unidade) && peso > 0 && peso < 1) return `${Math.round(peso * 1000)} g`
  return `${peso.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unidade}`
}

/** Quantos usos/recurso um poder ainda tem. */
export function podeUsar(p: Poder, uso: Uso, recursoAtual?: number): { ok: boolean; motivo?: string } {
  if (p.usosMax && (uso.poderes[p.id] ?? 0) >= p.usosMax) return { ok: false, motivo: 'Sem usos restantes.' }
  if (p.recurso && (p.custo ?? 0) > 0 && (recursoAtual ?? 0) < (p.custo ?? 0)) return { ok: false, motivo: 'Recurso insuficiente.' }
  return { ok: true }
}

/** Mesmo item “de verdade” (para empilhar na hora de receber). */
const mesmoItem = (a: Item, b: Item) => a.nome.trim().toLowerCase() === b.nome.trim().toLowerCase() && a.categoria === b.categoria
  && (a.dano ?? '') === (b.dano ?? '') && (a.raridade ?? '') === (b.raridade ?? '') && (a.armaDnd ?? '') === (b.armaDnd ?? '') && (a.armaRefDnd ?? '') === (b.armaRefDnd ?? '') && (a.iconeBiblioteca ?? '') === (b.iconeBiblioteca ?? '') && (a.bonusArma ?? 0) === (b.bonusArma ?? 0) && JSON.stringify(a.bonus) === JSON.stringify(b.bonus)

export type ComItens = { itens?: unknown[]; uso?: unknown }
/**
 * Passa `quantidade` de um item da ficha `de` para a ficha `para` (v0.32).
 * Tirar tudo remove o item de quem deu; quem recebe empilha se já tiver o mesmo item, senão ganha uma cópia (desequipada).
 */
export function transferirItem<T extends ComItens>(de: T, para: T, itemId: string, quantidade: number):
  { ok: true; de: T; para: T; item: Item; qtd: number } | { ok: false; erro: string } {
  const itensDe = lerItens(de.itens), usoDe = lerUso(de.uso)
  const item = itensDe.find(i => i.id === itemId)
  if (!item) return { ok: false, erro: 'Esse item não está mais na ficha.' }
  const tem = usoDe.itens[item.id]?.qtd ?? 1
  if (tem <= 0) return { ok: false, erro: 'A quantidade desse item é 0.' }
  const qtd = Math.floor(Number(quantidade))
  if (!Number.isFinite(qtd) || qtd < 1) return { ok: false, erro: 'Quantidade inválida.' }
  if (qtd > tem) return { ok: false, erro: `Só há ${tem} desse item.` }

  const itensPara = lerItens(para.itens), usoPara = lerUso(para.uso)
  const igual = itensPara.find(i => mesmoItem(i, item))
  if (!igual && itensPara.length >= LIM.itens) return { ok: false, erro: 'O inventário de quem recebe está cheio.' }

  let novoDe: T
  if (qtd === tem) {
    const { [item.id]: _, ...resto } = usoDe.itens; void _
    novoDe = { ...de, itens: itensDe.filter(i => i.id !== item.id), uso: { ...usoDe, itens: resto } }
  } else novoDe = { ...de, uso: { ...usoDe, itens: { ...usoDe.itens, [item.id]: { qtd: tem - qtd, equipado: usoDe.itens[item.id]?.equipado ?? false } } } }

  let novoPara: T
  if (igual) {
    const u = usoPara.itens[igual.id] ?? { qtd: 1, equipado: false }
    novoPara = { ...para, uso: { ...usoPara, itens: { ...usoPara.itens, [igual.id]: { ...u, qtd: u.qtd + qtd } } } }
  } else {
    let idNovo = item.id
    while (itensPara.some(i => i.id === idNovo)) idNovo = Math.random().toString(36).slice(2, 12)
    novoPara = { ...para, itens: [...itensPara, { ...item, id: idNovo }], uso: { ...usoPara, itens: { ...usoPara.itens, [idNovo]: { qtd, equipado: false } } } }
  }
  return { ok: true, de: novoDe, para: novoPara, item, qtd }
}

/** Uma ação rápida da ficha (v0.35.3): item equipado ou poder, com os botões de rolagem. */
export type AcaoRapida = { id: string; nome: string; item?: Item; rolagens: RolagemItem[] }
/** Itens equipados com dano ou rolagens prontas e poderes com dados, nessa ordem. */
export function acoesRapidas(d: { itens?: unknown; poderes?: unknown; uso?: unknown }): AcaoRapida[] {
  const uso = lerUso(d.uso)
  const itens = lerItens(d.itens).filter(it => uso.itens[it.id]?.equipado && (uso.itens[it.id]?.qtd ?? 1) > 0).flatMap(it => {
    const rolagens = [...(it.dano ? [{ nome: it.categoria === 'arma' ? 'Dano' : 'Rolar', expr: it.dano }] : []), ...(it.rolagens ?? [])]
    return rolagens.length ? [{ id: 'i-' + it.id, nome: it.nome, item: it, rolagens }] : []
  })
  const poderes = lerPoderes(d.poderes).flatMap(p => p.expressao ? [{ id: 'p-' + p.id, nome: p.nome, rolagens: [{ nome: 'Rolar', expr: p.expressao }] }] : [])
  return [...itens, ...poderes].slice(0, 24)
}
