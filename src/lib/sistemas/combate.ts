/**
 * Combate na mesa: lê de uma ficha o que importa para lutar (vida, defesa, armas, poderes, bônus de teste)
 * e decide a rolagem de ataque conforme o sistema. Funções puras (testadas em combate.test.ts),
 * usadas no servidor (rota da mesa) e na tela (aba Fichas e janela de ataque).
 */
import { calcular, normalizarFicha } from './calculo'
import { lerItens, lerPoderes } from './inventario'
import { montarRolagem, rolarExpressao } from '../dice'
import type { DadosFicha, Sistema } from './tipos'

export const METROS_POR_CELULA = 1.5
export const ALCANCE_CORPO = 1.5

export type OpcaoAtaque = { tipo: 'item' | 'poder'; id: string; nome: string; dano: string; alcance: number; recurso?: string; custo?: number; categoria?: string; arte?: unknown; raridade?: string; imagem?: string; magico?: boolean }
/** `dados`: nos sistemas de parada (Ordem Paranormal, Blades), quantos dados o teste rola (o valor do atributo). */
export type Teste = { id: string; nome: string; valor: number; dados?: number }
export type ResumoCombate = {
  vida: { id: string; nome: string; atual: number; max: number | null } | null
  defesa: { nome: string; valor: number } | null
  ataques: OpcaoAtaque[]
  testes: Teste[]
  /** Teste sugerido para atacar (perícia de luta/pontaria, ou o melhor atributo). */
  testePadrao: string | null
  /** Bônus de iniciativa (campo/valor/perícia “Iniciativa”, ou Destreza/Agilidade/Reflexos). */
  iniciativa: number
  /** Sistemas de parada: quantos dados a iniciativa rola. */
  iniciativaDados?: number
  recursos: { id: string; nome: string; atual: number; max: number | null }[]
}

const ATAQUE = /luta|briga|corpo|combate|ataque|armas|pontaria|tiro|arco|arremess|atletismo|esgrima|lamina|fuzil/i

export function resumoCombate(s: Sistema, bruto: unknown): ResumoCombate {
  const d: DadosFicha = normalizarFicha(s, bruto as Partial<DadosFicha>)
  const c = calcular(s, d)
  const maxDe = (id: string) => c.recursosMax[id] ?? (d.recursos[id]?.max !== undefined ? Number(d.recursos[id]?.max) : null)
    ?? (/^(pv|vida|hp)/.test(id) ? (c.derivados.pv_max ?? c.derivados.pv_sugerido ?? null) : null)
  const recursos = s.recursos.map(r => ({ id: r.id, nome: r.nome, atual: Number(d.recursos[r.id]?.atual ?? 0) || 0, max: maxDe(r.id) }))
  const vidaDef = s.recursos.find(r => /^(pv|vida|hp|pontos_de_vida)$/i.test(r.id)) ?? s.recursos.find(r => /^(pv|vida|hp)/i.test(r.id)) ?? s.recursos[0]
  const vida = vidaDef ? recursos.find(r => r.id === vidaDef.id)! : null

  let defesa: ResumoCombate['defesa'] = null
  const der = s.derivados.find(x => /^(ca|defesa|def|esquiva|aparar|defesa_passiva)$/i.test(x.id))
  if (der && typeof c.derivados[der.id] === 'number') defesa = { nome: der.nome.split(' (')[0], valor: c.derivados[der.id] as number }
  else {
    const campo = s.campos.find(x => x.tipo === 'numero' && /^(ca|defesa)$/i.test(x.id))
    if (campo && Number.isFinite(Number(d.campos[campo.id]))) defesa = { nome: campo.nome, valor: Number(d.campos[campo.id]) }
  }

  const ataques: OpcaoAtaque[] = [
    ...lerItens(d.itens).filter(i => i.dano).map(i => ({ tipo: 'item' as const, id: i.id, nome: i.nome, dano: i.dano!, alcance: i.alcance ?? ALCANCE_CORPO,
      categoria: i.categoria, ...(i.arte ? { arte: i.arte } : {}), ...(i.raridade ? { raridade: i.raridade } : {}), ...(i.imagem ? { imagem: i.imagem } : {}), ...(i.magico ? { magico: true } : {}) })),
    ...lerPoderes(d.poderes).filter(p => p.expressao).map(p => ({ tipo: 'poder' as const, id: p.id, nome: p.nome, dano: p.expressao!, alcance: p.alcance ?? ALCANCE_CORPO,
      ...(p.recurso ? { recurso: p.recurso, custo: p.custo ?? 0 } : {}) })),
  ]

  const parada = s.rolagem === 'parada'
  const testes: Teste[] = [
    ...(s.pericias?.lista ?? []).map(p => parada && !p.atributo
      // Parada sem atributo (Blades): o próprio valor da ação é a quantidade de dados.
      ? { id: 'pericia:' + p.id, nome: p.nome, valor: 0, dados: Number(c.pericias[p.id] ?? 0) || 0 }
      : { id: 'pericia:' + p.id, nome: p.nome, valor: Number(c.pericias[p.id] ?? 0) || 0, ...(parada ? { dados: dadosDaPericia(s, c.vars, p.atributo) } : {}) }),
    ...s.atributos.map(a => parada ? { id: 'atributo:' + a.id, nome: a.nome, valor: 0, dados: Number(c.vars[a.id]) || 0 } : { id: 'atributo:' + a.id, nome: a.nome, valor: Number(s.formulaModificador ? c.mods[a.id] : c.vars[a.id]) || 0 }),
  ]
  // Sugestão: o maior entre as perícias de luta/pontaria e os atributos (empate: a perícia).
  const candidatos = testes.filter(t => !t.id.startsWith('pericia:') || ATAQUE.test(t.nome))
  const forca = (t: Teste) => parada ? (t.dados ?? 0) * 100 + t.valor : t.valor
  const melhor = candidatos.sort((a, b) => forca(b) - forca(a) || (a.id.startsWith('pericia:') ? -1 : 1))[0]
  // Iniciativa: algo chamado “iniciativa” na ficha; senão o atributo de agilidade.
  let iniciativa = 0, iniciativaDados: number | undefined
  const derIni = s.derivados.find(x => /iniciativa/i.test(x.id + x.nome)), perIni = (s.pericias?.lista ?? []).find(x => /iniciativa/i.test(x.id + x.nome))
  const campoIni = s.campos.find(x => x.tipo === 'numero' && /iniciativa/i.test(x.id + x.nome))
  const atrIni = s.atributos.find(x => /^(DES|DEX|AGI|REF)/i.test(x.id) || /destreza|agilidade|reflexo/i.test(x.nome))
  if (derIni && typeof c.derivados[derIni.id] === 'number') iniciativa = c.derivados[derIni.id] as number
  else if (perIni) { iniciativa = Number(c.pericias[perIni.id] ?? 0) || 0; if (parada) iniciativaDados = dadosDaPericia(s, c.vars, perIni.atributo) }
  else if (campoIni) iniciativa = Number(d.campos[campoIni.id]) || 0
  else if (atrIni) iniciativa = testes.find(t => t.id === 'atributo:' + atrIni.id)?.valor ?? 0
  return { vida, defesa, ataques, testes, testePadrao: melhor?.id ?? null, recursos, iniciativa, ...(iniciativaDados !== undefined ? { iniciativaDados } : {}) }
}

