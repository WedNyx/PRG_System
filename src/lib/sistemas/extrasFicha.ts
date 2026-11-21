/**
 * Partes extras da ficha (v0.36.0), ligadas pelo autor no construtor (`Sistema.extras`):
 * - Marcas: poderes que sobem de nível (cada nível libera uma habilidade), separados do nível do personagem.
 * - Transformações: formas com vida, essência, atributos e golpes próprios; a ficha base fica guardada.
 * - Invocações: criaturas com vida, golpes e duração.
 * - Efeitos e condições: o que está valendo e por quantos turnos.
 * Nada aqui calcula regra. O jogador toca em “Usar”, “Transformar” ou “Invocar” e a ficha só marca o uso e tira o custo
 * que ele mesmo escreveu. O que é definição (as marcas, as formas…) fica em campos próprios da ficha; o que muda no jogo
 * (vida da forma, usos gastos, forma ativa…) fica em `marcas`, junto das outras marcações. Funções puras, testadas.
 */
import type { DadosFicha, Sistema } from './tipos'

export type ExtraFicha = 'marcas' | 'formas' | 'invocacoes' | 'efeitos'
export const EXTRAS: { id: ExtraFicha; nome: string; icone: string; descricao: string }[] = [
  { id: 'marcas', nome: 'Marcas', icone: '🐾', descricao: 'Poderes com níveis próprios: cada nível libera uma habilidade, com custo, dado e usos por combate.' },
  { id: 'formas', nome: 'Transformações', icone: '🐺', descricao: 'Formas com vida, essência, atributos e golpes próprios. A ficha normal fica guardada.' },
  { id: 'invocacoes', nome: 'Invocações', icone: '🐻', descricao: 'Criaturas chamadas pelo personagem, com vida, golpes e duração.' },
  { id: 'efeitos', nome: 'Efeitos e condições', icone: '⏳', descricao: 'Condições e efeitos com contagem de turnos.' },
]
export const lerExtras = (v: unknown): ExtraFicha[] => {
  const ids = new Set(EXTRAS.map(e => e.id))
  return EXTRAS.map(e => e.id).filter(id => Array.isArray(v) && v.includes(id) && ids.has(id))
}
export const temExtra = (s: Sistema, x: ExtraFicha) => !!s.extras?.includes(x)

/** Golpe, habilidade ou poder com rolagem: tudo opcional menos o nome. */
export type Golpe = { id: string; nome: string; expressao?: string; custo?: number; usosMax?: number; texto?: string }
export type HabilidadeMarca = Golpe & { nivel: number }
export type MarcaPersonagem = { id: string; nome: string; nivel: number; texto?: string; habilidades: HabilidadeMarca[] }
export type Forma = { id: string; nome: string; custo?: number; requisito?: string; vidaMax?: number; essenciaMax?: number
  atributos: Record<string, number>; deslocamento?: string; pericias?: string; golpes: Golpe[]; texto?: string }
export type Invocacao = { id: string; nome: string; custo?: number; vidaMax?: number; duracao?: number; golpes: Golpe[]; texto?: string }
export type Efeito = { id: string; nome: string; alvo?: string; turnos?: number; texto?: string }

const LIM = { marcas: 12, habilidades: 20, formas: 8, invocacoes: 12, golpes: 12, efeitos: 40, texto: 1500 }
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {})
const txt = (v: unknown, max: number) => typeof v === 'string' ? v.slice(0, max).trim() : ''
const inteiro = (v: unknown, min: number, max: number) => { if (v === '' || v === null || v === undefined) return undefined; const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : undefined }
const EXPR = /^\s*(?:\d{1,3}d\d{1,4}|\d{1,6})(?:\s*[+-]\s*(?:\d{1,3}d\d{1,4}|\d{1,6}))*\s*$/i
/** Expressão de dados simples (1d20+1d6, 4d8, 2d6+3). */
export const expressaoValida = (e?: string) => !!e && EXPR.test(e)
export const novoId = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0')
const idOk = (v: unknown, usados: Set<string>) => {
  let id = typeof v === 'string' && /^[a-z0-9]{1,12}$/.test(v) ? v : novoId()
  while (usados.has(id)) id = novoId()
  usados.add(id); return id
}
const opcional = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>

