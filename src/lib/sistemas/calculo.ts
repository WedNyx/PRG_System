import { avaliarSeguro, type Variaveis } from './formula'
import { imagemDaPlataforma } from '../nuvem/validacao'
import type { DadosFicha, Sistema } from './tipos'
import { bonusEquipados, lerItens, lerPoderes, lerUso, pesoTotal } from './inventario'
import { bonusDaArvore, lerArvore, sincronizarPoderes, somarBonus } from './arvore'

export type Calculo = {
  vars: Variaveis
  mods: Record<string, number>
  derivados: Record<string, number | null>
  pericias: Record<string, number | null>
  recursosMax: Record<string, number | null>
  limites: { nome: string; uso: number; max: number; excedido: boolean }[]
  /** Bônus somados pelos itens equipados, por alvo (ex.: 'derivado:ca'). */
  bonus: Record<string, number>
  carga: { total: number; max: number | null; unidade: string }
}

const num = (v: unknown, padrao = 0) => { const n = Number(v); return Number.isFinite(n) ? n : padrao }

export function fichaVazia(s: Sistema, nome = ''): DadosFicha {
  const base = fichaBase(s, nome)
  // Recursos começam cheios (vida, mana…) quando o máximo é calculado; senão, 0 até o jogador preencher.
  try {
    const c = calcular(s, base), max = c.recursosMax
    for (const r of s.recursos) {
      // Vida sem fórmula: usa o PV sugerido do sistema (igual ao combate da mesa).
      const m = max[r.id] ?? (/^(pv|vida|hp)$/i.test(r.id) ? (c.derivados.pv_max ?? c.derivados.pv_sugerido ?? null) : null)
      if (m !== null && m !== undefined && Number.isFinite(m) && m > 0) base.recursos[r.id] = { atual: m } }
  } catch { /* sem cálculo: fica 0 */ }
  return base
}

function fichaBase(s: Sistema, nome: string): DadosFicha {
  return {
    sistema: s.id, nome,
    campos: Object.fromEntries(s.campos.map(c => [c.id, c.padrao ?? (c.tipo === 'numero' ? 0 : '')])),
    atributos: Object.fromEntries(s.atributos.map(a => [a.id, a.padrao])),
    pericias: Object.fromEntries((s.pericias?.lista ?? []).map(p => [p.id, s.pericias?.modo === 'valor' ? 0 : s.pericias?.treinos?.[0]?.id ?? ''])),
    recursos: Object.fromEntries(s.recursos.map(r => [r.id, { atual: 0 }])),
    listas: Object.fromEntries(s.listas.map(l => [l.id, ''])),
    // Árvore padrão do sistema (sem nada liberado).
    ...(s.arvore?.nos?.length ? { arvore: { pontos: s.arvore.pontos ?? 0, nos: s.arvore.nos, liberados: [] } } : {}),
  }
}

/** Garante que dados antigos/incompletos tenham todas as chaves do modelo. */
export function normalizarFicha(s: Sistema, d: Partial<DadosFicha> | null | undefined): DadosFicha {
  const base = fichaVazia(s)
  if (!d || typeof d !== 'object') return base
  return {
    sistema: s.id, nome: typeof d.nome === 'string' ? d.nome.slice(0, 90) : '',
    ...(imagemDaPlataforma(d.retrato) ? { retrato: d.retrato } : {}),
    campos: { ...base.campos, ...(d.campos ?? {}) },
    atributos: { ...base.atributos, ...(d.atributos ?? {}) },
    pericias: { ...base.pericias, ...(d.pericias ?? {}) },
    recursos: { ...base.recursos, ...(d.recursos ?? {}) },
    listas: { ...base.listas, ...(d.listas ?? {}) },
    // Inventário só entra quando existe (fichas antigas continuam iguais) e sempre limpo/validado.
    ...(d.itens !== undefined ? { itens: lerItens(d.itens) } : {}), ...(d.uso !== undefined ? { uso: lerUso(d.uso) } : {}),
    // Habilidades da árvore entram/saem dos poderes conforme os hexágonos liberados.
    ...(d.arvore !== undefined ? { arvore: lerArvore(d.arvore), poderes: sincronizarPoderes(lerPoderes(d.poderes), lerArvore(d.arvore)) }
      : d.poderes !== undefined ? { poderes: lerPoderes(d.poderes) } : {}),
  }
}