/** Parada: o maior valor entre os atributos da perícia (ex.: 'FOR/AGI'). */
function dadosDaPericia(s: Sistema, vars: Record<string, number>, atributo?: string) {
  return Math.max(0, ...(atributo ? atributo.split('/') : []).map(a => Number(vars[a]) || 0))
}
/** Parada de dados: N dados ficando com o maior; com 0 dados, rola 2 e fica com o menor. Soma o bônus. */
export function expressaoParada(lados: number, dados: number, bonus = 0) {
  const n = Math.max(0, Math.min(20, Math.floor(dados))), b = Math.round(bonus) || 0
  return (n > 0 ? `${n}d${lados}kh1` : `2d${lados}kl1`) + (b ? (b > 0 ? '+' + b : String(b)) : '')
}

/**
 * Leitura do resultado de uma parada (Blades in the Dark). `resultados` = todos os dados rolados.
 * Ação: 6 = sucesso total, 4–5 = sucesso com custo, 1–3 = falha, dois 6 = crítico (com 0 dados, vale o menor).
 * Resistência: o estresse custa 6 − o maior dado; crítico recupera 1 de estresse.
 */
export function leituraBlades(dados: number, resultados: number[], resistencia = false): string {
  if (!resultados.length) return ''
  const valor = dados > 0 ? Math.max(...resultados) : Math.min(...resultados)
  const critico = dados > 0 && resultados.filter(r => r === 6).length >= 2
  if (resistencia) return critico ? '✨ Crítico: recupera 1 de estresse' : `Custa ${6 - valor} de estresse`
  return critico ? '✨ Crítico! Efeito maior' : valor === 6 ? '✅ Sucesso total' : valor >= 4 ? '⚖️ Sucesso com custo' : '❌ Falha (com consequência)'
}

