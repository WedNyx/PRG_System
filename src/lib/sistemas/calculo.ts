import { avaliarSeguro, type Variaveis } from './formula'
import type { DadosFicha, Sistema } from './tipos'

export type Calculo = {
  vars: Variaveis
  mods: Record<string, number>
  derivados: Record<string, number | null>
  pericias: Record<string, number | null>
  recursosMax: Record<string, number | null>
  limites: { nome: string; uso: number; max: number; excedido: boolean }[]
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
    campos: { ...base.campos, ...(d.campos ?? {}) },
    atributos: { ...base.atributos, ...(d.atributos ?? {}) },
    pericias: { ...base.pericias, ...(d.pericias ?? {}) },
    recursos: { ...base.recursos, ...(d.recursos ?? {}) },
    listas: { ...base.listas, ...(d.listas ?? {}) },
  }
}

export function calcular(s: Sistema, d: DadosFicha): Calculo {
  const vars: Variaveis = {}
  for (const c of s.campos) if (c.tipo === 'numero') vars[c.id] = num(d.campos[c.id])
  const mods: Record<string, number> = {}
  let soma = 0, zeros = 0, maior = -Infinity
  for (const a of s.atributos) {
    const v = Math.max(a.min, Math.min(a.max, num(d.atributos[a.id], a.padrao)))
    vars[a.id] = v; soma += v; if (v === 0) zeros++; if (v > maior) maior = v
    mods[a.id] = s.formulaModificador ? (avaliarSeguro(s.formulaModificador, { X: v }) ?? v) : v
    vars['mod_' + a.id] = mods[a.id]
  }
  vars.soma_atributos = soma; vars.atributos_zero = zeros; vars.maior_atributo = maior === -Infinity ? 0 : maior

  // Derivados podem depender uns dos outros (ex.: nível → limite); avalia em ordem, duas passadas.
  const derivados: Record<string, number | null> = {}
  const calcDerivados = () => { for (const x of s.derivados) { derivados[x.id] = avaliarSeguro(x.formula, vars); vars[x.id] = derivados[x.id] ?? 0 } }
  calcDerivados()

  const pericias: Record<string, number | null> = {}
  let custo = 0
  const qtd: Record<string, number> = {}
  if (s.pericias) {
    const treinos = Object.fromEntries((s.pericias.treinos ?? []).map(t => [t.id, t]))
    for (const p of s.pericias.lista) {
      const escolha = d.pericias[p.id]
      let treino = 0, valor = 0
      if (s.pericias.modo === 'valor') valor = num(escolha)
      else {
        const t = treinos[String(escolha)] ?? s.pericias.treinos?.[0]
        if (t) { treino = avaliarSeguro(t.formula, vars) ?? 0; custo += t.custo ?? 0; qtd[t.id] = (qtd[t.id] ?? 0) + 1 }
      }
      const atr = p.atributo ? vars[p.atributo] ?? 0 : 0
      const mod = p.atributo ? mods[p.atributo] ?? 0 : 0
      pericias[p.id] = avaliarSeguro(s.pericias.total, { ...vars, ATR: atr, MOD: mod, TREINO: treino, VALOR: valor })
      vars['per_' + p.id] = s.pericias.modo === 'valor' ? valor : treino
      vars['tot_' + p.id] = pericias[p.id] ?? 0
    }
  }
  vars.custo_pericias = custo
  for (const t of s.pericias?.treinos ?? []) vars['qtd_' + t.id] = qtd[t.id] ?? 0
  calcDerivados() // de novo, agora com as perícias disponíveis (ex.: Percepção passiva)

  const recursosMax: Record<string, number | null> = {}
  for (const r of s.recursos) {
    const manual = d.recursos[r.id]?.max
    recursosMax[r.id] = r.formula ? avaliarSeguro(r.formula, vars) : r.maxFixo ?? (manual === undefined ? null : num(manual))
  }
  const limites = (s.limites ?? []).map(l => {
    const uso = avaliarSeguro(l.uso, vars) ?? 0, max = avaliarSeguro(l.max, vars) ?? 0
    return { nome: l.nome, uso, max, excedido: uso > max }
  })
  return { vars, mods, derivados, pericias, recursosMax, limites }
}
