/**
 * Inventário e poderes estruturados das fichas (todos os sistemas genéricos).
 * - `itens` e `poderes` ficam na ficha (área “Armas e equipamentos” / “Habilidades” das permissões).
 * - `uso` guarda o que muda durante o jogo (quantidade, equipado, usos gastos, carteira):
 *   fica na área “PV e recursos”, que normalmente é livre para o jogador.
 * Funções puras, testadas em inventario.test.ts.
 */
import type { Sistema } from './tipos'

export type CategoriaItem = 'arma' | 'armadura' | 'consumivel' | 'equipamento' | 'tesouro' | 'outro'
export type TipoPoder = 'magia' | 'habilidade' | 'talento' | 'tecnica' | 'outro'
/** Bônus de um item equipado: soma `valor` no alvo (ex.: 'derivado:ca', 'atributo:FOR', 'pericia:furtividade', 'recurso:pv'). */
export type Bonus = { alvo: string; valor: number }
export type Item = { id: string; nome: string; categoria: CategoriaItem; peso: number; dano?: string; bonus: Bonus[]; descricao?: string }
export type Poder = { id: string; nome: string; tipo: TipoPoder; recurso?: string; custo?: number; usosMax?: number; expressao?: string; descricao?: string }
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
const EXPR = /^[0-9dkhl!+\- ]{0,40}$/i

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
  return { id: id(o.id), nome, categoria, peso: num(o.peso, 0, 100000), ...(dano && EXPR.test(dano) ? { dano } : {}), bonus, ...(o.descricao ? { descricao: txt(o.descricao, LIM.texto) } : {}) }
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
    ...(recurso ? { recurso, custo: num(o.custo, 0, 999, 1) } : {}),
    ...(Number(o.usosMax) > 0 ? { usosMax: num(o.usosMax, 1, 99) } : {}),
    ...(expressao && EXPR.test(expressao) ? { expressao } : {}),
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
export const pesoTotal = (itens: Item[], uso: Uso) => Math.round(itens.reduce((t, it) => t + it.peso * (uso.itens[it.id]?.qtd ?? 1), 0) * 100) / 100

/** Quantos usos/recurso um poder ainda tem. */
export function podeUsar(p: Poder, uso: Uso, recursoAtual?: number): { ok: boolean; motivo?: string } {
  if (p.usosMax && (uso.poderes[p.id] ?? 0) >= p.usosMax) return { ok: false, motivo: 'Sem usos restantes.' }
  if (p.recurso && (p.custo ?? 0) > 0 && (recursoAtual ?? 0) < (p.custo ?? 0)) return { ok: false, motivo: 'Recurso insuficiente.' }
  return { ok: true }
}