/** Opção escolhida num campo “escolha” (pelo nome, sem diferenciar maiúsculas). */
export function opcaoEscolhida(c: Sistema['campos'][number], valor: unknown) {
  const v = typeof valor === 'string' ? valor.trim().toLowerCase() : ''
  return v ? c.opcoes?.find(o => o.nome.toLowerCase() === v) : undefined
}
/**
 * Tabelas de níveis que valem nesta ficha. Tabelas ligadas a uma opção (ex.: Classe → Guerreiro) só valem
 * quando a opção é escolhida, no nível do campo da escolha; as que não estão ligadas a nada valem sempre.
 */
export function progressaoAtiva(s: Sistema, d: Pick<DadosFicha, 'campos'>) {
  const p = s.progressoes
  if (!p?.classes.length) return []
  const ligadas = new Set(s.campos.flatMap(c => c.tipo === 'escolha' ? (c.opcoes ?? []).flatMap(o => o.progressao ? [o.progressao] : []) : []))
  const out: { chave: string; cl: NonNullable<Sistema['progressoes']>['classes'][number]; campoNivel: string; nome: string; escolha?: string }[] =
    p.classes.filter(cl => !ligadas.has(cl.id)).map(cl => ({ chave: cl.id, cl, campoNivel: cl.campoNivel, nome: cl.nome }))
  for (const c of s.campos) {
    if (c.tipo !== 'escolha') continue
    const op = opcaoEscolhida(c, d.campos?.[c.id])
    const cl = op?.progressao ? p.classes.find(x => x.id === op.progressao) : undefined
    if (op && cl) out.push({ chave: c.id + ':' + cl.id, cl, campoNivel: c.nivel ?? cl.campoNivel, nome: op.nome, escolha: c.nome })
  }
  return out
}
/** Campos de escolha que definem a tabela de níveis e ainda estão sem escolha. */
export const escolhasDeClassePendentes = (s: Sistema, d: Pick<DadosFicha, 'campos'>) =>
  s.campos.filter(c => c.tipo === 'escolha' && c.opcoes?.some(o => o.progressao) && !opcaoEscolhida(c, d.campos?.[c.id]))

/** Bônus das opções escolhidas (classe, espécie…), por alvo, no mesmo formato dos itens e da árvore. */
export function bonusDasEscolhas(s: Sistema, d: Pick<DadosFicha, 'campos'>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const c of s.campos) if (c.tipo === 'escolha') for (const b of opcaoEscolhida(c, d.campos?.[c.id])?.bonus ?? []) out[b.alvo] = (out[b.alvo] ?? 0) + b.valor
  return out
}