/** Leitura do d100 (BRP): crítico (1/20 do valor), especial (1/5), sucesso, falha e desastre (os 5% de cima da falha). */
export function leituraD100(valor: number, rolado: number): string {
  const v = Math.max(0, valor)
  const critico = Math.max(1, Math.round(v / 20)), especial = Math.max(1, Math.round(v / 5))
  const desastre = 100 - Math.max(0, Math.round((100 - Math.min(100, v)) / 20)) + 1
  if (rolado <= critico) return '🌟 Sucesso crítico!'
  if (rolado <= especial) return '✨ Sucesso especial'
  if ((rolado <= v || rolado <= 5) && rolado < 96) return '✅ Sucesso'
  if (rolado >= Math.min(100, desastre)) return '💀 Desastre'
  return '❌ Falha'
}

export type RegraAtaque = { expressao: string; comparar: 'maior_igual' | 'menor_igual' | 'sucessos' }
/** Como rolar o ataque neste sistema, com o bônus do teste escolhido. */
export function regraDeAtaque(s: Sistema | undefined, bonus: number, dados?: number): RegraAtaque {
  const b = Math.round(bonus) || 0
  if (s?.rolagem === 'parada') return { expressao: expressaoParada(s.parada?.lados ?? 20, dados ?? 1, b), comparar: 'maior_igual' }
  if (s?.rolagem === 'personalizada' && s.regraRolagem) {
    const expressao = montarRolagem(s.regraRolagem.formula, b)
    return { expressao, comparar: /s\d/.test(expressao) ? 'sucessos' : 'maior_igual' }
  }
  if (s && (s.rolagem === 'd100' || s.id === 'brp')) return { expressao: '1d100', comparar: 'menor_igual' }
  return { expressao: '1d20' + (b >= 0 ? '+' + b : String(b)), comparar: 'maior_igual' }
}

/** Acertou? d20: total ≥ defesa. d100: total ≤ valor do teste. Sucessos: pelo menos 1 (ou a defesa, se for maior). */
export function acertou(regra: RegraAtaque, total: number, defesa: number, bonus: number): boolean {
  if (regra.comparar === 'menor_igual') return total <= bonus
  if (regra.comparar === 'sucessos') return total >= Math.max(1, defesa)
  return total >= defesa
}

/** Distância em metros entre duas casas (igual à régua da mesa: a diagonal conta como 1 casa). */
export const distancia = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * METROS_POR_CELULA

/** Dano: rola a expressão (sem dano negativo). */
export function rolarDano(expressao: string) {
  const r = rolarExpressao(expressao)
  return r ? { ...r, total: Math.max(0, r.total) } : null
}

/** Aplica dano (ou cura, se negativo) no recurso de vida da ficha. Não passa do máximo nem fica abaixo de 0. */
export function aplicarNaVida(d: Record<string, unknown>, vidaId: string, dano: number, max: number | null): Record<string, unknown> {
  const recursos = { ...((d.recursos as Record<string, { atual: number; max?: number }>) ?? {}) }
  const atual = Number(recursos[vidaId]?.atual ?? 0) || 0
  let novo = Math.max(0, atual - dano)
  if (max !== null && max !== undefined) novo = Math.min(novo, Math.max(max, atual))
  recursos[vidaId] = { ...(recursos[vidaId] ?? {}), atual: novo }
  return { ...d, recursos }
}
/** Gasta o custo de um poder (recurso e uso). */
export function gastarCusto(d: Record<string, unknown>, recurso: string, custo: number): Record<string, unknown> | null {
  const recursos = { ...((d.recursos as Record<string, { atual: number; max?: number }>) ?? {}) }
  const atual = Number(recursos[recurso]?.atual ?? 0) || 0
  if (atual < custo) return null
  recursos[recurso] = { ...(recursos[recurso] ?? {}), atual: atual - custo }
  return { ...d, recursos }
}

/** Rolagem de iniciativa no sistema: d20 + bônus (regra própria nos sistemas personalizados). Maior começa. */
export function regraDeIniciativa(s: Sistema | undefined, bonus: number, dados?: number): string {
  const b = Math.round(bonus) || 0
  if (s?.rolagem === 'parada') return expressaoParada(s.parada?.lados ?? 20, dados ?? 1, b)
  if (s?.rolagem === 'personalizada' && s.regraRolagem) return montarRolagem(s.regraRolagem.formula, b)
  if (s && (s.rolagem === 'd100' || s.id === 'brp')) return '1d100'
  return '1d20' + (b >= 0 ? '+' + b : String(b))
}

export type EntradaOrdem = { tokenId: string; nome: string; valor: number; bonus: number; dados: number[] }
/** Ordena a iniciativa: maior valor primeiro; empate → maior bônus; depois sorteio. */
export function ordenarIniciativa(l: EntradaOrdem[], sorteio: () => number = Math.random): EntradaOrdem[] {
  return l.map(e => ({ e, r: sorteio() })).sort((a, b) => b.e.valor - a.e.valor || b.e.bonus - a.e.bonus || a.r - b.r).map(x => x.e)
}
