import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validarSistema } from './autoral'
import { fichaVazia, tornarManual } from './calculo'

describe('Lunethernnyis: Opositores (sistema autoral do Wed, v0.35.8)', () => {
  const def = JSON.parse(readFileSync(join(process.cwd(), 'supabase/sementes/opositores.json'), 'utf8'))
  const r = validarSistema(def, { id: 'autoral-' + 'c'.repeat(32), autor: 'Wed' })
  it('passa no construtor sem perder nada', () => {
    expect(r.ok, JSON.stringify(!r.ok && r.erros)).toBe(true)
    if (!r.ok) return
    const s = r.sistema
    expect(s.visualAtributos).toBe('lua')
    expect(s.atributos.map(a => a.id)).toEqual(['POT', 'DES', 'REF', 'TEN', 'ENG', 'VON', 'SIN'])
    expect(s.pericias?.lista).toHaveLength(24)
    expect(s.pericias?.treinos?.map(t => t.formula)).toEqual(['0', '3', '6', '9'])
    expect(s.regras?.length).toBe(12)
  })
  it('ficha nova: PV 25 + TEN × 5, Defesa 10 + REF e limite de atributo pelo nível', () => {
    if (!r.ok) return
    const d = tornarManual(r.sistema, fichaVazia(r.sistema))
    expect(d.recursos.pv.max).toBe(30)
    expect(d.manual?.derivados.defesa).toBe(11)
    for (const [nivel, lim] of [[1, 3], [3, 3], [4, 4], [7, 4], [8, 5], [10, 5]]) {
      const x = tornarManual(r.sistema, { ...fichaVazia(r.sistema), campos: { ...fichaVazia(r.sistema).campos, nivel } })
      expect(x.manual?.derivados.limite_atributo, 'nível ' + nivel).toBe(lim)
    }
  })
})