function lerGolpe(v: unknown, usados: Set<string>): Golpe | null {
  const o = obj(v), nome = txt(o.nome, 80); if (!nome) return null
  const expressao = txt(o.expressao, 40)
  return { id: idOk(o.id, usados), nome, ...opcional({ expressao: expressao || undefined, custo: inteiro(o.custo, 0, 999) || undefined,
    usosMax: inteiro(o.usosMax, 0, 99) || undefined, texto: txt(o.texto, LIM.texto) || undefined }) }
}
const lerGolpes = (v: unknown, usados: Set<string>) => (Array.isArray(v) ? v : []).slice(0, LIM.golpes).map(g => lerGolpe(g, usados)).filter((g): g is Golpe => !!g)

/** Os ids de golpes são únicos na ficha inteira (o contador de usos é `u_<id>`). */
export function lerExtrasDaFicha(d: Partial<DadosFicha>) {
  const usados = new Set<string>()
  const out: Pick<DadosFicha, 'marcasPoder' | 'formas' | 'invocacoes' | 'efeitos'> = {}
  if (d.marcasPoder !== undefined) out.marcasPoder = (Array.isArray(d.marcasPoder) ? d.marcasPoder : []).slice(0, LIM.marcas).flatMap(v => {
    const o = obj(v), nome = txt(o.nome, 80); if (!nome) return []
    const habilidades = (Array.isArray(o.habilidades) ? o.habilidades : []).slice(0, LIM.habilidades).flatMap(h => {
      const g = lerGolpe(h, usados); return g ? [{ ...g, nivel: inteiro(obj(h).nivel, 0, 99) ?? 1 }] : []
    }).sort((a, b) => a.nivel - b.nivel)
    return [{ id: idOk(o.id, usados), nome, nivel: inteiro(o.nivel, 0, 99) ?? 1, ...opcional({ texto: txt(o.texto, LIM.texto) || undefined }), habilidades }]
  })
  if (d.formas !== undefined) out.formas = (Array.isArray(d.formas) ? d.formas : []).slice(0, LIM.formas).flatMap(v => {
    const o = obj(v), nome = txt(o.nome, 80); if (!nome) return []
    const atributos: Record<string, number> = {}
    for (const [k, n] of Object.entries(obj(o.atributos)).slice(0, 20)) { const x = inteiro(n, -999, 999); if (/^[A-Za-z0-9_]{1,24}$/.test(k) && x !== undefined) atributos[k] = x }
    return [{ id: idOk(o.id, usados), nome, atributos, golpes: lerGolpes(o.golpes, usados), ...opcional({
      custo: inteiro(o.custo, 0, 999) || undefined, requisito: txt(o.requisito, 80) || undefined, vidaMax: inteiro(o.vidaMax, 0, 99999),
      essenciaMax: inteiro(o.essenciaMax, 0, 99999), deslocamento: txt(o.deslocamento, 60) || undefined, pericias: txt(o.pericias, 300) || undefined,
      texto: txt(o.texto, LIM.texto) || undefined }) }]
  })
  if (d.invocacoes !== undefined) out.invocacoes = (Array.isArray(d.invocacoes) ? d.invocacoes : []).slice(0, LIM.invocacoes).flatMap(v => {
    const o = obj(v), nome = txt(o.nome, 80); if (!nome) return []
    return [{ id: idOk(o.id, usados), nome, golpes: lerGolpes(o.golpes, usados), ...opcional({ custo: inteiro(o.custo, 0, 999) || undefined,
      vidaMax: inteiro(o.vidaMax, 0, 99999), duracao: inteiro(o.duracao, 0, 999) || undefined, texto: txt(o.texto, LIM.texto) || undefined }) }]
  })
  if (d.efeitos !== undefined) out.efeitos = (Array.isArray(d.efeitos) ? d.efeitos : []).slice(0, LIM.efeitos).flatMap(v => {
    const o = obj(v), nome = txt(o.nome, 80); if (!nome) return []
    return [{ id: idOk(o.id, usados), nome, ...opcional({ alvo: txt(o.alvo, 60) || undefined, turnos: inteiro(o.turnos, 0, 999), texto: txt(o.texto, 400) || undefined }) }]
  })
  return out
}

