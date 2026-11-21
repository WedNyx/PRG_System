/**
 * Graus de dado, tabelas roláveis e regras escritas pelo autor (v0.35.6). Tudo puro, testado em graus.test.ts.
 * Graus: atributos e perícias valem um dado (o número guardado é o de lados); 0 = não tem e rola o dado `zero`.
 */
import type { CapituloRegra, GrausDef, Sistema, TabelaDef } from './tipos'

export const GRAUS_PADRAO: GrausDef = { lados: [4, 6, 8, 10, 12], zero: 4 }
const LADOS_OK = (n: number) => Number.isInteger(n) && n >= 2 && n <= 100

/** Limpa a definição dos graus que veio do construtor. */
export function lerGraus(v: unknown): GrausDef {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const lados = [...new Set((Array.isArray(o.lados) ? o.lados : []).map(Number).filter(LADOS_OK))].sort((a, b) => a - b).slice(0, 12)
  const zero = Number(o.zero), maxPericia = Number(o.maxPericia)
  return { lados: lados.length ? lados : GRAUS_PADRAO.lados, ...(LADOS_OK(zero) ? { zero } : {}), ...(LADOS_OK(maxPericia) ? { maxPericia } : {}) }
}
/** Valores que um atributo/perícia pode ter: 0 (se o sistema deixa) e os lados. */
export function opcoesDeGrau(g: GrausDef, max?: number): number[] {
  return [...(g.zero ? [0] : []), ...g.lados.filter(l => max === undefined || l <= max)]
}
/** O grau mais próximo que existe (para valores antigos ou digitados fora da lista). */
export function grauValido(v: unknown, g: GrausDef, max?: number): number {
  const ops = opcoesDeGrau(g, max), n = Number(v) || 0
  return ops.reduce((m, o) => Math.abs(o - n) < Math.abs(m - n) ? o : m, ops[0] ?? 0)
}
/** Dado que rola com esse grau (0 → o dado do zero; sem dado → null). */
export const dadoDoGrau = (v: number, g: GrausDef): number | null => v > 0 ? v : g.zero ?? null
export const rotuloGrau = (v: number, g: GrausDef) => v > 0 ? 'd' + v : g.zero ? `0 (d${g.zero})` : '—'

/** Expressão de um teste: o dado do atributo, o dado da perícia (se tiver) e o bônus. */
export function expressaoGraus(atributo: number | null, pericia: number | null, bonus: number, g: GrausDef): string | null {
  const dados = [atributo, pericia].flatMap(v => v === null ? [] : [dadoDoGrau(v, g)]).filter((x): x is number => !!x)
  if (!dados.length) return null
  return dados.map(l => '1d' + l).join('+') + (bonus ? (bonus > 0 ? '+' : '') + bonus : '')
}

/** Tabelas roláveis: dado válido, linhas ordenadas e textos curtos. */
export function lerTabelas(v: unknown, idsCampos: Set<string>): TabelaDef[] {
  const usados = new Set<string>()
  return (Array.isArray(v) ? v : []).slice(0, 10).flatMap((x): TabelaDef[] => {
    const o = x && typeof x === 'object' ? x as Record<string, unknown> : {}
    const nome = typeof o.nome === 'string' ? o.nome.trim().slice(0, 60) : ''
    const dado = typeof o.dado === 'string' && /^\d{1,2}d\d{1,3}$/i.test(o.dado.trim()) ? o.dado.trim().toLowerCase() : ''
    if (!nome || !dado) return []
    const linhas = (Array.isArray(o.linhas) ? o.linhas : []).slice(0, 100).flatMap(l => {
      const r = l && typeof l === 'object' ? l as Record<string, unknown> : {}
      const de = Math.round(Number(r.de)), ate = Math.round(Number(r.ate ?? r.de)), texto = typeof r.texto === 'string' ? r.texto.trim().slice(0, 400) : ''
      return Number.isFinite(de) && Number.isFinite(ate) && texto ? [{ de: Math.min(de, ate), ate: Math.max(de, ate), texto }] : []
    }).sort((a, b) => a.de - b.de)
    if (!linhas.length) return []
    let id = typeof o.id === 'string' && /^[a-z][a-z0-9_]{0,24}$/.test(o.id) ? o.id : nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20) || 'tabela'
    if (!/^[a-z]/.test(id)) id = 't_' + id
    while (usados.has(id)) id += '_2'
    usados.add(id)
    const campo = typeof o.campo === 'string' && idsCampos.has(o.campo) ? o.campo : ''
    return [{ id, nome, dado, linhas, ...(campo ? { campo } : {}) }]
  })
}
/** Linha da tabela para um resultado. */
export const linhaDaTabela = (t: TabelaDef, total: number) => t.linhas.find(l => total >= l.de && total <= l.ate) ?? null

export function lerRegras(v: unknown): CapituloRegra[] {
  return (Array.isArray(v) ? v : []).slice(0, 30).flatMap(x => {
    const o = x && typeof x === 'object' ? x as Record<string, unknown> : {}
    const titulo = typeof o.titulo === 'string' ? o.titulo.trim().slice(0, 80) : '', texto = typeof o.texto === 'string' ? o.texto.trim().slice(0, 6000) : ''
    return titulo || texto ? [{ titulo: titulo || 'Regras', texto }] : []
  })
}
const SECOES = ['principal', 'atributos', 'habilidades', 'equipamentos', 'anotacoes', 'marcas', 'formas', 'invocacoes', 'efeitos'] as const
export function lerNomesSecoes(v: unknown): Sistema['nomesSecoes'] {
  const o = v && typeof v === 'object' ? v as Record<string, unknown> : {}
  const out = Object.fromEntries(SECOES.flatMap(k => typeof o[k] === 'string' && (o[k] as string).trim() ? [[k, (o[k] as string).trim().slice(0, 40)]] : []))
  return Object.keys(out).length ? out : undefined
}
/** Perícias criadas pelo jogador: nome curto e id próprio (x_…). */
export function lerPericiasExtras(v: unknown): { id: string; nome: string }[] {
  const vistos = new Set<string>()
  return (Array.isArray(v) ? v : []).slice(0, 40).flatMap(x => {
    const o = x && typeof x === 'object' ? x as Record<string, unknown> : {}
    const id = typeof o.id === 'string' && /^x_[a-z0-9]{4,16}$/.test(o.id) ? o.id : '', nome = typeof o.nome === 'string' ? o.nome.trim().slice(0, 60) : ''
    if (!id || !nome || vistos.has(id)) return []
    vistos.add(id); return [{ id, nome }]
  })
}

/** Marcações da ficha (v0.35.9): chaves curtas e valores simples (sim/não, número ou texto curto). */
export function lerMarcas(v: unknown): Record<string, boolean | number | string> {
  const o = v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {}
  return Object.fromEntries(Object.entries(o).slice(0, 300).flatMap(([k, x]): [string, boolean | number | string][] => {
    if (!/^[a-z0-9_:-]{1,40}$/i.test(k)) return []
    if (typeof x === 'boolean') return x ? [[k, true]] : []
    if (typeof x === 'number' && Number.isFinite(x)) return [[k, Math.max(-9999, Math.min(9999, Math.round(x)))]]
    if (typeof x === 'string') return x.trim() ? [[k, x.slice(0, 200)]] : []
    return []
  }))
}