export function calcular(s: Sistema, d: DadosFicha): Calculo {
  const vars: Variaveis = {}
  const itens = lerItens(d.itens), uso = lerUso(d.uso)
  const bonus = somarBonus(bonusEquipados(itens, uso), bonusDaArvore(lerArvore(d.arvore)), bonusDasEscolhas(s, d))
  const b = (alvo: string) => bonus[alvo] ?? 0
  for (const c of s.campos) if (c.tipo === 'numero') vars[c.id] = num(d.campos[c.id])
  const mods: Record<string, number> = {}
  let soma = 0, zeros = 0, maior = -Infinity
  for (const a of s.atributos) {
    const base = Math.max(a.min, Math.min(a.max, num(d.atributos[a.id], a.padrao))), v = base + b('atributo:' + a.id)
    vars[a.id] = v; soma += base; if (base === 0) zeros++; if (base > maior) maior = base // limites de criação usam o valor sem itens
    mods[a.id] = s.formulaModificador ? (avaliarSeguro(s.formulaModificador, { X: v }) ?? v) : v
    vars['mod_' + a.id] = mods[a.id]
  }
  vars.soma_atributos = soma; vars.atributos_zero = zeros; vars.maior_atributo = maior === -Infinity ? 0 : maior

  if (s.progressoes) {
    let total = 0
    const somas: Record<string, number> = {}
    for (const { cl, campoNivel } of progressaoAtiva(s, d)) {
      const n = Math.max(0, Math.min(20, Math.floor(vars[campoNivel] ?? 0)))
      total += n
      for (const [col, valores] of Object.entries(cl.tabela)) somas[col] = (somas[col] ?? 0) + (n > 0 ? valores[n - 1] ?? 0 : 0)
    }
    for (const [col, v] of Object.entries(somas)) vars['prog_' + col] = v
    vars.nivel_total = total
  }

  // Derivados podem depender uns dos outros (ex.: nível → limite); avalia em ordem, duas passadas.
  const derivados: Record<string, number | null> = {}
  const calcDerivados = () => { for (const x of s.derivados) { const val = avaliarSeguro(x.formula, vars); derivados[x.id] = val === null ? null : val + b('derivado:' + x.id); vars[x.id] = derivados[x.id] ?? 0 } }
  calcDerivados()

  const pericias: Record<string, number | null> = {}
  let custo = 0, maiorValor = 0
  const qtd: Record<string, number> = {}
  if (s.pericias) {
    const treinos = Object.fromEntries((s.pericias.treinos ?? []).map(t => [t.id, t]))
    for (const p of s.pericias.lista) {
      const escolha = d.pericias[p.id]
      let treino = 0, valor = 0
      if (s.pericias.modo === 'valor') { valor = num(escolha); if (valor > maiorValor) maiorValor = valor }
      else {
        const t = treinos[String(escolha)] ?? s.pericias.treinos?.[0]
        if (t) { treino = avaliarSeguro(t.formula, vars) ?? 0; custo += t.custo ?? 0; qtd[t.id] = (qtd[t.id] ?? 0) + 1 }
      }
      // 'FOR/DES' = usa o melhor dos dois
      const opcoes = p.atributo ? p.atributo.split('/') : []
      const melhor = opcoes.reduce<string | null>((m, a) => m === null || (mods[a] ?? -99) > (mods[m] ?? -99) ? a : m, null)
      const atr = melhor ? vars[melhor] ?? 0 : 0
      const mod = melhor ? mods[melhor] ?? 0 : 0
      const tot = avaliarSeguro(s.pericias.total, { ...vars, ATR: atr, MOD: mod, TREINO: treino, VALOR: valor })
      pericias[p.id] = tot === null ? null : tot + b('pericia:' + p.id)
      vars['per_' + p.id] = s.pericias.modo === 'valor' ? valor : treino
      vars['tot_' + p.id] = pericias[p.id] ?? 0
    }
  }
  vars.custo_pericias = custo; vars.maior_valor_pericia = maiorValor
  for (const t of s.pericias?.treinos ?? []) vars['qtd_' + t.id] = qtd[t.id] ?? 0
  calcDerivados() // de novo, agora com as perícias disponíveis (ex.: Percepção passiva)

  const recursosMax: Record<string, number | null> = {}
  for (const r of s.recursos) {
    const manual = d.recursos[r.id]?.max
    const m = r.formula ? avaliarSeguro(r.formula, vars) : r.maxFixo ?? (manual === undefined ? null : num(manual))
    recursosMax[r.id] = m === null ? null : m + b('recurso:' + r.id)
  }
  vars.carga_total = pesoTotal(itens, uso)
  const carga = { total: vars.carga_total, max: s.carga?.formula ? avaliarSeguro(s.carga.formula, vars) : null, unidade: s.carga?.unidade ?? 'kg' }
  const limites = (s.limites ?? []).map(l => {
    const uso = avaliarSeguro(l.uso, vars) ?? 0, max = avaliarSeguro(l.max, vars) ?? 0
    return { nome: l.nome, uso, max, excedido: uso > max }
  })
  return { vars, mods, derivados, pericias, recursosMax, limites, bonus, carga }
}
