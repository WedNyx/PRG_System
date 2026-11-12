/**
 * Descanso curto e longo (v0.32.3). Funções puras (descanso.test.ts), usadas pela ficha e pelo servidor.
 * Longo: recursos voltam ao máximo, recursos “temporários” zeram e todos os usos de poderes voltam.
 * Curto: voltam os usos dos poderes marcados “descanso curto” e, se informado, cura um pouco da vida.
 */
import { calcular, normalizarFicha } from './calculo'
import { lerPoderes, lerUso } from './inventario'
import type { DadosFicha, Sistema } from './tipos'

export type TipoDescanso = 'curto' | 'longo'
export type ResultadoDescanso = { d: DadosFicha; mudancas: string[] }

const TEMP = /temp/i
const VIDA = /^(pv|vida|hp|pontos_de_vida)$/i

/** Máximo de um recurso (mesma regra da ficha e do combate). */
export function maximosDosRecursos(s: Sistema, d: DadosFicha): Record<string, number | null> {
  const c = calcular(s, d)
  return Object.fromEntries(s.recursos.map(r => {
    const calc = !!r.formula || r.maxFixo !== undefined
    const m = c.recursosMax[r.id] ?? (calc ? null : (d.recursos[r.id]?.max !== undefined ? Number(d.recursos[r.id]?.max) : null))
      ?? (/^(pv|vida|hp)/i.test(r.id) ? (c.derivados.pv_max ?? c.derivados.pv_sugerido ?? null) : null)
    return [r.id, m !== null && Number.isFinite(m) ? m : null]
  }))
}

/** Recurso de vida do sistema (PV, Vida…). */
export const recursoDeVida = (s: Sistema) => s.recursos.find(r => VIDA.test(r.id)) ?? s.recursos.find(r => /^(pv|vida|hp)/i.test(r.id)) ?? null

export function aplicarDescanso(s: Sistema, bruto: Partial<DadosFicha>, tipo: TipoDescanso, opcoes: { cura?: number } = {}): ResultadoDescanso {
  const d = normalizarFicha(s, bruto)
  const max = maximosDosRecursos(s, d)
  const recursos = { ...d.recursos }, mudancas: string[] = []
  const uso = lerUso(d.uso), poderes = lerPoderes(d.poderes)

  if (tipo === 'longo') {
    for (const r of s.recursos) {
      const atual = Number(recursos[r.id]?.atual ?? 0) || 0
      if (TEMP.test(r.id) || TEMP.test(r.nome)) { if (atual) { recursos[r.id] = { ...recursos[r.id], atual: 0 }; mudancas.push(`${r.nome}: ${atual} → 0`) } continue }
      // Marcadores (Exaustão, Morrendo, Estresse…) não enchem: só baixam o quanto a regra manda.
      if (r.contador) { const novo = Math.max(0, atual - (r.baixaNoDescanso ?? 0)); if (novo !== atual) { recursos[r.id] = { ...recursos[r.id], atual: novo }; mudancas.push(`${r.nome}: ${atual} → ${novo}`) } continue }
      const m = max[r.id]
      if (m !== null && m > 0 && atual < m) { recursos[r.id] = { ...recursos[r.id], atual: m }; mudancas.push(`${r.nome}: ${atual} → ${m}`) }
    }
  } else {
    // Descanso curto: recursos marcados (Surto de Ação, Foco, Magia de Pacto…) voltam ao máximo.
    for (const r of s.recursos) if (r.voltaNoCurto) {
      const atual = Number(recursos[r.id]?.atual ?? 0) || 0, m = max[r.id]
      if (m !== null && m > 0 && atual < m) { recursos[r.id] = { ...recursos[r.id], atual: m }; mudancas.push(`${r.nome}: ${atual} → ${m}`) }
    }
  }
  if (tipo === 'curto' && opcoes.cura && opcoes.cura > 0) {
    const v = recursoDeVida(s)
    if (v) {
      const atual = Number(recursos[v.id]?.atual ?? 0) || 0, m = max[v.id]
      const novo = m !== null && m > 0 ? Math.min(m, atual + Math.floor(opcoes.cura)) : atual + Math.floor(opcoes.cura)
      if (novo !== atual) { recursos[v.id] = { ...recursos[v.id], atual: novo }; mudancas.push(`${v.nome}: ${atual} → ${novo}`) }
    }
  }

  const voltam = poderes.filter(p => p.usosMax && (uso.poderes[p.id] ?? 0) > 0 && (tipo === 'longo' || p.recarga === 'curto'))
  const usoPoderes = { ...uso.poderes }
  for (const p of voltam) delete usoPoderes[p.id]
  if (voltam.length) mudancas.push(voltam.length === 1 ? `Usos de ${voltam[0].nome} recuperados` : `Usos de ${voltam.length} poderes recuperados`)

  return { d: { ...d, recursos, uso: { ...uso, poderes: usoPoderes } }, mudancas }
}