// ---- Estado de jogo (em `marcas`) ----
type M = NonNullable<DadosFicha['marcas']>
const numM = (m: M | undefined, k: string) => { const v = m?.[k]; return typeof v === 'number' ? v : undefined }
export const chave = {
  uso: (id: string) => 'u_' + id, formaAtiva: 'forma_ativa',
  vidaForma: (id: string) => 'fv_' + id, peForma: (id: string) => 'fe_' + id,
  invAtiva: (id: string) => 'ia_' + id, vidaInv: (id: string) => 'iv_' + id, turnosInv: (id: string) => 'it_' + id,
}
/** Grava marcações (null/false/'' apagam). */
export function comMarcas(d: DadosFicha, mud: Record<string, boolean | number | string | null>): DadosFicha {
  const m: M = { ...(d.marcas ?? {}) }
  for (const [k, v] of Object.entries(mud)) { if (v === null || v === false || v === '') delete m[k]; else m[k] = v }
  return { ...d, marcas: m }
}
export const usosGastos = (d: DadosFicha, g: Golpe) => numM(d.marcas, chave.uso(g.id)) ?? 0
export const formaAtiva = (d: DadosFicha) => { const id = d.marcas?.[chave.formaAtiva]; return typeof id === 'string' ? d.formas?.find(f => f.id === id) ?? null : null }

/** Recurso de onde sai o custo das habilidades: o primeiro cujo nome fala de essência, mana, PE ou MP. */
export function recursoDeCusto(s: Sistema): string | null {
  return s.recursos.find(r => /ess[eê]ncia|mana|\bP\.?E\b|\bM\.?P\b|energia/i.test(r.nome + ' ' + r.id))?.id ?? null
}
/** De onde sai o custo agora: da forma ativa (se ela tiver essência própria) ou do recurso da ficha. */
export function fonteDoCusto(s: Sistema, d: DadosFicha): { tipo: 'forma'; id: string; atual: number; max: number } | { tipo: 'recurso'; id: string; atual: number; max: number } | null {
  const f = formaAtiva(d)
  if (f && f.essenciaMax !== undefined) return { tipo: 'forma', id: f.id, atual: numM(d.marcas, chave.peForma(f.id)) ?? f.essenciaMax, max: f.essenciaMax }
  const r = recursoDeCusto(s); if (!r) return null
  return { tipo: 'recurso', id: r, atual: Number(d.recursos[r]?.atual) || 0, max: Number(d.recursos[r]?.max) || 0 }
}
function gastar(s: Sistema, d: DadosFicha, custo: number, daBase = false): DadosFicha | string {
  if (!custo) return d
  const f = daBase ? (() => { const r = recursoDeCusto(s); return r ? { tipo: 'recurso' as const, id: r, atual: Number(d.recursos[r]?.atual) || 0, max: 0 } : null })() : fonteDoCusto(s, d)
  if (!f) return d // sistema sem recurso de custo: o custo fica só escrito
  if (f.atual < custo) return `Essência insuficiente (${f.atual} de ${custo}).`
  if (f.tipo === 'forma') return comMarcas(d, { [chave.peForma(f.id)]: f.atual - custo })
  return { ...d, recursos: { ...d.recursos, [f.id]: { ...d.recursos[f.id], atual: f.atual - custo } } }
}
/** Tocar em “Usar”: confere usos e essência, marca 1 uso e tira o custo. Devolve a ficha nova ou o motivo. */
export function usarGolpe(s: Sistema, d: DadosFicha, g: Golpe): DadosFicha | string {
  const gastos = usosGastos(d, g)
  if (g.usosMax && gastos >= g.usosMax) return 'Sem usos neste combate.'
  const r = gastar(s, d, g.custo ?? 0); if (typeof r === 'string') return r
  return comMarcas(r, { [chave.uso(g.id)]: gastos + 1 })
}
/** Desfaz 1 uso (não devolve a essência: ajuste o recurso se precisar). */
export const desfazerUso = (d: DadosFicha, g: Golpe) => comMarcas(d, { [chave.uso(g.id)]: Math.max(0, usosGastos(d, g) - 1) || null })
/** Novo combate: zera os usos de tudo. */
export function novoCombate(d: DadosFicha): DadosFicha {
  const m = Object.fromEntries(Object.entries(d.marcas ?? {}).filter(([k]) => !k.startsWith('u_')))
  return { ...d, marcas: m }
}
/** Transformar: paga o custo com a essência da ficha normal e começa a forma cheia (se ainda não tinha valor). */
export function transformar(s: Sistema, d: DadosFicha, f: Forma): DadosFicha | string {
  const r = gastar(s, d, f.custo ?? 0, true); if (typeof r === 'string') return r
  return comMarcas(r, { [chave.formaAtiva]: f.id,
    ...(f.vidaMax !== undefined && numM(d.marcas, chave.vidaForma(f.id)) === undefined ? { [chave.vidaForma(f.id)]: f.vidaMax } : {}),
    ...(f.essenciaMax !== undefined && numM(d.marcas, chave.peForma(f.id)) === undefined ? { [chave.peForma(f.id)]: f.essenciaMax } : {}) })
}
export const voltarAoNormal = (d: DadosFicha) => comMarcas(d, { [chave.formaAtiva]: null })
/** Restaura vida e essência da forma ao máximo (descanso, nova cena…). */
export const restaurarForma = (d: DadosFicha, f: Forma) => comMarcas(d, { [chave.vidaForma(f.id)]: f.vidaMax ?? null, [chave.peForma(f.id)]: f.essenciaMax ?? null })

