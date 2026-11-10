import { avaliarSeguro, type Variaveis } from './formula'
import { imagemDaPlataforma } from '../nuvem/validacao'
import type { DadosFicha, Sistema } from './tipos'
import { bonusEquipados, lerItens, lerPoderes, lerUso, pesoTotal } from './inventario'

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
  return {
    sistema: s.id, nome,
    campos: Object.fromEntries(s.campos.map(c => [c.id, c.padrao ?? (c.tipo === 'numero' ? 0 : '')])),
    atributos: Object.fromEntries(s.atributos.map(a => [a.id, a.padrao])),
    pericias: Object.fromEntries((s.pericias?.lista ?? []).map(p => [p.id, s.pericias?.modo === 'valor' ? 0 : s.pericias?.treinos?.[0]?.id ?? ''])),
    recursos: Object.fromEntries(s.recursos.map(r => [r.id, { atual: 0 }])),
    listas: Object.fromEntries(s.listas.map(l => [l.id, ''])),
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
    ...(d.itens !== undefined ? { itens: lerItens(d.itens) } : {}), ...(d.poderes !== undefined ? { poderes: lerPoderes(d.poderes) } : {}), ...(d.uso !== undefined ? { uso: lerUso(d.uso) } : {}),
  }
}

export function calcular(s: Sistema, d: DadosFicha): Calculo {
  const vars: Variaveis = {}
  const itens = lerItens(d.itens), uso = lerUso(d.uso)
  const bonus = bonusEquipados(itens, uso)
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
    for (const cl of s.progressoes.classes) {
      const n = Math.max(0, Math.min(20, Math.floor(vars[cl.campoNivel] ?? 0)))
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