export const invocacaoAtiva = (d: DadosFicha, i: Invocacao) => d.marcas?.[chave.invAtiva(i.id)] === true
export const vidaInvocacao = (d: DadosFicha, i: Invocacao) => numM(d.marcas, chave.vidaInv(i.id)) ?? i.vidaMax ?? 0
export const turnosInvocacao = (d: DadosFicha, i: Invocacao) => numM(d.marcas, chave.turnosInv(i.id))
/** Invocar: paga o custo (da forma ativa ou da ficha), começa com a vida cheia e a duração escrita. */
export function invocar(s: Sistema, d: DadosFicha, i: Invocacao): DadosFicha | string {
  const r = gastar(s, d, i.custo ?? 0); if (typeof r === 'string') return r
  return comMarcas(r, { [chave.invAtiva(i.id)]: true, [chave.vidaInv(i.id)]: i.vidaMax ?? null, [chave.turnosInv(i.id)]: i.duracao ?? null })
}
export const dispensar = (d: DadosFicha, i: Invocacao) => comMarcas(d, { [chave.invAtiva(i.id)]: null, [chave.turnosInv(i.id)]: null })
/** Passa 1 turno: efeitos com contagem descem 1; invocações com duração descem 1 e vão embora no 0. */
export function passarTurno(d: DadosFicha): DadosFicha {
  let out: DadosFicha = d.efeitos ? { ...d, efeitos: d.efeitos.map(e => e.turnos === undefined ? e : { ...e, turnos: Math.max(0, e.turnos - 1) }) } : d
  for (const i of d.invocacoes ?? []) {
    const t = turnosInvocacao(out, i)
    if (!invocacaoAtiva(out, i) || t === undefined) continue
    out = t <= 1 ? dispensar(out, i) : comMarcas(out, { [chave.turnosInv(i.id)]: t - 1 })
  }
  return out
}
